import Anthropic from '@anthropic-ai/sdk'

import { costUsd, runGuideTurn, type GuideEvent } from './agent.ts'
import { Guard } from './guard.ts'
import { loadKnowledge } from './knowledge.ts'
import { runMockTurn } from './mock.ts'

export { Guard }

type Env = {
  ANTHROPIC_API_KEY?: string
  GUIDE_MOCK?: string
  ALLOWED_ORIGINS: string
  KNOWLEDGE_URL: string
  MODEL: string
  DAILY_BUDGET_USD: string
  RATE_LIMIT_PER_10_MIN: string
  GUARD: DurableObjectNamespace<Guard>
}

type IncomingMessage = { role: 'user' | 'assistant'; content: string }

const MAX_HISTORY = 16
const MAX_USER_CHARS = 8000 // room for a pasted job description
const MAX_ASSISTANT_CHARS = 2000

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim())
  if (!origin || !allowed.includes(origin)) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json' } })
}

/** Accepts only plain-text turns ending with the visitor's message; anything else is a 400. */
function parseMessages(raw: unknown): IncomingMessage[] | null {
  if (!Array.isArray(raw) || !raw.length) return null
  const messages: IncomingMessage[] = []
  for (const item of raw.slice(-MAX_HISTORY)) {
    const role = item?.role
    const content = typeof item?.content === 'string' ? item.content.trim() : ''
    if ((role !== 'user' && role !== 'assistant') || !content) return null
    if (content.length > (role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS)) return null
    messages.push({ role, content })
  }
  while (messages[0]?.role === 'assistant') messages.shift()
  return messages.length && messages.at(-1)!.role === 'user' ? messages : null
}

async function visitorKey(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') || 'local'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${new Date().toISOString().slice(0, 10)}:${ip}`))
  return [...new Uint8Array(digest).slice(0, 8)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url)
    const cors = corsHeaders(request.headers.get('origin'), env)
    const mock = env.GUIDE_MOCK === '1' || !env.ANTHROPIC_API_KEY

    if (request.method === 'OPTIONS') return new Response(null, { status: cors['access-control-allow-origin'] ? 204 : 403, headers: cors })
    if (url.pathname === '/health') return json({ ok: true, mock }, 200, cors)
    if (url.pathname !== '/chat' || request.method !== 'POST') return json({ error: 'not_found' }, 404, cors)
    if (!cors['access-control-allow-origin']) return json({ error: 'origin_not_allowed' }, 403, cors)

    let body: { messages?: unknown; route?: unknown }
    try {
      body = await request.json()
    } catch {
      return json({ error: 'invalid_json' }, 400, cors)
    }
    const messages = parseMessages(body.messages)
    if (!messages) return json({ error: 'invalid_messages' }, 400, cors)
    const route = typeof body.route === 'string' && /^\/[a-z0-9\-/]{0,120}$/i.test(body.route) ? body.route : '/'

    const guard = env.GUARD.get(env.GUARD.idFromName('global'))
    const admission = await guard.admit(await visitorKey(request), Number(env.RATE_LIMIT_PER_10_MIN) || 20, Number(env.DAILY_BUDGET_USD) || 1)
    if (!admission.ok) {
      return json({ error: admission.reason }, 429, { ...cors, 'retry-after': String(admission.retryAfterSeconds) })
    }

    let knowledge
    try {
      knowledge = await loadKnowledge(env.KNOWLEDGE_URL)
    } catch (error) {
      console.error('knowledge unavailable', error)
      return json({ error: 'knowledge_unavailable' }, 503, cors)
    }

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()
    const abort = new AbortController()
    const emit = (event: GuideEvent) => {
      writer.write(encoder.encode(`${JSON.stringify(event)}\n`)).catch(() => abort.abort())
    }

    const turn = async () => {
      try {
        if (mock) {
          await runMockTurn(knowledge, messages.at(-1)!.content, emit)
        } else {
          // The current page travels with the visitor's message, after the cached prefix.
          const apiMessages: Anthropic.MessageParam[] = messages.map((message, index) =>
            index === messages.length - 1
              ? { role: 'user', content: [{ type: 'text', text: `[The visitor is currently on ${route}]` }, { type: 'text', text: message.content }] }
              : message,
          )
          const usage = await runGuideTurn({
            client: new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 }),
            model: env.MODEL || 'claude-haiku-5-5',
            knowledge,
            messages: apiMessages,
            emit,
            signal: abort.signal,
          })
          const cost = costUsd(usage)
          console.log(JSON.stringify({ event: 'turn', ...usage, costUsd: Number(cost.toFixed(6)), knowledge: knowledge.version }))
          ctx.waitUntil(guard.record(cost))
        }
        emit({ t: 'done' })
      } catch (error) {
        if (!abort.signal.aborted) {
          console.error('turn failed', error)
          const busy = error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError
          emit({ t: 'error', code: busy ? 'busy' : 'failed', message: busy ? 'The guide is busy right now. Please try again in a moment.' : 'Something went wrong on my side. Please try again.' })
        }
      } finally {
        await writer.close().catch(() => {})
      }
    }
    ctx.waitUntil(turn())

    return new Response(readable, {
      headers: { ...cors, 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' },
    })
  },
} satisfies ExportedHandler<Env>
