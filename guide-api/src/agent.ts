import Anthropic from '@anthropic-ai/sdk'

import type { Knowledge } from './knowledge.ts'
import { GUIDE_RULES } from './prompt.ts'
import { TOOLS, TurnState, type GuideAction } from './tools.ts'

export type GuideEvent =
  | { t: 'text'; d: string }
  | { t: 'action'; action: GuideAction }
  | { t: 'done' }
  | { t: 'error'; code: string; message: string }

export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number }

/** Claude Haiku 5.5 rates per million tokens for prompts up to 100K tokens (cache write is the 5-minute rate). */
const RATES = { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 }
const MAX_ITERATIONS = 4

export function costUsd(usage: Usage) {
  return (
    usage.input * RATES.input + usage.output * RATES.output + usage.cacheRead * RATES.cacheRead + usage.cacheWrite * RATES.cacheWrite
  ) / 1_000_000
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
}): Promise<Usage> {
  const { client, model, knowledge, emit, signal } = options
  const state = new TurnState(knowledge)
  const messages = [...options.messages]
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: GUIDE_RULES },
    {
      type: 'text',
      text: `<portfolio_knowledge version="${knowledge.version}">\n${knowledge.knowledge}\n</portfolio_knowledge>`,
      cache_control: { type: 'ephemeral' },
    },
  ]
  let lastText = ''
  let spoken = ''

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const stream = client.messages.stream(
      { model, max_tokens: 1500, output_config: { effort: 'low' }, tools: TOOLS, system, messages },
      { signal },
    )
    let separated = iteration === 0
    stream.on('text', (delta) => {
      // Keep sentences apart across tool calls so the voice doesn't run them together.
      if (!separated && lastText && !/\s$/.test(lastText)) emit({ t: 'text', d: ' ' })
      separated = true
      lastText = delta
      spoken += delta
      emit({ t: 'text', d: delta })
    })

    const message = await stream.finalMessage()
    usage.input += message.usage.input_tokens
    usage.output += message.usage.output_tokens
    usage.cacheRead += message.usage.cache_read_input_tokens ?? 0
    usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0

    if (message.stop_reason === 'refusal') {
      emit({ t: 'error', code: 'refusal', message: "I can't help with that one, but I'm happy to talk about Neerav's work." })
      break
    }
    const calls = message.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
    if (message.stop_reason !== 'tool_use' || !calls.length) break

    const results: Anthropic.ToolResultBlockParam[] = calls.map((call) => {
      const outcome = state.run(call.name, call.input)
      if (outcome.ok) emit({ t: 'action', action: outcome.action })
      // Text before the call has already been spoken; without this reminder the model tends to say it again.
      const result = outcome.ok && spoken.trim() ? { ...outcome.result, note: 'Your text so far has already been spoken. Do not repeat it; add only something new, or nothing.' } : outcome.ok ? outcome.result : outcome.error
      return { type: 'tool_result', tool_use_id: call.id, is_error: !outcome.ok, content: JSON.stringify(result) }
    })
    messages.push({ role: 'assistant', content: message.content }, { role: 'user', content: results })
  }

  return usage
}
