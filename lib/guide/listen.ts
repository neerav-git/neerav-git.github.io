/** Push-to-talk input using the browser's own speech recognition (Chrome, Edge, Safari). Firefox falls back to typing. */
type RecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: RecognitionResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
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

export type Listening = { result: Promise<string>; stop(): void; cancel(): void }

/** Listens for one utterance. Resolves with the final transcript ('' if nothing was heard); rejects on mic errors. */
export function listenOnce(onInterim: (text: string) => void): Listening {
  const Constructor = recognitionConstructor()
  if (!Constructor) return { result: Promise.reject(new Error('unsupported')), stop() {}, cancel() {} }
  const recognition = new Constructor()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.continuous = false
  let transcript = ''
  let cancelled = false

  const result = new Promise<string>((resolve, reject) => {
    recognition.onresult = (event) => {
      transcript = Array.from(event.results).map((item) => item[0]?.transcript ?? '').join('')
      onInterim(transcript)
    }
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      reject(new Error(event.error))
    }
    recognition.onend = () => resolve(cancelled ? '' : transcript.trim())
  })
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
