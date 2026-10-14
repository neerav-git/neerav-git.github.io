/** Push-to-talk input using the browser's own speech recognition (Chrome, Edge, Safari). Firefox falls back to typing. */
type RecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  processLocally?: boolean
  phrases?: unknown[]
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
type RecognitionConstructor = (new () => Recognition) & {
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>
  install?: (options: { langs: string[]; processLocally: boolean }) => Promise<boolean>
}
type PhraseConstructor = new (phrase: string, boost: number) => unknown

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return scope.SpeechRecognition || scope.webkitSpeechRecognition || null
}

/**
 * Browser recognizers often mishear "Neerav". Correct the common variants before the question is shown or sent,
 * so the guide answers about Neerav without remarking on the mishearing. The last pattern covers the name's shape
 * (Neram, Niram, Nirab, Niraj) without touching real words such as near, nearby, or nerve.
 */
export function normalizeHeard(text: string) {
  return text
    .replace(/(?<!\bin )\bneed (?:of|off)\b/gi, 'Neerav')
    .replace(/\b(?:needles?|neil|kneel|nirav|niraav|neeraj|nerav|neeruv|near of|neer of|nee rav|knee rav|near rav|n(?:ee|ea|i|e)r[aeiou]?[mbvfj])('s)?\b/gi, (_match, possessive) => (possessive ? "Neerav's" : 'Neerav'))
    .replace(/\b(?:chowdhury|chaudry|choudhary)\b/gi, 'Chaudhary')
}

/** Names the recognizer should expect. Chrome applies these hints only when recognizing on the device. */
const HINTS: Array<[string, number]> = [
  ['Neerav', 8],
  ['Neerav Chaudhary', 8],
  ['Neerav built', 6],
  ['Relay', 4],
  ['Refract', 4],
  ['Homeward', 4],
  ['Birb Hangout', 4],
  ['Deep Strat', 3],
]
const LOCAL = { langs: ['en-US'], processLocally: true }
let local: Promise<boolean> | null = null

/**
 * Prepares on-device recognition with name hints where the browser offers it (current Chrome), downloading its
 * language pack once. Resolves false where unsupported, so listening falls back to the browser's standard recognizer.
 */
export function prepareListening(): Promise<boolean> {
  local ??= (async () => {
    const Constructor = recognitionConstructor()
    const Phrase = (window as unknown as { SpeechRecognitionPhrase?: PhraseConstructor }).SpeechRecognitionPhrase
    if (!Constructor?.available || !Constructor.install || !Phrase) return false
    try {
      const state = await Constructor.available(LOCAL)
      if (state === 'available') return true
      if (state === 'unavailable') return false
      return (await Constructor.install(LOCAL)) && (await Constructor.available(LOCAL)) === 'available'
    } catch {
      return false
    }
  })()
  return local
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
  const Phrase = (window as unknown as { SpeechRecognitionPhrase?: PhraseConstructor }).SpeechRecognitionPhrase
  let recognition: Recognition | null = null
  let transcript = ''
  let cancelled = false
  let silent = false

  const result = new Promise<Heard>((resolve, reject) => {
    const begin = (onDevice: boolean) => {
      const current = new Constructor()
      recognition = current
      current.lang = 'en-US'
      current.interimResults = true
      current.continuous = false
      if (onDevice && Phrase) {
        current.processLocally = true
        current.phrases = HINTS.map(([phrase, boost]) => new Phrase(phrase, boost))
      }
      let restarted = false
      current.onaudiostart = () => onPhase('listening')
      current.onspeechstart = () => onPhase('hearing')
      current.onspeechend = () => onPhase('processing')
      current.onresult = (event) => {
        transcript = Array.from(event.results).map((item) => item[0]?.transcript ?? '').join('')
        onInterim(normalizeHeard(transcript))
      }
      current.onerror = (event) => {
        // If on-device recognition turns out not to work here, carry on with the standard recognizer.
        if (onDevice && !transcript && /phrases-not-supported|language-not-supported|service-not-allowed|network/.test(event.error)) {
          restarted = true
          local = Promise.resolve(false)
          begin(false)
          return
        }
        if (event.error === 'no-speech') silent = true
        if (event.error === 'no-speech' || event.error === 'aborted') return
        reject(new Error(event.error))
      }
      current.onend = () => {
        if (restarted) return
        resolve({ text: cancelled ? '' : normalizeHeard(transcript.trim()), silent: silent && !transcript.trim() })
      }
      current.start()
    }
    onPhase('starting')
    void (local ?? Promise.resolve(false)).then((onDevice) => (cancelled ? resolve({ text: '', silent: false }) : begin(onDevice)))
  })

  return {
    result,
    stop: () => recognition?.stop(),
    cancel: () => {
      cancelled = true
      recognition?.abort()
    },
  }
}
