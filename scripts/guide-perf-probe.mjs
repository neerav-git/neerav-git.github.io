// Guide performance probe: opens the guide, turns the WebGPU voice on, and plays a spoken tour while
// correlating Chrome's AudioPlaybackStats underruns with voice-worker synthesis, route/scroll activity,
// main-thread long tasks, and frozen frames.
//
// Usage (repo root): node scripts/guide-perf-probe.mjs [url]
//   default URL: https://neerav-git.github.io/ (use http://localhost:3000/ locally)
//
// Environment:
//   PROFILE=<name>          reuse a Chrome profile under tmp/ (omit for a fresh first visit)
//   Q=<question>            defaults to a quick portfolio tour
//   HEADED=1                use the real audio device; required for meaningful underrun measurements
//   OUT=<path.json>         save the complete trace as JSON
//   AUDIO_LATENCY=playback  probe a larger Chrome output buffer without changing application source
//   BYPASS_REVERB=1         measurement-only probe of the convolver's audio-render cost
//   MONO_REVERB=1           preserve the room settings but halve the impulse's channel workload
//
// Each run asks the guide one question, which counts toward that site's guide budget.
import fs from 'node:fs'

import { chromium } from '@playwright/test'

const url = process.argv[2] || 'https://neerav-git.github.io/'
const profile = `tmp/guide-perf/${process.env.PROFILE || 'fresh'}`
const headed = process.env.HEADED === '1'
const candidate = {
  latencyHint: process.env.AUDIO_LATENCY || null,
  bypassReverb: process.env.BYPASS_REVERB === '1',
  monoReverb: process.env.MONO_REVERB === '1',
}

if (!process.env.PROFILE) fs.rmSync(profile, { recursive: true, force: true })
if (!headed) console.warn('WARNING: run with HEADED=1 for hardware-output underrun measurements; headless Chrome mutes audio.')

