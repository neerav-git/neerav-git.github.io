export type GuideAction =
  | { type: 'show'; target: string }
  | { type: 'tour'; steps: Array<{ target: string; narration: string }> }
  | { type: 'links'; links: string[] }

export type GuideEvent =
  | { t: 'meta'; requestId: string }
  | { t: 'text'; d: string }
  /** A spoken question as the guide understood it, shown in place of the raw transcript. */
  | { t: 'heard'; d: string }
  | { t: 'action'; action: GuideAction }
  | { t: 'done' }
  | { t: 'error'; code: string; message: string; stage?: 'admission' | 'knowledge' | 'response'; requestId?: string; retryable?: boolean }

export type GuideTurn = { role: 'user' | 'assistant'; content: string }

export class GuideRequestError extends Error {
  constructor(
    readonly code: string,
    readonly retryAfterSeconds: number | null,
    readonly stage: 'admission' | 'knowledge' | 'response' | 'network',
    readonly requestId: string | null,
    readonly retryable: boolean,
  ) {
    super(code)
  }
}

/** Sends one turn and calls onEvent for each line of the streamed NDJSON reply. */
export async function streamGuideTurn(
  apiUrl: string,
  body: { messages: GuideTurn[]; route: string; spoken?: boolean },
  onEvent: (event: GuideEvent) => void,
  signal: AbortSignal,
) {
  let response: Response
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, '')}/chat`, {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      signal,
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new GuideRequestError('network', null, 'network', null, true)
  }
  let requestId = response.headers.get('x-guide-request-id')
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string
      stage?: 'admission' | 'knowledge' | 'response'
      requestId?: string
      retryable?: boolean
    }
    const retryAfter = Number(response.headers.get('retry-after'))
    requestId = payload.requestId || requestId
    throw new GuideRequestError(
      payload.error || `http_${response.status}`,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
      payload.stage || 'response',
      requestId,
      payload.retryable === true,
    )
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += value
    let newline: number
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (line) {
        let event: GuideEvent
        try {
          event = JSON.parse(line) as GuideEvent
        } catch {
          throw new GuideRequestError('invalid_stream', null, 'response', requestId, true)
        }
        if (event.t === 'meta') requestId = event.requestId
        onEvent(event)
      }
    }
  }
  return requestId
}
