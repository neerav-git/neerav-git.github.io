/**
 * Short, quiet tones that tell a voice user what the microphone is doing without looking at the screen:
 * a rising chime when the mic opens, a falling chime when it has caught the question, a low tone when nothing was heard,
 * and a short rising or falling triad when spoken answers turn on or off.
 */
export type Earcon = 'listen' | 'heard' | 'silence' | 'voiceOn' | 'voiceOff'

const TONES: Record<Earcon, Array<{ frequency: number; at: number; length: number }>> = {
  listen: [{ frequency: 660, at: 0, length: 0.09 }, { frequency: 880, at: 0.1, length: 0.12 }],
  heard: [{ frequency: 880, at: 0, length: 0.08 }, { frequency: 587, at: 0.09, length: 0.12 }],
  silence: [{ frequency: 330, at: 0, length: 0.12 }, { frequency: 262, at: 0.14, length: 0.16 }],
  voiceOn: [{ frequency: 523, at: 0, length: 0.08 }, { frequency: 659, at: 0.09, length: 0.08 }, { frequency: 784, at: 0.18, length: 0.14 }],
  voiceOff: [{ frequency: 659, at: 0, length: 0.08 }, { frequency: 440, at: 0.09, length: 0.12 }],
}

let context: AudioContext | null = null

/** Plays the tones through the guide's existing audio output instead of opening a second one. */
export function shareEarconContext(shared: AudioContext) {
  context = shared
}

/** Resolves when the tone has finished, so the mic can open after it rather than recording it. */
export function playEarcon(kind: Earcon): Promise<void> {
  try {
    context ??= new AudioContext()
    void context.resume()
    const start = context.currentTime + 0.01
    let end = start
    for (const tone of TONES[kind]) {
      const oscillator = new OscillatorNode(context, { type: 'sine', frequency: tone.frequency })
      const gain = new GainNode(context, { gain: 0 })
      const t0 = start + tone.at
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.12, t0 + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.length)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(t0)
      oscillator.stop(t0 + tone.length + 0.02)
      end = Math.max(end, t0 + tone.length)
    }
    return new Promise((resolve) => setTimeout(resolve, Math.ceil((end - context!.currentTime) * 1000) + 40))
  } catch {
    return Promise.resolve()
  }
}
