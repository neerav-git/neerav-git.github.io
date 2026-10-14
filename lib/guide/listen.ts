/** Push-to-talk input using the browser's own speech recognition (Chrome, Edge, Safari). Firefox falls back to typing. */
type RecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: RecognitionResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  onaudiostart: (() => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionConstructor = new () => Recognition

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return scope.SpeechRecognition || scope.webkitSpeechRecognition || null
}

export function canListen() {
  return recognitionConstructor() !== null
}

/**
 * What the microphone is doing, so the panel can show and sound it:
 * starting (asking for the mic), listening (mic open, waiting), hearing (speech detected), processing (speech ended).
 */
export type ListenPhase = 'starting' | 'listening' | 'hearing' | 'processing'
export type Heard = { text: string; silent: boolean }
export type Listening = { result: Promise<Heard>; stop(): void; cancel(): void }

/** Listens for one utterance. Resolves with the final transcript and whether the mic heard no speech at all; rejects on mic errors. */
export function listenOnce(onInterim: (text: string) => void, onPhase: (phase: ListenPhase) => void = () => {}): Listening {
  const Constructor = recognitionConstructor()
  if (!Constructor) return { result: Promise.reject(new Error('unsupported')), stop() {}, cancel() {} }
  const recognition = new Constructor()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.continuous = false
  let transcript = ''
  let cancelled = false
  let silent = false

  const result = new Promise<Heard>((resolve, reject) => {
    recognition.onaudiostart = () => onPhase('listening')
    recognition.onspeechstart = () => onPhase('hearing')
    recognition.onspeechend = () => onPhase('processing')
    recognition.onresult = (event) => {
      transcript = Array.from(event.results).map((item) => item[0]?.transcript ?? '').join('')
      onInterim(transcript)
    }
    recognition.onerror = (event) => {
      if (event.error === 'no-speech') silent = true
      if (event.error === 'no-speech' || event.error === 'aborted') return
      reject(new Error(event.error))
    }
    recognition.onend = () => resolve({ text: cancelled ? '' : transcript.trim(), silent: silent && !transcript.trim() })
  })
  onPhase('starting')
  recognition.start()

  return {
    result,
    stop: () => recognition.stop(),
    cancel: () => {
      cancelled = true
      recognition.abort()
    },
  }
}
