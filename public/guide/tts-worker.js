// Portfolio guide voice: Kokoro-82M in a module worker, so synthesis never blocks scrolling or highlights.
// Chosen settings: voice af_heart, WebGPU fp32; devices without WebGPU fall back to WASM q8 with the same voice.
import { KokoroTTS } from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
const VOICE = 'af_heart'

let tts = null
let loading = false
let queue = Promise.resolve()

async function hasWebGPU() {
  try {
    return Boolean(self.navigator.gpu && (await self.navigator.gpu.requestAdapter()))
  } catch {
    return false
  }
}

async function load(forced) {
  // Progress follows the model weights only: the small config files finish first and would read as 100% too early.
  const progress_callback = (event) => {
    if (event.status === 'progress' && event.total && /\.onnx$/.test(event.file)) self.postMessage({ type: 'progress', loaded: event.loaded, total: event.total })
  }

  const attempts = forced
    ? [{ device: forced, dtype: forced === 'webgpu' ? 'fp32' : 'q8' }]
    : (await hasWebGPU())
      ? [{ device: 'webgpu', dtype: 'fp32' }, { device: 'wasm', dtype: 'q8' }]
      : [{ device: 'wasm', dtype: 'q8' }]

  for (const attempt of attempts) {
    try {
      self.postMessage({ type: 'stage', stage: 'downloading', ...attempt })
      tts = await KokoroTTS.from_pretrained(MODEL_ID, { ...attempt, progress_callback })
      self.postMessage({ type: 'stage', stage: 'warming', ...attempt })
      // Warm the graph so the first real sentence starts quickly.
      await tts.generate('Hi.', { voice: VOICE })
      self.postMessage({ type: 'ready', ...attempt })
      return
    } catch (error) {
      tts = null
      console.warn(`[guide voice] ${attempt.device}/${attempt.dtype} failed`, error)
    }
  }
  self.postMessage({ type: 'failed' })
}

self.onmessage = ({ data }) => {
  if (data.type === 'load') {
    if (!tts && !loading) {
      loading = true
      load(data.device).finally(() => (loading = false))
    }
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
