import Anthropic from '@anthropic-ai/sdk'

import type { Knowledge } from './knowledge.ts'
import { GUIDE_RULES } from './prompt.ts'
import { DECLINE_FALLBACK, TOOLS, TurnState, type GuideAction } from './tools.ts'

export type GuideEvent =
  | { t: 'meta'; requestId: string }
  | { t: 'text'; d: string }
  | { t: 'heard'; d: string }
  | { t: 'action'; action: GuideAction }
  | { t: 'done'; offTopic?: true }
  | { t: 'error'; code: string; message: string; stage?: 'admission' | 'knowledge' | 'response'; requestId?: string; retryable?: boolean }

export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number }

/** Claude Haiku 5.5 rates per million tokens for prompts up to 100K tokens (cache write is the 5-minute rate). */
const RATES = { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 }
const MAX_ITERATIONS = 4
// Haiku 5.5 thinks adaptively by default and thinking counts toward this cap. Hiring answers with a tour
// exceeded 1,500 tokens and came back empty, so leave headroom; generation still stops when the answer does.
const MAX_TOKENS = 8000
const TRUNCATED_FALLBACK = "Sorry, I lost my train of thought there. Could you ask that again, maybe a little more briefly?"

export function costUsd(usage: Usage) {
  return (
    usage.input * RATES.input + usage.output * RATES.output + usage.cacheRead * RATES.cacheRead + usage.cacheWrite * RATES.cacheWrite
  ) / 1_000_000
}

const SHOWN_NOTE = /\s*\(Shown on the page: ([^)]*)\)/g

/**
 * The browser appends "(Shown on the page: ...)" to the guide's earlier answers. Left inside assistant turns,
 * the model copies that note into new answers and it gets spoken, so it moves to the next visitor turn as context.
 */
export function toApiMessages(messages: Array<{ role: 'user' | 'assistant'; content: string }>, route: string, spoken = false): Anthropic.MessageParam[] {
  let shown: string[] = []
  return messages.map((message, index) => {
    if (message.role === 'assistant') {
      shown = [...message.content.matchAll(SHOWN_NOTE)].map((match) => match[1].trim())
      return { role: 'assistant', content: message.content.replace(SHOWN_NOTE, '').trim() || '…' }
    }
    const context: string[] = []
    if (shown.length) context.push(`[Your previous answer showed on the page: ${shown.join('; ')}]`)
    if (index === messages.length - 1) context.push(`[The visitor is currently on ${route}]`)
    if (index === messages.length - 1 && spoken) context.push('[Asked by voice: this is the speech recognizer\'s transcript]')
    shown = []
    if (!context.length) return message
    return { role: 'user', content: [...context.map((text) => ({ type: 'text' as const, text })), { type: 'text' as const, text: message.content }] }
  })
}

const HEARD_OPEN = '<heard>'
const HEARD_CLOSE = '</heard>'

/**
 * Spoken questions arrive as the browser misheard them ("What has need of built"). The model opens its reply with
 * <heard>the question as the visitor most likely said it</heard>; this filter takes that line out of the spoken
 * answer and hands it to the browser, which shows it in place of the raw transcript. Replies without it pass through.
 */
export class HeardFilter {
  private buffer = ''
  private settled = false
  private readonly onHeard: (question: string) => void

  constructor(onHeard: (question: string) => void) {
    this.onHeard = onHeard
  }

  /** Returns the part of this delta that belongs to the answer. */
  push(delta: string): string {
    if (this.settled) return delta
    this.buffer += delta
    const text = this.buffer.trimStart()
    if (text.length < HEARD_OPEN.length) return HEARD_OPEN.startsWith(text) ? '' : this.release()
    if (!text.startsWith(HEARD_OPEN)) return this.release()
    const end = text.indexOf(HEARD_CLOSE)
    if (end < 0) return text.length > 400 ? this.release() : ''
    const question = text.slice(HEARD_OPEN.length, end).trim()
    if (question) this.onHeard(question)
    this.settled = true
    this.buffer = ''
    return text.slice(end + HEARD_CLOSE.length).trimStart()
  }

  /**
   * Anything still held back once the model stops writing. A step with no text (a page action first) leaves the
   * filter watching, so a heard line written after the action is still taken out.
   */
  flush(): string {
    return this.settled || !this.buffer ? '' : this.release()
  }

  private release() {
    this.settled = true
    const text = this.buffer
    this.buffer = ''
    return text
  }
}