const browser = await chromium.launchPersistentContext(profile, {
  channel: 'chrome',
  headless: !headed,
  viewport: { width: 1440, height: 900 },
  args: ['--enable-unsafe-webgpu', '--autoplay-policy=no-user-gesture-required'],
})
const page = browser.pages()[0] || (await browser.newPage())
page.on('pageerror', (error) => console.error(`[page error] ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') console.error(`[page ${message.type()}] ${message.text()}`)
})

await page.addInitScript((probeCandidate) => {
  const round = (value, places = 3) => (Number.isFinite(value) ? Number(value.toFixed(places)) : null)
  const perf = {
    meta: {
      candidate: probeCandidate,
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
    },
    longTasks: [],
    frames: [],
    audio: [],
    audioStats: [],
    workerMessages: { progress: 0, other: 0 },
    workers: [],
    phases: [],
    contexts: [],
    timeline: [],
  }
  window.__perf = perf

  const event = (type, detail = {}) => perf.timeline.push({ at: Math.round(performance.now()), type, ...detail })
  let contextId = 0
  const contexts = []

  const snapshotStats = (context, id, reason = 'poll') => {
    const stats = context.playbackStats
    const sample = {
      at: Math.round(performance.now()),
      contextId: id,
      reason,
      contextTime: round(context.currentTime),
      state: context.state,
      baseLatency: round(context.baseLatency, 6),
      outputLatency: round(context.outputLatency, 6),
      underrunEvents: stats ? Number(stats.underrunEvents) : null,
      underrunDuration: stats ? round(Number(stats.underrunDuration), 6) : null,
      totalDuration: stats ? round(Number(stats.totalDuration), 6) : null,
      averageLatency: stats ? round(Number(stats.averageLatency), 6) : null,
      minimumLatency: stats ? round(Number(stats.minimumLatency), 6) : null,
      maximumLatency: stats ? round(Number(stats.maximumLatency), 6) : null,
    }
    const previous = [...perf.audioStats].reverse().find((entry) => entry.contextId === id)
    const changed =
      !previous ||
      sample.underrunEvents !== previous.underrunEvents ||
      sample.underrunDuration !== previous.underrunDuration ||
      sample.state !== previous.state ||
      sample.outputLatency !== previous.outputLatency
    if (changed || reason !== 'poll' || sample.at - previous.at >= 1000) perf.audioStats.push(sample)
    if (previous && sample.underrunEvents > previous.underrunEvents) {
      event('audio-underrun-detected', {
        contextId: id,
        events: sample.underrunEvents - previous.underrunEvents,
        duration: round(sample.underrunDuration - previous.underrunDuration, 6),
      })
    }
    return sample
  }
  window.__perfSampleAudioStats = (reason) => contexts.map(({ context, id }) => snapshotStats(context, id, reason))

  const NativeContext = window.AudioContext
  window.AudioContext = class extends NativeContext {
    constructor(options) {
      const chosen = probeCandidate.latencyHint ? { ...(options || {}), latencyHint: probeCandidate.latencyHint } : options
      const started = performance.now()
      if (chosen === undefined) super()
      else super(chosen)
      const id = ++contextId
      const createdAt = Math.round(performance.now())
      const creationMs = Math.round(performance.now() - started)
      perf.contexts.push({
        id,
        at: createdAt,
        creationMs,
        requestedLatencyHint: chosen?.latencyHint ?? 'default',
        sampleRate: this.sampleRate,
        baseLatency: round(this.baseLatency, 6),
        outputLatency: round(this.outputLatency, 6),
        playbackStats: Boolean(this.playbackStats),
      })
      contexts.push({ context: this, id })
      event('audio-context-created', { contextId: id, creationMs })
      snapshotStats(this, id, 'created')
      setInterval(() => snapshotStats(this, id), 100)
    }
  }

  if (probeCandidate.bypassReverb && window.ConvolverNode) {
    ConvolverNode.prototype.connect = function (destination) {
      event('convolver-bypassed')
      // Preserve connect() chaining but leave the wet branch without an input. This is a probe only.
      return destination
    }
  }

  if (probeCandidate.monoReverb) {
    const createBuffer = BaseAudioContext.prototype.createBuffer
    const getChannelData = AudioBuffer.prototype.getChannelData
    BaseAudioContext.prototype.createBuffer = function (channels, length, sampleRate) {
      // The guide's only long stereo buffer is its 1.6 s room impulse. Speech buffers remain mono.
      const chosenChannels = channels === 2 && length >= sampleRate ? 1 : channels
      if (chosenChannels !== channels) event('room-impulse-mono', { length, sampleRate })
      return createBuffer.call(this, chosenChannels, length, sampleRate)
    }
    AudioBuffer.prototype.getChannelData = function (channel) {
      return getChannelData.call(this, this.numberOfChannels === 1 && channel === 1 ? 0 : channel)
    }
  }

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const task = { at: Math.round(entry.startTime), ms: Math.round(entry.duration) }
      perf.longTasks.push(task)
      event('long-task', { ms: task.ms })
    }
  }).observe({ type: 'longtask', buffered: true })

  let lastFrame = performance.now()
  let lastPath = location.pathname
  const frame = (now) => {
    const gap = now - lastFrame
    if (gap > 50) perf.frames.push({ at: Math.round(now), ms: Math.round(gap) })
    if (location.pathname !== lastPath) {
      event('route-rendered', { from: lastPath, to: location.pathname })
      lastPath = location.pathname
    }
    lastFrame = now
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  for (const method of ['pushState', 'replaceState']) {
    const native = history[method]
    history[method] = function (state, unused, nextUrl) {
      event(`history-${method}`, { from: location.pathname, to: String(nextUrl ?? location.pathname) })
      return native.call(this, state, unused, nextUrl)
    }
  }
  window.addEventListener('popstate', () => event('history-popstate', { to: location.pathname }))

  const scrollIntoView = Element.prototype.scrollIntoView
  Element.prototype.scrollIntoView = function (options) {
    const label = this.id || this.getAttribute?.('data-guide-target') || this.querySelector?.('h1,h2,h3')?.textContent?.trim().slice(0, 80) || this.tagName
    event('scroll-start', { target: label })
    return scrollIntoView.call(this, options)
  }
  let scrollTimer = 0
  window.addEventListener(
    'scroll',
    () => {
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => event('scroll-end', { x: Math.round(scrollX), y: Math.round(scrollY) }), 150)
    },
    { passive: true },
  )

  // Capture synthesis intervals from the guide's worker. An audio message closes the matching speak interval.
  const NativeWorker = window.Worker
  let workerId = 0
  const generationStarts = new Map()
  window.Worker = class extends NativeWorker {
    constructor(...args) {
      super(...args)
      const id = ++workerId
      const workerUrl = String(args[0])
      event('worker-created', { workerId: id, url: workerUrl })
      const post = this.postMessage.bind(this)
      this.postMessage = (data, transfer) => {
        if (data?.type === 'speak') {
          const at = Math.round(performance.now())
          generationStarts.set(`${id}:${data.id}`, at)
          perf.workers.push({ workerId: id, id: data.id, type: 'synthesis-start', at, chars: data.text?.length ?? 0, text: data.text?.slice(0, 100) ?? '' })
          event('synthesis-start', { workerId: id, id: data.id, chars: data.text?.length ?? 0 })
        }
        if (transfer === undefined) return post(data)
        return post(data, transfer)
      }
      this.addEventListener('message', ({ data }) => {
        if (data?.type === 'progress') perf.workerMessages.progress++
        else perf.workerMessages.other++
        if (data?.type !== 'audio' && data?.type !== 'audio-error') return
        const key = `${id}:${data.id}`
        const at = Math.round(performance.now())
        const startedAt = generationStarts.get(key)
        generationStarts.delete(key)
        const item = {
          workerId: id,
          id: data.id,
          type: data.type === 'audio' ? 'synthesis-end' : 'synthesis-error',
          at,
          ms: startedAt === undefined ? null : at - startedAt,
          audioSeconds: data.type === 'audio' ? round(data.samples.length / data.sampleRate) : null,
        }
        perf.workers.push(item)
        event(item.type, { workerId: id, id: data.id, ms: item.ms, audioSeconds: item.audioSeconds })
      })
    }
  }

  const sourceStart = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (when = 0, ...rest) {
    const now = performance.now()
    const lead = when - this.context.currentTime
    const item = {
      at: Math.round(now),
      audibleAt: Math.round(now + Math.max(0, lead) * 1000),
      audibleUntil: Math.round(now + Math.max(0, lead) * 1000 + (this.buffer?.duration ?? 0) * 1000),
      when: this.context.currentTime,
      scheduled: when,
      duration: this.buffer?.duration ?? 0,
      lead,
    }
    perf.audio.push(item)
    event('audio-source-scheduled', { duration: round(item.duration), lead: round(item.lead) })
    return sourceStart.call(this, when, ...rest)
  }
}, candidate)

const t0 = Date.now()
const mark = async (phase) => {
  const at = await page.evaluate((p) => {
    const at = Math.round(performance.now())
    window.__perf.phases.push({ phase: p, at })
    window.__perf.timeline.push({ type: 'phase', phase: p, at })
    window.__perfSampleAudioStats?.(`phase:${p}`)
    return at
  }, phase)
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${phase} @ ${at} ms`)
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
await mark('before question')
await page.click('button[aria-label="Send"]')
await mark('question sent (spoken tour)')
// Let the spoken tour play through its stops, then leave enough time for the once-a-second stats object to update.
await page.waitForFunction(() => !document.querySelector('.guide-tour-bar') && document.querySelectorAll('.guide-step-label').length > 0, null, { timeout: 240_000 }).catch(() => {})
await page.waitForTimeout(3000)
await mark('tour finished')
const perf = await page.evaluate(() => window.__perf)
await browser.close()

const phaseOf = (at) => [...perf.phases].reverse().find((p) => p.at <= at)?.phase ?? 'before load'
const byPhase = {}
for (const task of perf.longTasks) {
  const phase = (byPhase[phaseOf(task.at)] ??= { longTasks: 0, longTaskMs: 0, worst: 0, frameGaps: 0, worstFrame: 0 })
  phase.longTasks++
  phase.longTaskMs += task.ms
  phase.worst = Math.max(phase.worst, task.ms)
}
for (const frame of perf.frames) {
  const phase = (byPhase[phaseOf(frame.at)] ??= { longTasks: 0, longTaskMs: 0, worst: 0, frameGaps: 0, worstFrame: 0 })
  if (frame.ms > 100) phase.frameGaps++
  phase.worstFrame = Math.max(phase.worstFrame, frame.ms)
}

const statAt = (at) => [...perf.audioStats].reverse().find((sample) => sample.at <= at && sample.underrunEvents !== null)
const before = statAt(perf.phases.find((phase) => phase.phase === 'before question')?.at ?? -1)
const after = [...perf.audioStats].reverse().find((sample) => sample.underrunEvents !== null)
const tourUnderruns = before && after ? after.underrunEvents - before.underrunEvents : null
const tourUnderrunDuration = before && after ? after.underrunDuration - before.underrunDuration : null
const detectionEvents = perf.timeline.filter((entry) => entry.type === 'audio-underrun-detected')

console.log('\nProbe configuration:')
console.log(`  URL: ${url}`)
console.log(`  Chrome: ${perf.meta.userAgent}`)
console.log(`  headed/audio device: ${headed}`)
console.log(`  candidate: ${JSON.stringify(candidate)}`)
console.log('\nMain thread by phase (long tasks > 50 ms; frame gaps > 100 ms):')
for (const [phase, item] of Object.entries(byPhase)) {
  console.log(`  ${phase.padEnd(34)} long tasks ${item.longTasks} (${item.longTaskMs} ms total, worst ${item.worst} ms), frozen frames ${item.frameGaps}, worst frame ${item.worstFrame} ms`)
}
console.log(`\nAudioContext: ${JSON.stringify(perf.contexts)}`)
console.log(`Voice worker messages: ${perf.workerMessages.progress} progress, ${perf.workerMessages.other} other`)
console.log(`Synthesis jobs: ${perf.workers.filter((item) => item.type === 'synthesis-end').length}`)
console.log(`Tour underruns: ${tourUnderruns ?? 'unavailable'} events, ${tourUnderrunDuration === null ? 'unavailable' : tourUnderrunDuration.toFixed(6) + ' s'}`)

if (detectionEvents.length) {
  console.log('\nUnderrun correlations (stats update about once a second, so related work is shown from the prior 1.2 s):')
  for (const glitch of detectionEvents) {
    const related = perf.timeline.filter(
      (entry) =>
        entry !== glitch &&
        entry.at >= glitch.at - 1200 &&
        entry.at <= glitch.at + 100 &&
        ['synthesis-start', 'synthesis-end', 'history-pushState', 'route-rendered', 'scroll-start', 'scroll-end', 'long-task', 'audio-source-scheduled'].includes(entry.type),
    )
    console.log(`  @ ${glitch.at} ms: +${glitch.events} event(s), ${(glitch.duration * 1000).toFixed(2)} ms; ${related.map((entry) => `${entry.type}@${entry.at}`).join(', ') || 'no measured overlap'}`)
  }
}

console.log('\nSpoken sentences (lead = how far ahead of the audio clock each sentence was scheduled):')
let silentGaps = 0
perf.audio.forEach((audio, index) => {
  const previous = perf.audio[index - 1]
  const gap = previous ? audio.scheduled - (previous.scheduled + previous.duration) : 0
  if (previous && gap > 0.6) silentGaps++
  console.log(`  ${String(index + 1).padStart(2)} dur ${audio.duration.toFixed(2)}s lead ${audio.lead.toFixed(2)}s gap after previous ${previous ? gap.toFixed(2) + 's' : '-'}`)
})
console.log(`  silent gaps over 0.6 s between sentences: ${silentGaps}`)
const sentAt = perf.phases.find((phase) => phase.phase === 'question sent (spoken tour)')?.at ?? 0
const firstVoice = perf.timeline.find((entry) => entry.type === 'audio-source-scheduled' && entry.at > sentAt)
const spokenSeconds = perf.audio.reduce((sum, audio) => sum + audio.duration, 0)
console.log(`  first sentence scheduled ${firstVoice ? ((firstVoice.at - sentAt) / 1000).toFixed(2) + ' s' : 'never'} after the question was sent; ${spokenSeconds.toFixed(1)} s of speech in total`)

if (process.env.OUT) {
  fs.writeFileSync(process.env.OUT, `${JSON.stringify({ ...perf, summary: { tourUnderruns, tourUnderrunDuration } }, null, 2)}\n`)
  console.log(`\nTrace written to ${process.env.OUT}`)
}
