export type FailureStage = 'admission' | 'knowledge' | 'response'
export type ClassifiedFailure = { code: string; message: string; stage: FailureStage; retryable: boolean; status?: number; name: string }

export function errorIdentity(error: unknown) {
  const record = error && typeof error === 'object' ? (error as { name?: unknown; status?: unknown }) : null
  return {
    name: typeof record?.name === 'string' ? record.name : error instanceof Error ? error.name : 'UnknownError',
    status: typeof record?.status === 'number' ? record.status : undefined,
  }
}

/** Stable, visitor-safe error categories. Provider messages and stack traces stay in server logs. */
export function classifyTurnError(error: unknown): ClassifiedFailure {
  const identity = errorIdentity(error)
  if (identity.status === 429 || /RateLimitError/i.test(identity.name)) {
    return { ...identity, code: 'provider_rate_limited', message: 'The guide is busy right now. Please try again in a moment.', stage: 'response', retryable: true }
  }
  if ((identity.status !== undefined && identity.status >= 500) || /InternalServerError/i.test(identity.name)) {
    return { ...identity, code: 'provider_unavailable', message: 'The guide service had a temporary problem. Please try again.', stage: 'response', retryable: true }
  }
  if (/APIConnection|Timeout|AbortError/i.test(identity.name)) {
    return { ...identity, code: 'provider_connection', message: 'The guide lost its connection while answering. Please try again.', stage: 'response', retryable: true }
  }
  return { ...identity, code: 'response_failed', message: 'The guide could not complete that answer.', stage: 'response', retryable: true }
}
