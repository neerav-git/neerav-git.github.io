export type GuideAction =
  | { type: 'show'; target: string }
  | { type: 'tour'; steps: Array<{ target: string; narration: string }> }
  | { type: 'links'; links: string[] }

export type GuideEvent =
  | { t: 'text'; d: string }
  /** A spoken question as the guide understood it, shown in place of the raw transcript. */
  | { t: 'heard'; d: string }
  | { t: 'action'; action: GuideAction }
  | { t: 'done' }
  | { t: 'error'; code: string; message: string }

export type GuideTurn = { role: 'user' | 'assistant'; content: string }

export class GuideRequestError extends Error {
  constructor(readonly code: string, readonly retryAfterSeconds: number | null) {
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
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/chat`, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
    signal,
  })
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    const retryAfter = Number(response.headers.get('retry-after'))
    throw new GuideRequestError(payload.error || `http_${response.status}`, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null)
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
      if (line) onEvent(JSON.parse(line) as GuideEvent)
    }
  }
}
