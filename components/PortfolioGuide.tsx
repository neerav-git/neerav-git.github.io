'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

import { GuideRequestError, streamGuideTurn, type GuideAction, type GuideTurn } from '@/lib/guide/api'
import { clearHighlights, focusTarget, followAnswer, loadRegistry, type GuideRegistry } from '@/lib/guide/layer'
import { playEarcon, shareEarconContext } from '@/lib/guide/earcons'
import { canListen, listenOnce, prepareListening, type Listening, type ListenPhase } from '@/lib/guide/listen'
import { postGuideTelemetry, type ClientFailureStage } from '@/lib/guide/telemetry'
import { GuideVoice, SentenceBuffer, sentencesOf, type VoiceState } from '@/lib/guide/voice'

type Turn = {
  id: number
  role: 'user' | 'assistant'
  text: string
  links?: string[]
  shown?: string[]
  step?: { index: number; total: number; name: string }
  error?: boolean
  errorCode?: string
  requestId?: string
  retry?: { text: string; byVoice: boolean }
  /** While spoken answers are on, only this many characters are visible: text appears as it is spoken. */
  revealed?: number
  /** A guided-tour card: the stops in order and how the tour works. */
  tourCard?: { stops: string[]; voiced: boolean }
}
type Status = 'idle' | 'listening' | 'thinking' | 'touring'
/** What the visitor should know is happening right now, shown in the voice strip and announced to screen readers. */
type Phase = ListenPhase | 'thinking' | 'preparing' | 'speaking' | 'voiceLoading' | 'notice'

const PHASE_COPY: Record<Exclude<Phase, 'notice' | 'voiceLoading'>, string> = {
  starting: 'Opening the microphone…',
  listening: 'Listening. Go ahead and speak.',
  hearing: 'Hearing you…',
  processing: 'Got it.',
  thinking: 'Thinking…',
  preparing: 'Preparing the spoken answer…',
  speaking: 'Reading the answer aloud',
}
type TourStep = { target: string; narration: string }

const SUGGESTIONS = [
  { label: 'What has Neerav built?', send: 'What has Neerav built?' },
  { label: 'Match him to my role', fill: "I'm hiring for " },
  { label: 'Show the evaluation work', send: 'Show me the strongest evaluation evidence in the portfolio.' },
  { label: 'How do I contact him?', send: 'How can I contact Neerav?' },
]

const ERROR_COPY: Record<string, string> = {
  rate_limited: "You've asked a lot of questions in a short time. Please wait a few minutes and try again.",
  budget_exhausted: 'The guide is resting for now. The whole portfolio is still here to browse.',
  visitor_daily_limit: "You've reached today's question limit for the guide. The whole portfolio is still here to browse.",
  off_topic_limit: "The guide only answers questions about Neerav's portfolio, so it's paused for you today.",
  origin_not_allowed: 'The guide is not available on this address.',
  knowledge_unavailable: "The guide can't load the portfolio right now. Please try again shortly.",
  provider_rate_limited: 'The guide is busy right now. Please try again in a moment.',
  provider_unavailable: 'The guide service had a temporary problem. Please try again.',
  provider_connection: 'The guide lost its connection while answering. Please try again.',
  response_failed: 'The guide could not complete that answer.',
  invalid_stream: 'The answer was interrupted in transit. Please try again.',
  network: "I couldn't reach the guide. Check your connection and try again.",
}

let turnIds = 0

function historyFor(turns: Turn[], registry: GuideRegistry | null): GuideTurn[] {
  const history: GuideTurn[] = []
  for (const turn of turns) {
    if (turn.error || !turn.text.trim()) continue
    const shown = (turn.shown || []).map((id) => registry?.targets.get(id)?.label || id)
    const content = shown.length ? `${turn.text.trim()} (Shown on the page: ${shown.join('; ')})` : turn.text.trim()
    const last = history.at(-1)
    // Tour steps belong to the answer that started the tour.
    if (turn.role === 'assistant' && last?.role === 'assistant') last.content = `${last.content} ${content}`.slice(0, 2000)
    else history.push({ role: turn.role, content: content.slice(0, turn.role === 'user' ? 8000 : 2000) })
  }
  return history
}

