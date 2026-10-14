'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

import { GuideRequestError, streamGuideTurn, type GuideAction, type GuideTurn } from '@/lib/guide/api'
import { clearHighlights, focusTarget, loadRegistry, type GuideRegistry } from '@/lib/guide/layer'
import { canListen, listenOnce, type Listening } from '@/lib/guide/listen'
import { GuideVoice, SentenceBuffer, type VoiceState } from '@/lib/guide/voice'

type Turn = {
  id: number
  role: 'user' | 'assistant'
  text: string
  links?: string[]
  shown?: string[]
  step?: { index: number; total: number }
  error?: boolean
}
type Status = 'idle' | 'listening' | 'thinking' | 'touring'
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
  const [voiceState, setVoiceState] = useState<VoiceState>({ status: 'off', progress: 0, device: null })
  const [tour, setTour] = useState<{ index: number; total: number; waiting: boolean } | null>(null)
  const [micSupported, setMicSupported] = useState(false)

  const voiceRef = useRef<GuideVoice | null>(null)
  const registryRef = useRef<GuideRegistry | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const listeningRef = useRef<Listening | null>(null)
  const tourRef = useRef<{ cancelled: boolean; advance: (() => void) | null } | null>(null)
  const turnsRef = useRef<Turn[]>([])
  const logRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  turnsRef.current = turns

  const voice = useCallback(() => {
    voiceRef.current ??= new GuideVoice()
    return voiceRef.current
  }, [])

  useEffect(() => voice().subscribe(setVoiceState), [voice])
  useEffect(() => setMicSupported(canListen()), [])
  useEffect(() => {
    if (open) loadRegistry().then((registry) => (registryRef.current = registry)).catch(() => {})
  }, [open])
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [turns, interim])
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

  const stopEverything = useCallback(() => {
    abortRef.current?.abort()
    listeningRef.current?.cancel()
    listeningRef.current = null
    voice().stop()
    endTour()
  }, [endTour, voice])

  const runTour = useCallback(
    async (steps: TourStep[]) => {
      const registry = registryRef.current
      if (!registry) return
      const control = { cancelled: false, advance: null as (() => void) | null }
      tourRef.current = control
      setStatus('touring')
      await voice().idle()
      for (let index = 0; index < steps.length && !control.cancelled; index++) {
        const step = steps[index]!
        const target = registry.targets.get(step.target)
        clearHighlights()
        setTour({ index, total: steps.length, waiting: false })
        setTurns((current) => [...current, { id: ++turnIds, role: 'assistant', text: step.narration, shown: [step.target], step: { index, total: steps.length } }])
        if (target) await focusTarget(target, navigate)
        if (control.cancelled) break
        if (voice().ready) {
          await voice().speak(step.narration)
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
    [navigate, voice],
  )

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text) return
      stopEverything()
      clearHighlights()
      setInput('')
      setInterim('')

      const userTurn: Turn = { id: ++turnIds, role: 'user', text }
      const reply: Turn = { id: ++turnIds, role: 'assistant', text: '' }
      const history = historyFor([...turnsRef.current, userTurn], registryRef.current)
      setTurns((current) => [...current, userTurn, reply])
      setStatus('thinking')

      const controller = new AbortController()
      abortRef.current = controller
      const sentences = new SentenceBuffer()
      const speakAll = (parts: string[]) => parts.forEach((part) => void voice().speak(part))
      let tourSteps: TourStep[] | null = null
      let shownCount = 0

      const registry = registryRef.current ?? (await loadRegistry().catch(() => null))
      registryRef.current = registry

      const applyAction = (action: GuideAction) => {
        if (action.type === 'show') {
          const target = registry?.targets.get(action.target)
          if (!target) return
          updateTurn(reply.id, (turn) => ({ ...turn, shown: [...(turn.shown || []), action.target] }))
          void focusTarget(target, navigate, shownCount++ === 0 ? 'primary' : 'supporting')
        } else if (action.type === 'links') {
          const valid = action.links.filter((id) => registry?.links.has(id))
          updateTurn(reply.id, (turn) => ({ ...turn, links: [...new Set([...(turn.links || []), ...valid])] }))
        } else if (action.type === 'tour') {
          tourSteps = action.steps.filter((step) => registry?.targets.has(step.target))
        }
      }

      try {
        await streamGuideTurn(
          apiUrl,
          { messages: history, route: window.location.pathname },
          (event) => {
            if (event.t === 'text') {
              updateTurn(reply.id, (turn) => ({ ...turn, text: turn.text + event.d }))
              if (voice().ready) speakAll(sentences.push(event.d))
            } else if (event.t === 'action') {
              applyAction(event.action)
            } else if (event.t === 'error') {
              updateTurn(reply.id, (turn) => ({ ...turn, text: turn.text ? `${turn.text}\n${event.message}` : event.message, error: !turn.text }))
            }
          },
          controller.signal,
        )
        if (voice().ready) speakAll([sentences.flush()])
      } catch (error) {
        if (controller.signal.aborted) return
        const code = error instanceof GuideRequestError ? error.code : 'network'
        updateTurn(reply.id, (turn) => ({
          ...turn,
          error: true,
          text: ERROR_COPY[code] || "I couldn't reach the guide. Check your connection and try again.",
        }))
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
    stopEverything()
    setStatus('listening')
    setInterim('')
    const listening = listenOnce(setInterim)
    listeningRef.current = listening
    try {
      const heard = await listening.result
      if (listeningRef.current !== listening) return
      listeningRef.current = null
      if (heard) void send(heard)
      else {
        setInterim('')
        setStatus('idle')
      }
    } catch (error) {
      listeningRef.current = null
      setInterim('')
      setStatus('idle')
      const denied = /not-allowed|service-not-allowed/.test(String((error as Error).message))
      setTurns((current) => [...current, { id: ++turnIds, role: 'assistant', error: true, text: denied ? 'Microphone access is blocked. Allow it in your browser, or type your question.' : "I couldn't hear that. Please try again or type your question." }])
    }
  }, [send, stopEverything])

  const toggleVoice = useCallback(() => {
    if (voiceState.status === 'off') voice().enable()
    else voice().disable()
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
      ? `Loading voice ${Math.round(voiceState.progress * 100)}%`
      : voiceState.status === 'ready'
        ? 'Voice on'
        : voiceState.status === 'failed'
          ? 'Voice unavailable'
          : 'Turn on voice'
  const statusLabel =
    status === 'listening' ? 'Listening…' : status === 'thinking' ? 'Thinking…' : status === 'touring' && tour ? `Tour · step ${tour.index + 1} of ${tour.total}` : ''

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
            title={voiceState.status === 'off' ? 'Spoken replies use a voice model that downloads once to this browser' : voiceState.device || undefined}
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

        {turns.map((turn) => (
          <div className={`guide-turn guide-turn--${turn.role}${turn.error ? ' is-error' : ''}${turn.step ? ' is-step' : ''}`} key={turn.id}>
            {turn.step ? <div className="guide-step-label">Step {turn.step.index + 1} of {turn.step.total}</div> : null}
            <p>{turn.text || (turn.role === 'assistant' && status === 'thinking' ? '…' : '')}</p>
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
        ))}
        {interim ? <div className="guide-turn guide-turn--user is-interim"><p>{interim}</p></div> : null}
      </div>

      {tour ? (
        <div className="guide-tour-bar">
          <span>Step {tour.index + 1} of {tour.total}</span>
          {tour.waiting ? (
            <button className="guide-chip" onClick={() => tourRef.current?.advance?.()} type="button">
              Next
            </button>
          ) : null}
          <button className="guide-chip" onClick={() => { endTour(); voice().stop(); setStatus('idle') }} type="button">
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
              aria-label={status === 'listening' ? 'Stop listening' : 'Speak your question'}
              aria-pressed={status === 'listening'}
              className={`guide-icon-button guide-mic${status === 'listening' ? ' is-listening' : ''}`}
              onClick={toggleListening}
              type="button"
            >
              <MicIcon />
            </button>
          ) : null}
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
