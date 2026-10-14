/**
 * Spoken output for the portfolio guide. Synthesis runs in /guide/tts-worker.js (Kokoro, voice af_heart);
 * playback goes through the same polish chain the voice was approved with in the tuner:
 * warmth +2 dB, presence +1.5 dB, air -1 dB, 6% room, broadcast compression, 180 ms between sentences.
 */
export type VoiceStatus = 'off' | 'loading' | 'ready' | 'failed'
/**
 * `speaking` is true while a reply is audibly playing, so the panel can show it and offer Stop.
 * `stage` says what loading is doing: downloading the model weights (once per browser), then warming it up.
 * `device` is set once the model has loaded, even while spoken answers are switched off.
 */
export type VoiceState = { status: VoiceStatus; progress: number; stage: 'downloading' | 'warming' | null; device: string | null; speaking: boolean }

const SENTENCE_PAUSE_S = 0.18
const ROOM = 0.06
/** With no word from the worker for this long, loading has stalled (seen with some GPU drivers); retry on WASM. */
const STALL_MS = 25_000

type Synthesized = { samples: Float32Array; sampleRate: number } | null

function impulse(context: AudioContext, seconds = 1.6, decay = 3.2) {
  const length = Math.floor(context.sampleRate * seconds)
  const buffer = context.createBuffer(2, length, context.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
  }
  return buffer
}

export class GuideVoice {
  state: VoiceState = { status: 'off', progress: 0, stage: null, device: null, speaking: false }
  private quiet: ReturnType<typeof setTimeout> | null = null
  private listeners = new Set<(state: VoiceState) => void>()
  private worker: Worker | null = null
  private context: AudioContext | null = null
  private input: AudioNode | null = null
  private pending = new Map<number, (result: Synthesized) => void>()
  private nextId = 1
  private generation = 0
  private chain: Promise<void> = Promise.resolve()
  private cursor = 0
  private sources = new Set<AudioBufferSourceNode>()
  private attempt: string | null = null
  private lastSignal = 0
  private watchdog: ReturnType<typeof setInterval> | null = null