/** A stop's plain name for the tour card and step labels: the project title for project sections, else the page label. */
function stopName(registry: GuideRegistry | null, id: string) {
  const target = registry?.targets.get(id)
  if (!target || !registry) return 'This section'
  for (const candidate of registry.targets.values()) {
    if (candidate.route === target.route && candidate.label.includes(': case study')) return candidate.label.split(': case study')[0]!
  }
  return target.label.split(':')[0]!
}

function listOf(names: string[]) {
  const unique = [...new Set(names)]
  return unique.length < 2 ? unique.join('') : `${unique.slice(0, -1).join(', ')} and ${unique.at(-1)}`
}

function MicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

function WaveIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
    </svg>
  )
}

export function PortfolioGuide({ apiUrl }: { apiUrl: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [input, setInput] = useState('')
  const [interim, setInterim] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>({ status: 'off', progress: 0, stage: null, device: null, speaking: false, fallback: null, failure: null })
  const [listenPhase, setListenPhase] = useState<ListenPhase>('starting')
  const [notice, setNotice] = useState('')
  const [preparing, setPreparing] = useState(false)
  const [tourCardId, setTourCardId] = useState<number | null>(null)
  const slowNoticeShownRef = useRef(false)
  const [tour, setTour] = useState<{ index: number; total: number; waiting: boolean } | null>(null)
  const [micSupported, setMicSupported] = useState(false)
  /** The mic opens only once the guide can answer aloud, so nobody starts speaking into a guide that cannot reply. */
  const [micReady, setMicReady] = useState(false)

  const voiceRef = useRef<GuideVoice | null>(null)
  const registryRef = useRef<GuideRegistry | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const listeningRef = useRef<Listening | null>(null)
  const micStartingRef = useRef(false)
  const tourRef = useRef<{ cancelled: boolean; advance: (() => void) | null } | null>(null)
  const turnsRef = useRef<Turn[]>([])
  const logRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const voiceLoadStartedRef = useRef<number | null>(null)
  const voiceFailureReportedRef = useRef(0)

  turnsRef.current = turns

  const voice = useCallback(() => {
    voiceRef.current ??= new GuideVoice()
    return voiceRef.current
  }, [])

  useEffect(() => voice().subscribe(setVoiceState), [voice])
  useEffect(() => {
    if (open) postGuideTelemetry(apiUrl, { event: 'guide_opened' })
  }, [apiUrl, open])
  useEffect(() => {
    if (voiceState.stage && voiceLoadStartedRef.current === null) voiceLoadStartedRef.current = performance.now()
    const started = voiceLoadStartedRef.current
    if (started === null || (!voiceState.device && voiceState.status !== 'failed')) return
    postGuideTelemetry(apiUrl, {
      event: 'voice_load',
      elapsedMs: performance.now() - started,
      voice: {
        status: voiceState.status === 'failed' ? 'failed' : voiceState.fallback ? 'fallback' : 'ready',
        device: voiceState.device || undefined,
        fallbackFrom: voiceState.fallback?.from,
      },
      ...(voiceState.failure ? { error: { stage: 'speech' as const, code: voiceState.failure.code, retryable: false } } : {}),
    })
    voiceLoadStartedRef.current = null
  }, [apiUrl, voiceState.device, voiceState.failure, voiceState.fallback, voiceState.stage, voiceState.status])
  useEffect(() => {
    const failure = voiceState.failure
    if (!failure || failure.at === voiceFailureReportedRef.current) return
    voiceFailureReportedRef.current = failure.at
    postGuideTelemetry(apiUrl, {
      event: 'voice_failure',
      voice: { status: 'failed', device: voiceState.device || undefined, fallbackFrom: voiceState.fallback?.from },
      error: { stage: 'speech', code: failure.code, retryable: failure.stage === 'synthesis' },
    })
    if (failure.stage === 'synthesis') setNotice("The spoken answer couldn't be prepared. The full answer is still available as text.")
  }, [apiUrl, voiceState.device, voiceState.failure, voiceState.fallback])
  // Without WebGPU the voice is generated more slowly than it plays, so text leads; say so once.
  useEffect(() => {
    if (voiceState.status !== 'ready' || !voiceState.device?.startsWith('wasm') || slowNoticeShownRef.current) return
    slowNoticeShownRef.current = true
    setNotice('The voice is running in a slower mode on this device, so text appears first and the voice follows.')
  }, [voiceState.status, voiceState.device])
  useEffect(() => setMicSupported(canListen()), [])
  useEffect(() => {
    if (open) loadRegistry().then((registry) => (registryRef.current = registry)).catch(() => {})
  }, [open])
  // Load the voice and the recognizer's name hints while the visitor reads; the mic turns on when both are done.
  // On data-saver connections nothing downloads up front: the mic works at once and answers appear as text.
  useEffect(() => {
    if (!open) return
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (connection?.saveData) {
      setMicReady(true)
      return
    }
    voice().preload()
    const audio = voice().audioContext
    if (audio) shareEarconContext(audio)
    let active = true
    const hints = Promise.race([prepareListening(), new Promise((resolve) => setTimeout(resolve, 20_000))])
    void Promise.all([voice().whenLoaded(), hints]).then(() => active && setMicReady(true))
    return () => {
      active = false
    }
  }, [open, voice])
  useEffect(() => {
    if (voiceState.status === 'failed') setNotice('The voice can’t run in this browser, so answers appear as text. Chrome or Edge can read them aloud.')
  }, [voiceState.status])
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [turns, interim])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 7000)
    return () => clearTimeout(timer)
  }, [notice])
  useEffect(() => {
    document.body.classList.toggle('guide-open', open)
    return () => document.body.classList.remove('guide-open')
  }, [open])

  const updateTurn = useCallback((id: number, change: (turn: Turn) => Turn) => {
    setTurns((current) => current.map((turn) => (turn.id === id ? change(turn) : turn)))
  }, [])

  const navigate = useCallback((route: string) => router.push(route, { scroll: false }), [router])

  const endTour = useCallback(() => {
    if (tourRef.current) {
      tourRef.current.cancelled = true
      tourRef.current.advance?.()
    }
    tourRef.current = null
    setTour(null)
  }, [])

  const revealAll = useCallback(() => {
    setPreparing(false)
    setTurns((current) => (current.some((turn) => turn.revealed !== undefined) ? current.map((turn) => (turn.revealed === undefined ? turn : { ...turn, revealed: undefined })) : current))
  }, [])

  const stopEverything = useCallback(() => {
    abortRef.current?.abort()
    listeningRef.current?.cancel()
    listeningRef.current = null
    voice().stop()
    revealAll()
    endTour()
  }, [endTour, revealAll, voice])

  const runTour = useCallback(
    async (steps: TourStep[]) => {
      const registry = registryRef.current
      if (!registry) return
      const control = { cancelled: false, advance: null as (() => void) | null }
      tourRef.current = control
      setStatus('touring')
      // The card says what a tour is, lists its stops, and explains how it moves.
      const card: Turn = { id: ++turnIds, role: 'assistant', text: '', tourCard: { stops: steps.map((step) => stopName(registry, step.target)), voiced: voice().on } }
      setTurns((current) => [...current, card])
      setTourCardId(card.id)
      // Generate the complete tour before playback. WebGPU synthesis can starve Chrome's real-time audio output;
      // keeping it outside both speech and page rendering preserves the approved voice chain without underruns.
      const stopSentences = steps.map((step) => sentencesOf(step.narration))
      await voice().idle()
      if (voice().on) {
        setPreparing(true)
        await voice().prepareAll(stopSentences.flat())
        setPreparing(false)
      }
      for (let index = 0; index < steps.length && !control.cancelled; index++) {
        const step = steps[index]!
        const target = registry.targets.get(step.target)
        const spoken = voice().on
        const synced = voice().keepsPace
        const turnId = ++turnIds
        clearHighlights()
        setTour({ index, total: steps.length, waiting: false })
        setTurns((current) => [
          ...current,
          { id: turnId, role: 'assistant', text: step.narration, shown: [step.target], step: { index, total: steps.length, name: stopName(registry, step.target) }, revealed: synced ? 0 : undefined },
        ])
        if (target) await focusTarget(target, navigate)
        if (control.cancelled) break
        if (spoken) {
          // Sentence by sentence, so the stop starts speaking as soon as its first sentence is ready.
          const parts = stopSentences[index]!
          let searchFrom = 0
          setPreparing(true)
          const playing = Promise.all(
            parts.map((part) => {
              const end = step.narration.indexOf(part, searchFrom) + part.length
              searchFrom = end
              return voice().speak(part, () => {
                followAnswer(part)
                setPreparing(false)
                updateTurn(turnId, (turn) => (turn.revealed === undefined ? turn : { ...turn, revealed: end >= step.narration.length ? undefined : Math.max(turn.revealed, end) }))
              })
            }),
          )
          await playing
          await new Promise((resolve) => setTimeout(resolve, 500))
        } else if (index < steps.length - 1) {
          setTour({ index, total: steps.length, waiting: true })
          await new Promise<void>((resolve) => (control.advance = resolve))
          control.advance = null
        }
      }
      if (tourRef.current === control) tourRef.current = null
      setTour(null)
      setStatus('idle')
    },
    [navigate, updateTurn, voice],
  )

  const send = useCallback(
    async (raw: string, byVoice = false, retryOf?: number) => {
      const text = raw.trim()
      if (!text) return
      stopEverything()
      clearHighlights()
      setInput('')
      setInterim('')
      setNotice('')

      // Decide once per answer: an answer is either spoken in full or shown as text, never switched midway.
      const spoken = voice().on
      const synced = voice().keepsPace
      const userTurn: Turn = { id: ++turnIds, role: 'user', text }
      const reply: Turn = { id: ++turnIds, role: 'assistant', text: '', revealed: synced ? 0 : undefined }
      const retained = retryOf
        ? turnsRef.current.filter((turn, index, current) => turn.id !== retryOf && !(current[index + 1]?.id === retryOf && turn.role === 'user'))
        : turnsRef.current
      const history = historyFor([...retained, userTurn], registryRef.current)
      setTurns([...retained, userTurn, reply])
      setStatus('thinking')

      const controller = new AbortController()
      abortRef.current = controller
      const startedAt = performance.now()
      const sentences = new SentenceBuffer()
      const queuedSpeech: { sentence: string; end: number }[] = []
      let full = ''
      let searchFrom = 0
      let requestId: string | null = null
      let firstTextMs: number | undefined
      let firstAudioReported = false
      let turnErrorReported = false
      // Each sentence becomes visible when it starts playing, so reading and listening stay together.
      const speakSentence = (sentence: string, end: number) => {
        if (!sentence.trim()) return
        setPreparing(true)
        void voice().speak(sentence, (audible) => {
          if (audible && !firstAudioReported) {
            firstAudioReported = true
            postGuideTelemetry(apiUrl, { event: 'first_audio', requestId: requestId || undefined, elapsedMs: performance.now() - startedAt })
          }
          setPreparing(false)
          updateTurn(reply.id, (turn) => (turn.revealed === undefined ? turn : { ...turn, revealed: Math.max(turn.revealed, end) }))
          followAnswer(sentence)
        })
      }
      const speakAll = (parts: string[]) => {
        for (const part of parts) {
          const at = full.indexOf(part, searchFrom)
          const end = at < 0 ? full.length : at + part.length
          searchFrom = end
          queuedSpeech.push({ sentence: part, end })
        }
        void voice().prepareEarly(parts)
      }
      let tourSteps: TourStep[] | null = null
      let shownCount = 0

      const registry = registryRef.current ?? (await loadRegistry().catch(() => null))
      registryRef.current = registry

      const applyAction = (action: GuideAction) => {
        if (action.type === 'show') {
          const target = registry?.targets.get(action.target)
          if (!target) return
          updateTurn(reply.id, (turn) => ({ ...turn, shown: [...(turn.shown || []), action.target] }))
          // Tabs in the shown section follow the answer: per sentence while it is spoken, else by the first mention.
          void focusTarget(target, navigate, shownCount++ === 0 ? 'primary' : 'supporting').then(() => spoken || followAnswer(full))
        } else if (action.type === 'links') {
          const valid = action.links.filter((id) => registry?.links.has(id))
          updateTurn(reply.id, (turn) => ({ ...turn, links: [...new Set([...(turn.links || []), ...valid])] }))
        } else if (action.type === 'tour') {
          tourSteps = action.steps.filter((step) => registry?.targets.has(step.target))
          if (spoken) void voice().prepareEarly(tourSteps.flatMap((step) => sentencesOf(step.narration)))
        }
      }

      try {
        const completedRequestId = await streamGuideTurn(
          apiUrl,
          { messages: history, route: window.location.pathname, spoken: byVoice },
          (event) => {
            if (event.t === 'meta') {
              requestId = event.requestId
            } else if (event.t === 'heard') {
              if (byVoice) updateTurn(userTurn.id, (turn) => ({ ...turn, text: event.d }))
            } else if (event.t === 'text') {
              firstTextMs ??= performance.now() - startedAt
              full += event.d
              updateTurn(reply.id, (turn) => ({ ...turn, text: turn.text + event.d }))
              if (spoken) speakAll(sentences.push(event.d))
            } else if (event.t === 'action') {
              applyAction(event.action)
            } else if (event.t === 'error') {
              requestId = event.requestId || requestId
              turnErrorReported = true
              const stage = (event.stage || 'response') as ClientFailureStage
              updateTurn(reply.id, (turn) => ({
                ...turn,
                text: turn.text ? `${turn.text}\n${event.message}` : event.message,
                error: true,
                errorCode: event.code,
                requestId: requestId || undefined,
                retry: event.retryable ? { text, byVoice } : undefined,
                revealed: undefined,
              }))
              postGuideTelemetry(apiUrl, {
                event: 'turn_error',
                requestId: requestId || undefined,
                elapsedMs: performance.now() - startedAt,
                firstTextMs,
                error: { stage, code: event.code, retryable: event.retryable === true },
              })
            }
          },
          controller.signal,
        )
        requestId = completedRequestId || requestId
        if (!turnErrorReported) {
          postGuideTelemetry(apiUrl, {
            event: 'turn_complete',
            requestId: requestId || undefined,
            responseMs: performance.now() - startedAt,
            firstTextMs,
          })
        }
        if (spoken) {
          const rest = sentences.flush()
          if (rest) speakAll([rest])
        } else followAnswer(full)
        // Every tour opens by connecting the question to it; supply that sentence when the model left it out.
        const pending = tourSteps as TourStep[] | null
        if (pending?.length && !full.trim()) {
          const intro = `Here's a ${pending.length}-stop tour that answers your question, covering ${listOf(pending.map((step) => stopName(registry, step.target)))}.`
          full = intro
          updateTurn(reply.id, (turn) => ({ ...turn, text: intro }))
          if (spoken) queuedSpeech.push({ sentence: intro, end: intro.length })
        }
        const tourSpeech = ((tourSteps as TourStep[] | null) || []).flatMap((step) => sentencesOf(step.narration))
        const prepareSpeech = [...queuedSpeech.map(({ sentence }) => sentence), ...tourSpeech]
        if (spoken && prepareSpeech.length) {
          // WebGPU fp32 inference can monopolize Chrome's GPU process long enough for real-time audio to underrun.
          // Finish the answer and any following tour before starting playback. Once speech begins, every prepared
          // buffer still uses the approved 180 ms pause and voice chain without a later preparation gap.
          setPreparing(true)
          await voice().prepareAll(prepareSpeech)
          if (controller.signal.aborted) return
          for (const { sentence, end } of queuedSpeech) speakSentence(sentence, end)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        const code = error instanceof GuideRequestError ? error.code : 'network'
        const stage: ClientFailureStage = error instanceof GuideRequestError ? error.stage : 'network'
        const retryable = error instanceof GuideRequestError ? error.retryable : true
        requestId = error instanceof GuideRequestError ? error.requestId : requestId
        updateTurn(reply.id, (turn) => ({
          ...turn,
          revealed: undefined,
          error: true,
          errorCode: code,
          requestId: requestId || undefined,
          retry: retryable ? { text, byVoice } : undefined,
          text: ERROR_COPY[code] || ERROR_COPY.network,
        }))
        postGuideTelemetry(apiUrl, {
          event: 'turn_error',
          requestId: requestId || undefined,
          elapsedMs: performance.now() - startedAt,
          firstTextMs,
          error: { stage, code, retryable },
        })
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
      if (controller.signal.aborted) return
      const steps = tourSteps as TourStep[] | null
      if (steps && steps.length) await runTour(steps)
      else setStatus('idle')
    },
    [apiUrl, navigate, runTour, stopEverything, updateTurn, voice],
  )

  const toggleListening = useCallback(async () => {
    if (listeningRef.current) {
      listeningRef.current.stop()
      return
    }
    if (micStartingRef.current || !micReady) return
    stopEverything()
    if (!voice().on) voice().enable()
    setNotice('')
    setInterim('')
    setListenPhase('starting')
    setStatus('listening')
    // The chime plays before the mic opens so it is never recorded as part of the question.
    micStartingRef.current = true
    await playEarcon('listen')
    micStartingRef.current = false
    const listening = listenOnce(setInterim, setListenPhase)
    listeningRef.current = listening
    try {
      const heard = await listening.result
      if (listeningRef.current !== listening) return
      listeningRef.current = null
      if (heard.text) {
        void playEarcon('heard')
        void send(heard.text, true)
      } else {
        setInterim('')
        setStatus('idle')
        if (heard.silent) {
          void playEarcon('silence')
          setNotice("I didn't hear anything. Tap the mic and try again.")
        }
      }
    } catch (error) {
      listeningRef.current = null
      setInterim('')
      setStatus('idle')
      void playEarcon('silence')
      const denied = /not-allowed|service-not-allowed/.test(String((error as Error).message))
      setNotice(denied ? 'Microphone access is blocked. Allow it in your browser, or type your question.' : "I couldn't hear that. Tap the mic to try again, or type your question.")
    }
  }, [micReady, send, stopEverything, voice])

  const stopSpeaking = useCallback(() => {
    voice().stop()
    revealAll()
    if (tourRef.current) {
      endTour()
      setStatus('idle')
    }
  }, [endTour, revealAll, voice])

  // A rising or falling tone confirms the press; the voice itself is heard with the next answer.
  const toggleVoice = useCallback(() => {
    if (voiceState.status === 'off') {
      voice().enable()
      void playEarcon('voiceOn')
    } else {
      voice().disable()
      void playEarcon('voiceOff')
    }
  }, [voice, voiceState.status])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send(input)
    }
  }

  useEffect(() => {
    if (!open) return
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [open])

  const close = () => {
    stopEverything()
    clearHighlights()
    setStatus('idle')
    setOpen(false)
  }

  const voiceLabel =
    voiceState.status === 'loading'
      ? voiceState.stage === 'downloading' && voiceState.progress < 1
        ? `Voice ${Math.round(voiceState.progress * 100)}%`
        : 'Voice starting…'
      : voiceState.status === 'ready'
        ? 'Voice on'
        : voiceState.status === 'failed'
          ? 'Voice unavailable'
          : 'Voice off'
  const phase: Phase | null =
    status === 'listening'
      ? listenPhase
      : voiceState.speaking
        ? 'speaking'
        : preparing
          ? 'preparing'
          : status === 'thinking'
            ? 'thinking'
            : voiceState.status === 'loading' || (micSupported && !micReady)
              ? 'voiceLoading'
              : notice
                ? 'notice'
                : null
  const phaseText =
    phase === 'notice'
      ? notice
      : phase === 'voiceLoading'
        ? voiceState.stage === 'downloading' && voiceState.progress < 1
          ? `Getting the voice ready (${Math.round(voiceState.progress * 100)}%). ${micReady ? 'Answers will be read aloud when it’s ready.' : 'The mic turns on when it’s ready.'}`
          : `Getting the voice ready. ${micReady ? 'Answers will be read aloud in a moment.' : 'The mic turns on in a moment.'}`
        : phase
          ? PHASE_COPY[phase]
          : ''
  // The voice strip shows and announces what is happening; the header only adds the tour position, so nothing is said twice.
  const statusLabel = status === 'touring' && tour ? `Tour · stop ${tour.index + 1} of ${tour.total}` : ''

  if (!open) {
    return (
      <button className="guide-launcher" onClick={() => setOpen(true)} type="button">
        <WaveIcon />
        <span>Ask the guide</span>
      </button>
    )
  }

  return (
    <aside aria-label="Portfolio guide" className="guide-panel">
      <header className="guide-panel-header">
        <div>
          <div className="panel-eyebrow">Portfolio guide</div>
          <p className="guide-status" aria-live="polite">{statusLabel || 'Ask by voice or text'}</p>
        </div>
        <div className="guide-header-actions">
          <button
            aria-pressed={voiceState.status === 'ready' || voiceState.status === 'loading'}
            className={`guide-chip guide-voice-toggle is-${voiceState.status}`}
            disabled={voiceState.status === 'failed'}
            onClick={toggleVoice}
            title={
              voiceState.status === 'failed'
                ? 'The voice could not start in this browser, so answers are shown as text.'
                : voiceState.status === 'off'
                  ? 'Answers are shown as text. Press to also hear them. Asking with the mic turns the voice on by itself.'
                  : 'Answers are read aloud. Press to mute.'
            }
            type="button"
          >
            {voiceLabel}
          </button>
          <button aria-label="Close guide" className="guide-icon-button" onClick={close} type="button">
            ×
          </button>
        </div>
      </header>

      <div aria-live="polite" className="guide-log" ref={logRef}>
        {!turns.length ? (
          <div className="guide-welcome">
            <p>
              Hi, I&apos;m the guide to Neerav&apos;s portfolio. Ask about his projects, or tell me the role you&apos;re hiring for and I&apos;ll walk you
              through the most relevant work, highlighting it as we go.
            </p>
            <div className="guide-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  className="guide-chip"
                  key={suggestion.label}
                  onClick={() => {
                    if (suggestion.send) void send(suggestion.send)
                    else {
                      setInput(suggestion.fill || '')
                      inputRef.current?.focus()
                    }
                  }}
                  type="button"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((turn) =>
          turn.tourCard ? (
            <div aria-label="Guided tour" className="guide-tour-card" key={turn.id} role="group">
              <div className="guide-tour-card-title">Guided tour · {turn.tourCard.stops.length} stops</div>
              <ol>
                {turn.tourCard.stops.map((name, index) => (
                  <li aria-current={tourCardId === turn.id && tour?.index === index ? 'step' : undefined} className={tourCardId === turn.id && tour?.index === index ? 'is-current' : undefined} key={`${name}-${index}`}>
                    {name}
                  </li>
                ))}
              </ol>
              <p className="guide-tour-help">
                The page moves to each stop and outlines the section being described.{' '}
                {turn.tourCard.voiced ? 'Each stop is read aloud, then the tour moves on by itself.' : 'Read the outlined section, then press Next.'} You can end the tour or ask
                something else at any time.
              </p>
            </div>
          ) : (
          <div className={`guide-turn guide-turn--${turn.role}${turn.error ? ' is-error' : ''}${turn.step ? ' is-step' : ''}`} key={turn.id}>
            {turn.step ? (
              <div className="guide-step-label" title="The page has moved to this stop and outlined the section described here.">
                Stop {turn.step.index + 1} of {turn.step.total} · {turn.step.name}
                <span className="guide-step-hint">outlined on the page</span>
              </div>
            ) : null}
            <p>
              {turn.revealed === undefined ? turn.text : turn.text.slice(0, turn.revealed)}
              {(turn.revealed !== undefined && turn.revealed < turn.text.length) || (!turn.text && turn.role === 'assistant' && status === 'thinking') ? (
                <span aria-hidden="true" className="guide-typing">…</span>
              ) : null}
            </p>
            {turn.error && (turn.retry || turn.requestId) ? (
              <div className="guide-error-actions">
                {turn.retry ? (
                  <button className="guide-chip" onClick={() => void send(turn.retry!.text, turn.retry!.byVoice, turn.id)} type="button">
                    Try again
                  </button>
                ) : null}
                {turn.requestId ? <small>Reference {turn.requestId.slice(0, 8)}</small> : null}
              </div>
            ) : null}
            {turn.links?.length ? (
              <div className="guide-links">
                {turn.links.map((id) => {
                  const link = registryRef.current?.links.get(id)
                  if (!link) return null
                  const external = /^https?:/.test(link.url)
                  return (
                    <a className="guide-chip" href={link.url} key={id} rel={external ? 'noreferrer' : undefined} target={external ? '_blank' : undefined}>
                      {link.label}
                    </a>
                  )
                })}
              </div>
            ) : null}
          </div>
          ),
        )}
        {interim ? <div className="guide-turn guide-turn--user is-interim"><p>{interim}</p></div> : null}
      </div>

      {phase ? (
        <div className={`guide-voice-strip is-${phase}`} role="status" aria-live="assertive">
          <span aria-hidden="true" className="guide-voice-indicator">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="guide-voice-text">{phaseText}</span>
          {phase === 'listening' || phase === 'hearing' ? (
            <button className="guide-chip" onClick={toggleListening} type="button">
              Done
            </button>
          ) : null}
          {phase === 'speaking' ? (
            <button className="guide-chip" onClick={stopSpeaking} type="button">
              Stop
            </button>
          ) : null}
        </div>
      ) : null}

      {tour ? (
        <div className="guide-tour-bar">
          <span>
            Stop {tour.index + 1} of {tour.total}
            {tour.waiting ? ' · read the outlined section, then press Next' : ''}
          </span>
          {tour.waiting ? (
            <button className="guide-chip" onClick={() => tourRef.current?.advance?.()} type="button">
              Next
            </button>
          ) : null}
          <button className="guide-chip" onClick={() => { endTour(); voice().stop(); revealAll(); setStatus('idle') }} type="button">
            End tour
          </button>
        </div>
      ) : null}

      <form className="guide-composer" onSubmit={onSubmit}>
        <textarea
          aria-label="Ask the guide"
          maxLength={8000}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={micSupported ? 'Ask, or paste a job description…' : 'Type a question, or paste a job description…'}
          ref={inputRef}
          rows={2}
          value={input}
        />
        <div className="guide-composer-actions">
          {micSupported ? (
            <button
              aria-label={!micReady ? 'Getting the voice ready' : status === 'listening' ? 'Stop listening' : 'Ask by voice'}
              aria-pressed={status === 'listening'}
              className={`guide-icon-button guide-mic${!micReady ? ' is-warming' : status === 'listening' ? ` is-listening is-${listenPhase}` : ' is-inviting'}`}
              disabled={!micReady}
              onClick={toggleListening}
              title={
                !micReady
                  ? 'Getting the voice ready. The mic turns on when the guide can answer aloud.'
                  : status === 'listening'
                    ? 'Tap to finish speaking'
                    : 'Tap to ask your question by voice. A chime means the mic is listening.'
              }
              type="button"
            >
              <MicIcon />
            </button>
          ) : (
            <button
              aria-disabled="true"
              aria-label="Voice questions are not supported in this browser"
              className="guide-icon-button guide-mic is-unsupported"
              onClick={() => setNotice('Voice questions work in Chrome, Edge, and Safari. In this browser you can type, and still turn on spoken answers.')}
              title="Voice questions work in Chrome, Edge, and Safari"
              type="button"
            >
              <MicIcon />
            </button>
          )}
          <button aria-label="Send" className="guide-icon-button guide-send" disabled={!input.trim()} type="submit">
            <SendIcon />
          </button>
        </div>
      </form>
      <p className="guide-footnote">
        Answers come from this portfolio. Spoken replies run in your browser; speech input uses your browser&apos;s recognizer.
      </p>
    </aside>
  )
}
