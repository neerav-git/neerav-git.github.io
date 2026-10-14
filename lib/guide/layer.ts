/**
 * The single owner of guide highlights on the page. One element carries the primary glow; later highlights in the
 * same answer become supporting. Everything is cleared when the visitor starts a new turn, so a new topic never
 * inherits the previous glow.
 */
export type GuideTarget = { id: string; route: string; anchor: string | null; label: string }
export type GuideLink = { id: string; label: string; url: string }
export type GuideRegistry = { version: string; targets: Map<string, GuideTarget>; links: Map<string, GuideLink> }

const PRIMARY = 'guide-focus'
const SUPPORTING = 'guide-focus--supporting'

let registryPromise: Promise<GuideRegistry> | null = null

export function loadRegistry() {
  registryPromise ??= fetch('/guide/targets.json')
    .then((response) => {
      if (!response.ok) throw new Error(`targets.json ${response.status}`)
      return response.json() as Promise<{ version: string; targets: GuideTarget[]; links: GuideLink[] }>
    })
    .then((raw) => ({
      version: raw.version,
      targets: new Map(raw.targets.map((target) => [target.id, target])),
      links: new Map(raw.links.map((link) => [link.id, link])),
    }))
    .catch((error) => {
      registryPromise = null
      throw error
    })
  return registryPromise
}

export function clearHighlights() {
  document.querySelectorAll<HTMLElement>(`.${PRIMARY}, .${SUPPORTING}`).forEach((element) => {
    element.classList.remove(PRIMARY, SUPPORTING)
  })
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function locate(target: GuideTarget) {
  if (target.anchor) return document.getElementById(target.anchor)
  const heading = document.querySelector<HTMLElement>('#site-main h1')
  return heading?.closest<HTMLElement>('section, header, .detail-header, .detail-mast') ?? heading
}

function normalizePath(path: string) {
  return path.endsWith('/') ? path : `${path}/`
}

/**
 * Moves to the target's page if needed, waits for it to render, opens any collapsed container, scrolls it into view,
 * and highlights it. Resolves false if the target never appeared.
 */
export async function focusTarget(target: GuideTarget, navigate: (route: string) => void, importance: 'primary' | 'supporting' = 'primary') {
  if (normalizePath(window.location.pathname) !== normalizePath(target.route)) navigate(target.route)

  let element: HTMLElement | null = null
  for (let attempt = 0; attempt < 50 && !element; attempt++) {
    if (normalizePath(window.location.pathname) === normalizePath(target.route)) element = locate(target)
    if (!element) await wait(80)
  }
  if (!element) return false

  for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true
  }
  if (importance === 'primary') {
    document.querySelectorAll<HTMLElement>(`.${PRIMARY}`).forEach((other) => {
      other.classList.replace(PRIMARY, SUPPORTING)
    })
  }
  element.classList.add(importance === 'primary' ? PRIMARY : SUPPORTING)
  if (importance === 'primary') resetTabs(element)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // On phones the guide is a bottom sheet, so targets go to the top of the screen where the sheet can't cover them.
  const toTop = window.innerWidth <= 720 || element.offsetHeight > window.innerHeight * 0.6
  element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: toTop ? 'start' : 'center' })
  return true
}

function tabsIn(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>('[role="tablist"]')].map((list) => [...list.querySelectorAll<HTMLElement>('[role="tab"]')])
}

function select(tab: HTMLElement | undefined) {
  if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click()
}

/** A highlighted section starts from its beginning: each of its tab sets returns to the first tab. */
function resetTabs(root: HTMLElement) {
  for (const tabs of tabsIn(root)) select(tabs[0])
}

/**
 * Tabs inside the highlighted section follow the answer. Each tab lists the words that refer to it in
 * data-guide-mentions; the tab mentioned earliest in `text` is selected. Called per sentence as it is spoken,
 * or once with the whole answer when it is only shown as text.
 */
export function followAnswer(text: string) {
  const root = document.querySelector<HTMLElement>(`.${PRIMARY}`)
  if (!root || !text) return
  for (const tabs of tabsIn(root)) {
    let earliest: { tab: HTMLElement; at: number } | null = null
    for (const tab of tabs) {
      for (const word of (tab.dataset.guideMentions || '').split(',')) {
        const term = word.trim()
        if (!term) continue
        const at = text.search(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))
        if (at >= 0 && (!earliest || at < earliest.at)) earliest = { tab, at }
      }
    }
    select(earliest?.tab)
  }
}