export function needsPostToolResponse(spoken: string, allSucceeded: boolean) {
  return !spoken.trim() || !allSucceeded
}

/**
 * One visitor turn: stream the reply, run the guide's tools against the registry, and loop until the model is done.
 * The model only proposes targets; TurnState decides what is valid, and only valid actions reach the browser.
 */
export async function runGuideTurn(options: {
  client: Anthropic
  model: string
  knowledge: Knowledge
  messages: Anthropic.MessageParam[]
  emit: (event: GuideEvent) => void
  signal?: AbortSignal
}): Promise<{ usage: Usage; offTopic: boolean }> {
  const { client, model, knowledge, emit, signal } = options
  const state = new TurnState(knowledge)
  const messages = [...options.messages]
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
  const actionMetadata = [
    '<action_metadata>',
    'Targets accepted by show_on_page and start_tour:',
    ...knowledge.targets.map((target) => `${target.id} | ${target.label} | ${target.route}${target.anchor ? `#${target.anchor}` : ''}`),
    'Links accepted by offer_links:',
    ...knowledge.links.map((link) => `${link.id} | ${link.label}`),
    '</action_metadata>',
  ].join('\n')
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: GUIDE_RULES },
    {
      type: 'text',
      text: `<portfolio_knowledge version="${knowledge.version}">\n${knowledge.knowledge}\n</portfolio_knowledge>`,
      cache_control: { type: 'ephemeral' },
    },
    { type: 'text', text: actionMetadata },
  ]
  let lastText = ''
  let spoken = ''
  let acted = false
  let separated = true
  const heard = new HeardFilter((question) => emit({ t: 'heard', d: question }))
  const say = (text: string) => {
    if (!text) return
    // Keep sentences apart across tool calls so the voice doesn't run them together.
    if (!separated && lastText && !/\s$/.test(lastText)) emit({ t: 'text', d: ' ' })
    separated = true
    lastText = text
    spoken += text
    emit({ t: 'text', d: text })
  }

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const stream = client.messages.stream(
      { model, max_tokens: MAX_TOKENS, output_config: { effort: 'low' }, tools: TOOLS, system, messages },
      { signal },
    )
    separated = iteration === 0
    stream.on('text', (delta) => say(heard.push(delta)))

    const message = await stream.finalMessage()
    say(heard.flush())
    usage.input += message.usage.input_tokens
    usage.output += message.usage.output_tokens
    usage.cacheRead += message.usage.cache_read_input_tokens ?? 0
    usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0

    if (message.stop_reason === 'max_tokens') {
      console.warn(JSON.stringify({ event: 'max_tokens', iteration }))
      // A truncated turn must never end silently for the visitor.
      if (!spoken.trim() && !acted) emit({ t: 'text', d: TRUNCATED_FALLBACK })
      break
    }
    if (message.stop_reason === 'refusal') {
      emit({ t: 'error', code: 'refusal', message: "I can't help with that one, but I'm happy to talk about Neerav's work." })
      break
    }
    const calls = message.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
    if (message.stop_reason !== 'tool_use' || !calls.length) break

    const outcomes = calls.map((call) => ({ call, outcome: state.run(call.name, call.input) }))
    for (const { call, outcome } of outcomes) if (!outcome.ok) console.warn(JSON.stringify({ event: 'tool_error', tool: call.name, error: outcome.error }))
    const results: Anthropic.ToolResultBlockParam[] = outcomes.map(({ call, outcome }) => {
      if (outcome.ok && outcome.action) {
        acted = true
        emit({ t: 'action', action: outcome.action })
      }
      return { type: 'tool_result', tool_use_id: call.id, is_error: !outcome.ok, content: JSON.stringify(outcome.ok ? outcome.result : outcome.error) }
    })
    // A decline needs no second model call: the visitor already heard it, or gets the fixed line.
    if (calls.every((call) => call.name === 'decline_off_topic')) {
      if (!spoken.trim()) emit({ t: 'text', d: DECLINE_FALLBACK })
      break
    }
    // The complete answer has already been spoken and every requested action succeeded.
    // Do not ask the model for a redundant post-tool sentence.
    if (!needsPostToolResponse(spoken, outcomes.every(({ outcome }) => outcome.ok))) break
    messages.push({ role: 'assistant', content: message.content }, { role: 'user', content: results })
  }

  return { usage, offTopic: state.offTopic }
}
