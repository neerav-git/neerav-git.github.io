// Portfolio guide voice: Kokoro-82M in a module worker, so synthesis never blocks scrolling or highlights.
// Chosen settings: voice af_heart, WebGPU fp32; devices without WebGPU fall back to WASM q8 with the same voice.
import { KokoroTTS } from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
const VOICE = 'af_heart'

let tts = null
let queue = Promise.resolve()

async function hasWebGPU() {
  try {
    return Boolean(self.navigator.gpu && (await self.navigator.gpu.requestAdapter()))
  } catch {
    return false
  }
}

async function load() {
  const files = new Map()
  const progress_callback = (event) => {
    if (event.status !== 'progress' || !event.total) return
    files.set(event.file, event)
    let loaded = 0
    let total = 0
    for (const file of files.values()) {
      loaded += file.loaded
      total += file.total
    }
    self.postMessage({ type: 'progress', loaded, total })
  }

  const attempts = (await hasWebGPU())
    ? [{ device: 'webgpu', dtype: 'fp32' }, { device: 'wasm', dtype: 'q8' }]
    : [{ device: 'wasm', dtype: 'q8' }]

  for (const attempt of attempts) {
    try {
      files.clear()
      tts = await KokoroTTS.from_pretrained(MODEL_ID, { ...attempt, progress_callback })
      // Warm the graph so the first real sentence starts quickly.
      await tts.generate('Hi.', { voice: VOICE })
      self.postMessage({ type: 'ready', ...attempt })
      return
    } catch (error) {
      console.warn(`[guide voice] ${attempt.device}/${attempt.dtype} failed`, error)
    }
  }
  self.postMessage({ type: 'failed' })
}

self.onmessage = ({ data }) => {
  if (data.type === 'load') {
    if (!tts) load()
    return
  }
  if (data.type === 'speak') {
    // One synthesis at a time: the runtime does not support overlapping runs on one session.
    queue = queue.then(async () => {
      try {
        const audio = await tts.generate(data.text, { voice: VOICE, speed: 1 })
        const samples = audio.audio
        self.postMessage({ type: 'audio', id: data.id, samples, sampleRate: audio.sampling_rate }, [samples.buffer])
      } catch (error) {
        self.postMessage({ type: 'audio-error', id: data.id, message: String(error?.message || error) })
      }
    })
  }
}
