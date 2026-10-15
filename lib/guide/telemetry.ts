export type ClientFailureStage = 'admission' | 'knowledge' | 'response' | 'network' | 'speech'

export type GuideTelemetry = {
  event: 'guide_opened' | 'voice_load' | 'voice_failure' | 'turn_complete' | 'turn_error' | 'first_audio'
  requestId?: string
  elapsedMs?: number
  firstTextMs?: number
  responseMs?: number
  voice?: { status: 'ready' | 'failed' | 'fallback'; device?: string; fallbackFrom?: string }
  error?: { stage: ClientFailureStage; code: string; retryable: boolean }
}

function deviceContext() {
  const ua = navigator.userAgent
  const mobile = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile ?? /Android|iPhone|iPod/i.test(ua)
  const tablet = !mobile && (/iPad/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1180))
  const browser = /Firefox\//i.test(ua) ? 'firefox' : /Edg\/|Chrome\/|Chromium\//i.test(ua) ? 'chromium' : /Safari\//i.test(ua) ? 'safari' : 'other'
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection
  const network = /^(slow-2g|2g|3g|4g)$/.test(connection?.effectiveType || '') ? connection!.effectiveType : 'unknown'
  return { class: mobile ? 'mobile' : tablet ? 'tablet' : 'desktop', browser, network, saveData: Boolean(connection?.saveData) }
}

/** Fire-and-forget, privacy-minimal diagnostics: no question, answer, URL, user agent, or microphone content. */
export function postGuideTelemetry(apiUrl: string, event: GuideTelemetry) {
  const body = JSON.stringify({ ...event, device: deviceContext() })
  void fetch(`${apiUrl.replace(/\/$/, '')}/telemetry`, {
    body,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST',
  }).catch(() => {})
}
