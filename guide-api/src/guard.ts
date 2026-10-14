import { DurableObject } from 'cloudflare:workers'

export type Admission = { ok: true } | { ok: false; reason: 'rate_limited' | 'budget_exhausted'; retryAfterSeconds: number }

const WINDOW_MS = 10 * 60 * 1000

function today() {
  return new Date().toISOString().slice(0, 10)
}

function secondsUntilUtcMidnight() {
  const now = new Date()
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.ceil((midnight - now.getTime()) / 1000)
}

/**
 * One global instance holds the daily spend (persisted) and per-visitor request windows (in memory; losing them on
 * eviction only loosens rate limiting briefly). Spend is recorded after each turn from the API's own usage numbers.
 */
export class Guard extends DurableObject {
  private windows = new Map<string, number[]>()

  async admit(visitor: string, limitPerWindow: number, dailyBudgetUsd: number): Promise<Admission> {
    const spent = (await this.ctx.storage.get<number>(`spend:${today()}`)) ?? 0
    if (spent >= dailyBudgetUsd) return { ok: false, reason: 'budget_exhausted', retryAfterSeconds: secondsUntilUtcMidnight() }

    const now = Date.now()
    const recent = (this.windows.get(visitor) ?? []).filter((at) => now - at < WINDOW_MS)
    if (recent.length >= limitPerWindow) {
      return { ok: false, reason: 'rate_limited', retryAfterSeconds: Math.ceil((recent[0]! + WINDOW_MS - now) / 1000) }
    }
    recent.push(now)
    this.windows.set(visitor, recent)
    if (this.windows.size > 5000) {
      for (const [key, hits] of this.windows) if (!hits.some((at) => now - at < WINDOW_MS)) this.windows.delete(key)
    }
    return { ok: true }
  }

  async record(costUsd: number) {
    if (!Number.isFinite(costUsd) || costUsd <= 0) return
    const key = `spend:${today()}`
    const spent = (await this.ctx.storage.get<number>(key)) ?? 0
    await this.ctx.storage.put(key, spent + costUsd)
  }

  async usage() {
    return { day: today(), spentUsd: (await this.ctx.storage.get<number>(`spend:${today()}`)) ?? 0 }
  }
}
