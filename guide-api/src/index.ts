import Anthropic from '@anthropic-ai/sdk'

import { costUsd, runGuideTurn, toApiMessages, type GuideEvent } from './agent.ts'
import { classifyTurnError, errorIdentity } from './diagnostics.ts'
import { parseMessages } from './messages.ts'
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
  MONTHLY_BUDGET_USD: string
  RATE_LIMIT_PER_10_MIN: string
  TURNS_PER_VISITOR_PER_DAY: string
  OFF_TOPIC_PER_VISITOR_PER_DAY: string
  GUARD: DurableObjectNamespace<Guard>
}

const CLIENT_EVENTS = new Set(['guide_opened', 'voice_load', 'voice_failure', 'turn_complete', 'turn_error', 'first_audio'])

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim())
  if (!origin || !allowed.includes(origin)) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-expose-headers': 'x-guide-request-id',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

function identified(headers: Record<string, string>, requestId: string) {
  return { ...headers, 'x-guide-request-id': requestId }
}

function validRequestId(value: unknown) {
  return typeof value === 'string' && /^[a-f0-9-]{16,64}$/i.test(value) ? value : undefined
}

function finiteMetric(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 600_000 ? Math.round(value) : undefined
}

function telemetryRecord(body: unknown, fallbackRequestId: string) {
  if (!body || typeof body !== 'object') return null
  const input = body as Record<string, unknown>
  if (typeof input.event !== 'string' || !CLIENT_EVENTS.has(input.event)) return null
  const device = input.device && typeof input.device === 'object' ? (input.device as Record<string, unknown>) : {}
  const error = input.error && typeof input.error === 'object' ? (input.error as Record<string, unknown>) : {}
  const voice = input.voice && typeof input.voice === 'object' ? (input.voice as Record<string, unknown>) : {}
  const safeString = (value: unknown, allowed: RegExp) => typeof value === 'string' && value.length <= 48 && allowed.test(value) ? value : undefined
  return {
    event: 'client_telemetry',
    clientEvent: input.event,
    requestId: validRequestId(input.requestId) || fallbackRequestId,
    elapsedMs: finiteMetric(input.elapsedMs),
    firstTextMs: finiteMetric(input.firstTextMs),
    responseMs: finiteMetric(input.responseMs),
    deviceClass: safeString(device.class, /^(mobile|tablet|desktop)$/),
    browser: safeString(device.browser, /^(chromium|safari|firefox|other)$/),
    network: safeString(device.network, /^(slow-2g|2g|3g|4g|unknown)$/),
    saveData: typeof device.saveData === 'boolean' ? device.saveData : undefined,
    voiceStatus: safeString(voice.status, /^(ready|failed|fallback)$/),
    voiceDevice: safeString(voice.device, /^[a-z0-9 ._/-]+$/i),
    fallbackFrom: safeString(voice.fallbackFrom, /^[a-z0-9 ._/-]+$/i),
    errorStage: safeString(error.stage, /^(admission|knowledge|response|network|speech)$/),
    errorCode: safeString(error.code, /^[a-z0-9_-]+$/i),
    retryable: typeof error.retryable === 'boolean' ? error.retryable : undefined,
  }
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json' } })
}

