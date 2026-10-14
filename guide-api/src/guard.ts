import { DurableObject } from 'cloudflare:workers'

export type Limits = {
  perWindow: number
  perVisitorPerDay: number
  offTopicPerVisitorPerDay: number
  dailyBudgetUsd: number
  monthlyBudgetUsd: number
}

export type Admission =
  | { ok: true }
  | { ok: false; reason: 'rate_limited' | 'visitor_daily_limit' | 'off_topic_limit' | 'budget_exhausted'; retryAfterSeconds: number }

const WINDOW_MS = 10 * 60 * 1000

function today() {
  return new Date().toISOString().slice(0, 10)
}

function secondsUntilUtcMidnight() {
  const now = new Date()
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.ceil((midnight - now.getTime()) / 1000)
}

function secondsUntilNextMonth() {
  const now = new Date()
  return Math.ceil((Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - now.getTime()) / 1000)
}

type VisitorDay = { day: string; turns: number; offTopic: number; recent: number[] }

/**
 * One global instance holds spend (persisted, per day and per month) and per-visitor counters (in memory; losing them
 * on eviction only loosens the per-visitor limits briefly). Spend is recorded after each turn from the API's own usage.
 * Nothing is charged unless a visitor asks a question: the budgets are ceilings, not fees.
 */
export class Guard extends DurableObject {
  private visitors = new Map<string, VisitorDay>()

  private visitor(key: string) {
    const day = today()
    let entry = this.visitors.get(key)
    if (!entry || entry.day !== day) {
      entry = { day, turns: 0, offTopic: 0, recent: [] }
      this.visitors.set(key, entry)
    }
    if (this.visitors.size > 5000) {
      for (const [other, value] of this.visitors) if (value.day !== day) this.visitors.delete(other)
    }
    return entry
  }

  async admit(key: string, limits: Limits): Promise<Admission> {
    const [daySpent, monthSpent] = await Promise.all([
      this.ctx.storage.get<number>(`spend:${today()}`),
      this.ctx.storage.get<number>(`spend:${today().slice(0, 7)}`),
    ])
    if ((monthSpent ?? 0) >= limits.monthlyBudgetUsd) return { ok: false, reason: 'budget_exhausted', retryAfterSeconds: secondsUntilNextMonth() }
    if ((daySpent ?? 0) >= limits.dailyBudgetUsd) return { ok: false, reason: 'budget_exhausted', retryAfterSeconds: secondsUntilUtcMidnight() }

    const visitor = this.visitor(key)
    if (visitor.offTopic >= limits.offTopicPerVisitorPerDay) return { ok: false, reason: 'off_topic_limit', retryAfterSeconds: secondsUntilUtcMidnight() }
    if (visitor.turns >= limits.perVisitorPerDay) return { ok: false, reason: 'visitor_daily_limit', retryAfterSeconds: secondsUntilUtcMidnight() }

    const now = Date.now()
    visitor.recent = visitor.recent.filter((at) => now - at < WINDOW_MS)
    if (visitor.recent.length >= limits.perWindow) {
      return { ok: false, reason: 'rate_limited', retryAfterSeconds: Math.ceil((visitor.recent[0]! + WINDOW_MS - now) / 1000) }
    }
    visitor.recent.push(now)
    visitor.turns += 1
    return { ok: true }
  }

  async record(key: string, costUsd: number, offTopic: boolean) {
    if (offTopic) this.visitor(key).offTopic += 1
    if (!Number.isFinite(costUsd) || costUsd <= 0) return
    const dayKey = `spend:${today()}`
    const monthKey = `spend:${today().slice(0, 7)}`
    const [daySpent, monthSpent] = await Promise.all([this.ctx.storage.get<number>(dayKey), this.ctx.storage.get<number>(monthKey)])
    await this.ctx.storage.put({ [dayKey]: (daySpent ?? 0) + costUsd, [monthKey]: (monthSpent ?? 0) + costUsd })
  }

  async usage() {
    return {
      day: today(),
      spentTodayUsd: (await this.ctx.storage.get<number>(`spend:${today()}`)) ?? 0,
      spentThisMonthUsd: (await this.ctx.storage.get<number>(`spend:${today().slice(0, 7)}`)) ?? 0,
    }
  }
}