  subscribe(listener: (state: VoiceState) => void) {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private set(next: Partial<VoiceState>) {
    this.state = { ...this.state, ...next }
    for (const listener of this.listeners) listener(this.state)
  }

  get ready() {
    return this.state.status === 'ready'
  }

  /** Spoken answers are wanted: ready now, or loading and queued until it is. */
  get on() {
    return this.state.status === 'ready' || this.state.status === 'loading'
  }

  /** True when speech keeps pace with text (WebGPU), so text may be revealed sentence by sentence as it is spoken. */
  get keepsPace() {
    return this.ready && !this.state.device?.startsWith('wasm')
  }

  /** Download and warm the model in the background without turning spoken answers on, so the mic is ready at once. */
  preload() {
    if (!this.worker && this.state.status !== 'failed') this.startWorker()
  }

  /** Call from a click or key press: browsers only start audio after a user gesture. */
  enable() {
    this.ensureAudio()
    void this.context?.resume()
    if (this.state.status === 'failed') return
    if (!this.worker) this.startWorker()
    if (this.state.status === 'off') this.set({ status: this.state.device ? 'ready' : 'loading' })
  }

  disable() {
    this.stop()
    if (this.state.status !== 'failed') this.set({ status: 'off' })
  }

  /** Resolves true once the model has loaded (even while muted), or false if it cannot run in this browser. */
  whenLoaded(): Promise<boolean> {
    if (this.state.device || this.state.status === 'failed') return Promise.resolve(Boolean(this.state.device))
    return new Promise((resolve) => {
      const listener = (state: VoiceState) => {
        if (!state.device && state.status !== 'failed') return
        this.listeners.delete(listener)
        resolve(Boolean(state.device))
      }
      this.listeners.add(listener)
    })
  }

  /** Resolves true once the voice is ready, or false if it is switched off or fails first. */
  private whenReady(): Promise<boolean> {
    if (this.state.status !== 'loading') return Promise.resolve(this.ready)
    return new Promise((resolve) => {
      const listener = (state: VoiceState) => {
        if (state.status === 'loading') return
        this.listeners.delete(listener)
        resolve(state.status === 'ready')
      }
      this.listeners.add(listener)
    })
  }

  private startWorker(device?: 'wasm') {
    this.worker?.terminate()
    this.attempt = device ?? null
    this.set({ progress: 0, stage: 'downloading' })
    const worker = new Worker('/guide/tts-worker.js', { type: 'module' })
    this.worker = worker
    this.lastSignal = Date.now()
    worker.onmessage = ({ data }) => {
      this.lastSignal = Date.now()
      if (data.type === 'progress') this.set({ progress: data.total ? data.loaded / data.total : 0 })
      else if (data.type === 'stage') {
        console.info(`[guide voice] ${data.stage} ${data.device}/${data.dtype}`)
        this.attempt = data.device
        this.set({ stage: data.stage, progress: data.stage === 'warming' ? 1 : this.state.progress })
      } else if (data.type === 'ready') {
        console.info(`[guide voice] ready ${data.device}/${data.dtype}`)
        this.stopWatchdog()
        this.set({ status: this.state.status === 'off' ? 'off' : 'ready', progress: 1, stage: null, device: `${data.device} ${data.dtype}` })
      } else if (data.type === 'failed') this.fail()
      else if (data.type === 'audio' || data.type === 'audio-error') {
        const resolve = this.pending.get(data.id)
        this.pending.delete(data.id)
        resolve?.(data.type === 'audio' ? { samples: data.samples, sampleRate: data.sampleRate } : null)
      }
    }
    worker.onerror = (event) => {
      console.warn('[guide voice] worker error', event.message)
      this.fail()
    }
    worker.postMessage({ type: 'load', device })
    this.stopWatchdog()
    this.watchdog = setInterval(() => {
      if (Date.now() - this.lastSignal < STALL_MS) return
      console.warn(`[guide voice] loading stalled on ${this.attempt ?? 'first attempt'}`)
      if (this.attempt === 'wasm') this.fail()
      else this.startWorker('wasm')
    }, 5000)
  }

  private stopWatchdog() {
    if (this.watchdog) clearInterval(this.watchdog)
    this.watchdog = null
  }

  private fail() {
    this.stopWatchdog()
    this.worker?.terminate()
    this.worker = null
    for (const resolve of this.pending.values()) resolve(null)
    this.pending.clear()
    this.set({ status: 'failed', stage: null })
  }

  private ensureAudio() {
    if (this.context) return
    const context = new AudioContext()
    const warmth = new BiquadFilterNode(context, { type: 'lowshelf', frequency: 180, gain: 2 })
    const presence = new BiquadFilterNode(context, { type: 'peaking', frequency: 2800, Q: 0.9, gain: 1.5 })
    const air = new BiquadFilterNode(context, { type: 'highshelf', frequency: 8500, gain: -1 })
    const compressor = new DynamicsCompressorNode(context, { threshold: -22, ratio: 3.5, attack: 0.006, release: 0.18, knee: 12 })
    const dry = new GainNode(context, { gain: 1 - ROOM * 0.4 })
    const wet = new GainNode(context, { gain: ROOM * 0.9 })
    const reverb = new ConvolverNode(context, { buffer: impulse(context) })
    const master = new GainNode(context, { gain: 1.25 })
    warmth.connect(presence).connect(air).connect(compressor)
    compressor.connect(dry).connect(master)
    compressor.connect(reverb).connect(wet).connect(master)
    master.connect(context.destination)
    this.context = context
    this.input = warmth
  }

  private synthesize(text: string): Promise<Synthesized> {
    if (!this.worker) return Promise.resolve(null)
    const id = this.nextId++
    return new Promise((resolve) => {
      this.pending.set(id, resolve)
      this.worker!.postMessage({ type: 'speak', id, text })
    })
  }

  /**
   * Queue one sentence. Synthesis starts as soon as the model is ready (the worker pipelines it behind earlier sentences);
   * the returned promise settles when this sentence has finished playing, or at once if voice is off or stopped.
   * `onStart` fires when the sentence becomes audible, or right away when it cannot be spoken, so a caller that
   * reveals text in step with speech never leaves text hidden.
   */
  speak(text: string, onStart?: () => void): Promise<void> {
    const clean = text.trim()
    if (!clean || !this.on || !this.context || !this.input) {
      onStart?.()
      return Promise.resolve()
    }
    const generation = this.generation
    // While the model is still loading, sentences wait for it instead of being dropped.
    const audio = this.whenReady().then((ok) => (ok && generation === this.generation ? this.synthesize(clean) : null))
    const played = this.chain.then(async () => {
      const result = await audio
      if (!result || generation !== this.generation || !this.context || !this.input) {
        onStart?.()
        return
      }
      const buffer = this.context.createBuffer(1, result.samples.length, result.sampleRate)
      buffer.copyToChannel(result.samples as Float32Array<ArrayBuffer>, 0)
      const source = new AudioBufferSourceNode(this.context, { buffer })
      source.connect(this.input)
      const startAt = Math.max(this.cursor, this.context.currentTime + 0.02)
      if (onStart) setTimeout(onStart, Math.max(0, (startAt - this.context.currentTime) * 1000))
      this.cursor = startAt + buffer.duration + SENTENCE_PAUSE_S
      this.sources.add(source)
      if (this.quiet) clearTimeout(this.quiet)
      if (!this.state.speaking) this.set({ speaking: true })
      await new Promise<void>((resolve) => {
        source.onended = () => {
          this.sources.delete(source)
          // Sentences are queued with a short pause; only report silence once nothing follows.
          if (!this.sources.size) this.quiet = setTimeout(() => this.sources.size || this.set({ speaking: false }), 450)
          resolve()
        }
        source.start(startAt)
      })
    })
    this.chain = played.catch(() => {})
    return played
  }

  /** Resolves once everything queued so far has been spoken. */
  idle() {
    return this.chain
  }

  /** Barge-in: silence now and drop anything queued. */
  stop() {
    this.generation++
    for (const source of this.sources) {
      try {
        source.stop()
      } catch {}
    }
    this.sources.clear()
    this.chain = Promise.resolve()
    this.cursor = 0
    if (this.quiet) clearTimeout(this.quiet)
    if (this.state.speaking) this.set({ speaking: false })
  }
}

/** Splits streamed text into speakable sentences as soon as each one completes. */
export class SentenceBuffer {
  private text = ''

  push(delta: string) {
    this.text += delta
    const sentences: string[] = []
    const boundary = /[.!?…]["')\]]*\s+/g
    let start = 0
    let match: RegExpExecArray | null
    while ((match = boundary.exec(this.text))) {
      const end = match.index + match[0].length
      const sentence = this.text.slice(start, end).trim()
      // Very short fragments ("Yes.") are held and spoken with the next sentence for smoother delivery.
      if (sentence.length >= 12) {
        sentences.push(sentence)
        start = end
      }
    }
    this.text = this.text.slice(start)
    return sentences
  }

  flush() {
    const rest = this.text.trim()
    this.text = ''
    return rest
  }
}