/** Accepts only plain-text turns ending with the visitor's message; anything else is a 400. */
async function visitorKey(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') || 'local'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${new Date().toISOString().slice(0, 10)}:${ip}`))
  return [...new Uint8Array(digest).slice(0, 8)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const requestId = crypto.randomUUID()
    const url = new URL(request.url)
    const cors = corsHeaders(request.headers.get('origin'), env)
    const responseHeaders = identified(cors, requestId)
    const mock = env.GUIDE_MOCK === '1' || !env.ANTHROPIC_API_KEY

    if (request.method === 'OPTIONS') return new Response(null, { status: cors['access-control-allow-origin'] ? 204 : 403, headers: responseHeaders })
    if (url.pathname === '/health') return json({ ok: true, mock }, 200, responseHeaders)
    if (!cors['access-control-allow-origin']) return json({ error: 'origin_not_allowed', stage: 'admission', requestId, retryable: false }, 403, responseHeaders)
    if (url.pathname === '/telemetry' && request.method === 'POST') {
      const raw = await request.text()
      if (raw.length > 4096) return json({ error: 'telemetry_too_large', stage: 'admission', requestId, retryable: false }, 413, responseHeaders)
      let payload: unknown
      try {
        payload = JSON.parse(raw || '{}')
      } catch {
        payload = null
      }
      const record = telemetryRecord(payload, requestId)
      if (!record) return json({ error: 'invalid_telemetry', stage: 'admission', requestId, retryable: false }, 400, responseHeaders)
      console.log(record)
      return new Response(null, { status: 204, headers: responseHeaders })
    }
    if (url.pathname !== '/chat' || request.method !== 'POST') return json({ error: 'not_found', stage: 'admission', requestId, retryable: false }, 404, responseHeaders)

    let body: { messages?: unknown; route?: unknown; spoken?: unknown }
    try {
      body = await request.json()
    } catch {
      return json({ error: 'invalid_json', stage: 'admission', requestId, retryable: false }, 400, responseHeaders)
    }
    const messages = parseMessages(body.messages)
    if (!messages) return json({ error: 'invalid_messages', stage: 'admission', requestId, retryable: false }, 400, responseHeaders)
    const route = typeof body.route === 'string' && /^\/[a-z0-9\-/]{0,120}$/i.test(body.route) ? body.route : '/'

    const guard = env.GUARD.get(env.GUARD.idFromName('global'))
    const visitor = await visitorKey(request)
    const admission = await guard.admit(visitor, {
      perWindow: Number(env.RATE_LIMIT_PER_10_MIN) || 20,
      perVisitorPerDay: Number(env.TURNS_PER_VISITOR_PER_DAY) || 40,
      offTopicPerVisitorPerDay: Number(env.OFF_TOPIC_PER_VISITOR_PER_DAY) || 3,
      dailyBudgetUsd: Number(env.DAILY_BUDGET_USD) || 1,
      monthlyBudgetUsd: Number(env.MONTHLY_BUDGET_USD) || 5,
    })
    if (!admission.ok) {
      return json({ error: admission.reason, stage: 'admission', requestId, retryable: true }, 429, { ...responseHeaders, 'retry-after': String(admission.retryAfterSeconds) })
    }

    let knowledge
    try {
      knowledge = await loadKnowledge(env.KNOWLEDGE_URL)
    } catch (error) {
      console.error({ event: 'knowledge_unavailable', requestId, ...errorIdentity(error) })
      return json({ error: 'knowledge_unavailable', stage: 'knowledge', requestId, retryable: true }, 503, responseHeaders)
    }

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()
    const abort = new AbortController()
    const emit = (event: GuideEvent) => {
      writer.write(encoder.encode(`${JSON.stringify(event)}\n`)).catch(() => abort.abort())
    }

    const turn = async () => {
      emit({ t: 'meta', requestId })
      try {
        if (mock) {
          await runMockTurn(knowledge, messages.at(-1)!.content, emit)
        } else {
          // The current page and earlier page moves travel with the visitor's messages, after the cached prefix.
          const apiMessages = toApiMessages(messages, route, body.spoken === true)
          const { usage, offTopic } = await runGuideTurn({
            client: new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 }),
            model: env.MODEL || 'claude-haiku-5-5',
            knowledge,
            messages: apiMessages,
            emit,
            signal: abort.signal,
          })
          const cost = costUsd(usage)
          console.log(JSON.stringify({ event: 'turn', ...usage, costUsd: Number(cost.toFixed(6)), offTopic, knowledge: knowledge.version }))
          ctx.waitUntil(guard.record(visitor, cost, offTopic))
          if (offTopic) {
            emit({ t: 'done', offTopic: true })
            return
          }
        }
        emit({ t: 'done' })
      } catch (error) {
        if (!abort.signal.aborted) {
          const failure = classifyTurnError(error)
          console.error({ event: 'turn_failed', requestId, code: failure.code, stage: failure.stage, retryable: failure.retryable, status: failure.status, errorName: failure.name })
          emit({ t: 'error', code: failure.code, message: failure.message, stage: failure.stage, requestId, retryable: failure.retryable })
        }
      } finally {
        await writer.close().catch(() => {})
      }
    }
    ctx.waitUntil(turn())

    return new Response(readable, {
      headers: { ...responseHeaders, 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' },
    })
  },
} satisfies ExportedHandler<Env>
