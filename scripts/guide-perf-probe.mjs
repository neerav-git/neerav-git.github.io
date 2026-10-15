// Guide performance probe: a fresh Chrome visit that opens the guide (voice downloads), turns the voice on, and
// plays a spoken tour, reporting main-thread long tasks and frozen frames by phase, AudioContext creation cost,
// voice-worker message volume, and the silence before each spoken sentence.
// Usage (repo root): node scripts/guide-perf-probe.mjs [url]   (default: the live site; use http://localhost:3000/ locally)
// Env: PROFILE=<name> reuses a browser profile under tmp/ (omit for a fresh first visit), Q=<question>, HEADED=1.
// Each run asks the guide one question, which counts toward that site's guide budget.
import fs from 'node:fs'

import { chromium } from '@playwright/test'

const url = process.argv[2] || 'https://neerav-git.github.io/'
const profile = `tmp/guide-perf/${process.env.PROFILE || 'fresh'}`
if (!process.env.PROFILE) fs.rmSync(profile, { recursive: true, force: true })
const browser = await chromium.launchPersistentContext(profile, {
  channel: 'chrome',
  headless: !process.env.HEADED,
  viewport: { width: 1440, height: 900 },
  args: ['--enable-unsafe-webgpu', '--autoplay-policy=no-user-gesture-required'],
})
const page = browser.pages()[0] || (await browser.newPage())
await page.addInitScript(() => {
  const perf = { longTasks: [], frames: [], audio: [], workerMessages: { progress: 0, other: 0 }, phases: [], contexts: [] }
  const NativeContext = window.AudioContext
  window.AudioContext = class extends NativeContext {
    constructor(...args) {
      const s = performance.now()
      super(...args)
      perf.contexts.push(Math.round(performance.now() - s))
    }
  }
  window.__perf = perf
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) perf.longTasks.push({ at: Math.round(entry.startTime), ms: Math.round(entry.duration) })
  }).observe({ type: 'longtask', buffered: true })
  let last = performance.now()
  const frame = (now) => {
    const gap = now - last
    if (gap > 50) perf.frames.push({ at: Math.round(now), ms: Math.round(gap) })
    last = now
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  // Count messages from the voice worker (download progress floods the main thread).
  const NativeWorker = window.Worker
  window.Worker = class extends NativeWorker {
    constructor(...args) {
      super(...args)
      this.addEventListener('message', ({ data }) => {
        if (data?.type === 'progress') perf.workerMessages.progress++
        else perf.workerMessages.other++
      })
    }
  }
  // Each sentence: when it was scheduled relative to the audio clock, so late arrivals (stutter) show up.
  const start = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (when = 0, ...rest) {
    perf.audio.push({ at: Math.round(performance.now()), when: this.context.currentTime, scheduled: when, duration: this.buffer?.duration ?? 0, lead: when - this.context.currentTime })
    return start.call(this, when, ...rest)
  }
})
const t0 = Date.now()
const mark = async (phase) => {
  const at = await page.evaluate(() => Math.round(performance.now()))
  await page.evaluate(([p, a]) => window.__perf.phases.push({ phase: p, at: a }), [phase, at])
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${phase}`)
}
await page.goto(url, { waitUntil: 'networkidle' })
await mark('loaded')
await page.click('.guide-launcher')
await mark('guide opened, voice downloading')
await page.waitForFunction(() => !document.querySelector('.guide-mic')?.disabled, null, { timeout: 180_000 })
await mark('voice ready')
const clickStart = Date.now()
await page.click('.guide-voice-toggle')
console.log(`voice toggle click took ${Date.now() - clickStart} ms`)
await page.fill('textarea[aria-label="Ask the guide"]', process.env.Q || 'Give me a quick tour of the portfolio')
await page.click('button[aria-label="Send"]')
await mark('question sent (spoken tour)')
// Let the spoken tour play through its stops.
await page.waitForFunction(() => !document.querySelector('.guide-tour-bar') && document.querySelectorAll('.guide-step-label').length > 0, null, { timeout: 240_000 }).catch(() => {})
await page.waitForTimeout(3000)
await mark('tour finished')
const perf = await page.evaluate(() => window.__perf)
await browser.close()

const phaseOf = (at) => [...perf.phases].reverse().find((p) => p.at <= at)?.phase ?? 'before load'
const byPhase = {}
for (const t of perf.longTasks) {
  const p = (byPhase[phaseOf(t.at)] ??= { longTasks: 0, longTaskMs: 0, worst: 0, frameGaps: 0, worstFrame: 0 })
  p.longTasks++
  p.longTaskMs += t.ms
  p.worst = Math.max(p.worst, t.ms)
}
for (const f of perf.frames) {
  const p = (byPhase[phaseOf(f.at)] ??= { longTasks: 0, longTaskMs: 0, worst: 0, frameGaps: 0, worstFrame: 0 })
  if (f.ms > 100) p.frameGaps++
  p.worstFrame = Math.max(p.worstFrame, f.ms)
}
console.log('\nMain thread by phase (long tasks > 50 ms; frame gaps > 100 ms):')
for (const [phase, p] of Object.entries(byPhase)) console.log(`  ${phase.padEnd(34)} long tasks ${p.longTasks} (${p.longTaskMs} ms total, worst ${p.worst} ms), frozen frames ${p.frameGaps}, worst frame ${p.worstFrame} ms`)
console.log(`\nAudioContext creations (ms each): ${JSON.stringify(perf.contexts)}`)
console.log(`Voice worker messages: ${perf.workerMessages.progress} progress, ${perf.workerMessages.other} other`)
console.log('\nSpoken sentences (lead = how far ahead of the audio clock each sentence was scheduled; ~0.02 s means it arrived late and the voice had gone silent):')
let silentGaps = 0
perf.audio.forEach((a, i) => {
  const prev = perf.audio[i - 1]
  const gap = prev ? a.scheduled - (prev.scheduled + prev.duration) : 0
  if (prev && gap > 0.6) silentGaps++
  console.log(`  ${String(i + 1).padStart(2)} dur ${a.duration.toFixed(2)}s lead ${a.lead.toFixed(2)}s gap after previous ${prev ? gap.toFixed(2) + 's' : '-'}`)
})
console.log(`  silent gaps over 0.6 s between sentences: ${silentGaps}`)
