import fs from 'node:fs'
import path from 'node:path'

import { expect, type Page, type TestInfo } from '@playwright/test'

export type GuideEvent =
  | { t: 'text'; d: string }
  | { t: 'heard'; d: string }
  | { t: 'action'; action: { type: string; target?: string; steps?: Array<{ target: string; narration: string }>; links?: string[] } }
  | { t: 'done'; offTopic?: boolean }
  | { t: 'error'; code: string; message: string }

export const panel = (page: Page) => page.locator('aside.guide-panel')
export const lastAnswer = (page: Page) => page.locator('.guide-turn--assistant:not(.is-step)').last()

type ChatLog = Array<{ body: string; done: boolean }>

/**
 * Records every guide reply inside the page. Playwright cannot tell when a streamed response the page is still
 * reading has finished, so the page tees the stream and marks each reply done when it closes.
 */
export async function recordReplies(page: Page) {
  await page.addInitScript(() => {
    const log: Array<{ body: string; done: boolean }> = []
    Object.assign(window, { __guideReplies: log })
    const original = window.fetch.bind(window)
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await original(...args)
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : args[0].url
      if (!url.includes('/chat') || !response.body) return response
      const entry = { body: '', done: false }
      log.push(entry)
      const [forPage, forTest] = response.body.tee()
      void (async () => {
        const reader = forTest.pipeThrough(new TextDecoderStream()).getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          entry.body += value
        }
        entry.done = true
      })()
      return new Response(forPage, { status: response.status, statusText: response.statusText, headers: response.headers })
    }
  })
}

export async function openGuide(page: Page, path = '/') {
  await recordReplies(page)
  await page.goto(path, { waitUntil: 'networkidle' })
  await page.locator('.guide-launcher').click()
  await expect(panel(page)).toBeVisible()
}

const replyCount = (page: Page) => page.evaluate(() => (window as unknown as { __guideReplies: ChatLog }).__guideReplies.length)

/** Runs `trigger` and returns the events of the guide reply it caused, once the stream has closed. */
export async function replyTo(page: Page, trigger: () => Promise<unknown>) {
  const before = await replyCount(page)
  await trigger()
  await expect.poll(() => page.evaluate((index) => (window as unknown as { __guideReplies: ChatLog }).__guideReplies[index]?.done ?? false, before), { timeout: 90_000 }).toBe(true)
  const body = await page.evaluate((index) => (window as unknown as { __guideReplies: ChatLog }).__guideReplies[index].body, before)
  return body
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GuideEvent)
}

/** Types a question, sends it, and returns the streamed events and the answer text. */
export async function ask(page: Page, question: string) {
  const events = await replyTo(page, async () => {
    await page.locator('textarea[aria-label="Ask the guide"]').fill(question)
    await page.locator('button[aria-label="Send"]').click()
  })
  return { events, text: textOf(events) }
}

export const textOf = (events: GuideEvent[]) => events.filter((e): e is { t: 'text'; d: string } => e.t === 'text').map((e) => e.d).join('').trim()
export const actionsOf = (events: GuideEvent[]) => events.flatMap((e) => (e.t === 'action' ? [e.action] : []))

const keyTerms = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/guide/key-terms.json'), 'utf8')) as Record<string, { lead: Array<{ term: string; match?: string }> }>
const PROJECTS: Record<string, RegExp> = {
  'projects/relay.md': /\bRelay\b/g,
  'projects/refract-ai.md': /\bRefract\b/g,
  'projects/homeward.md': /\bHomeward\b/g,
  'projects/birb-hangout.md': /\bBirb Hangout\b/g,
  'projects/brain-atrophy-computer-vision.md': /brain[- ]atrophy|IEEE (paper|study)/gi,
  'projects/alzheimers-disease-research.md': /four-class|four (dementia )?stages|78 to 85/gi,
}

/**
 * The chat assessment: the same rules the eval comparison uses, applied to what the visitor actually saw.
 * Hard rules fail the test; key-term coverage is reported, since a passing mention needs no term.
 */
export function assessAnswer(text: string, options: { maxWords?: number; project?: string } = {}) {
  const words = text.split(/\s+/).filter(Boolean).length
  const hard: Record<string, boolean> = {
    [`spoken length ≤ ${options.maxWords ?? 130} words`]: words <= (options.maxWords ?? 130),
    'no URLs or markdown': !/https?:\/\/|www\.|\*\*|`|(^|\n)\s*([-*•]|\d+\.|#+)\s/.test(text),
    'no internal ids or tags': !/\b(project|link|archive|home|page)\.[a-z]|<\/?[a-z_]+>/.test(text),
    'no leaked reasoning': !/\bthe visitor\b|\bso I (decline|steer)\b|\bcall(ing)? (show_on_page|start_tour|offer_links)\b/i.test(text),
    'no tour talk': !/\b(?:one|two|three|four|five|six|\d|next|first|last|final|each|the|these|those) stops?\b|\bstop each\b|\bhere (?:is|are|'s) (?:a |the )?(?:walkthrough|tour|stops)\b/i.test(text),
    // An offer ("I can show you his products") is fine; announcing a move the visitor is watching is not.
    'no announced page moves': !/\bI'll show\b|\blet me show\b|\bI'm opening\b|\bI'll open\b|\bI'll take you\b/i.test(text),
    'no filler words': !/\b(leverag\w*|robust|seamless\w*|cutting-edge|state-of-the-art|synerg\w*|best-in-class|world-class)\b/i.test(text),
  }
  const keyTermsNamed: Record<string, boolean> = {}
  for (const [key, name] of Object.entries(PROJECTS)) {
    const mentions = (text.match(name) || []).length
    // A tour stop always describes its own project; elsewhere a passing mention needs no term.
    if (options.project ? !key.endsWith(`/${options.project}.md`) : mentions < 2) continue
    keyTermsNamed[path.basename(key, '.md')] = keyTerms[key].lead.some(({ term, match }) => new RegExp(match ?? term, 'i').test(text))
  }
  return { words, hard, keyTermsNamed }
}

/**
 * Attaches the assessment to the report and fails on any hard rule. Key-term misses vary from run to run, so they
 * are recorded as warnings on the test rather than failing it.
 */
export async function expectGoodAnswer(testInfo: TestInfo, label: string, text: string, options: { maxWords?: number; project?: string } = {}) {
  const assessment = assessAnswer(text, options)
  const body = JSON.stringify({ label, text, ...assessment }, null, 2)
  await testInfo.attach(`assessment: ${label}`, { body, contentType: 'application/json' })
  fs.writeFileSync(testInfo.outputPath(`assessment-${label.replace(/[^a-z0-9]+/gi, '-')}.json`), body)
  for (const [rule, ok] of Object.entries(assessment.hard)) expect.soft(ok, `${label}: ${rule}\n"${text}"`).toBe(true)
  for (const [project, named] of Object.entries(assessment.keyTermsNamed)) {
    if (!named) testInfo.annotations.push({ type: 'key term missing', description: `${label}: describes ${project} without its lead term` })
  }
  return assessment
}

export async function inViewport(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    const box = element.getBoundingClientRect()
    return box.bottom > 0 && box.top < window.innerHeight
  })
}
