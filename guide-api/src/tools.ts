import type Anthropic from '@anthropic-ai/sdk'

import type { GuideTarget, Knowledge } from './knowledge.ts'

export type GuideAction =
  | { type: 'show'; target: string }
  | { type: 'tour'; steps: Array<{ target: string; narration: string }> }
  | { type: 'links'; links: string[] }

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'show_on_page',
    description:
      "Scroll the visitor's page to a registered target and highlight it. Use it whenever the answer is about a specific project, section, or page. One page per answer: several targets on the same page are fine, targets on a different page are rejected. target_id must be an exact id from the target registry.",
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        target_id: { type: 'string', description: 'Exact id from the target registry, e.g. project.relay.methodology' },
        reason: { type: 'string', description: 'Why this target answers the question, in a few words' },
      },
      required: ['target_id', 'reason'],
    },
  },
  {
    name: 'start_tour',
    description:
      'Walk the visitor through 2 to 4 registered targets in order; each narration (one or two sentences) is spoken while its target is highlighted. Use it for hiring-manager walkthroughs and when the visitor asks for a tour or overview, instead of show_on_page in that answer.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        steps: {
          type: 'array',
          description: '2 to 4 steps, in the order they should be shown',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              target_id: { type: 'string', description: 'Exact id from the target registry' },
              narration: { type: 'string', description: 'One or two spoken sentences for this step, tied to the evidence shown' },
            },
            required: ['target_id', 'narration'],
          },
        },
      },
      required: ['steps'],
    },
  },
  {
    name: 'offer_links',
    description:
      'Show buttons for registered links (repository, live demo, paper, resume PDF, email, LinkedIn) in the guide panel. The visitor chooses whether to open them. link_ids must be exact ids from the link registry.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        link_ids: { type: 'array', items: { type: 'string' }, description: '1 to 4 exact ids from the link registry' },
      },
      required: ['link_ids'],
    },
  },
]

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'page', 'section', 'project', 'show', 'about'])

function words(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word))
}

/** Closest registered targets for an id the registry doesn't have, matched on the id and the call's own reason. */
export function candidatesFor(targets: GuideTarget[], value: string, context = '') {
  const query = [...new Set(words(`${value} ${context}`))]
  return targets
    .map((target) => ({ target, score: query.filter((word) => `${target.id} ${target.label}`.toLowerCase().includes(word)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ target }) => ({ id: target.id, label: target.label }))
}

type ToolOutcome = { ok: true; result: Record<string, unknown>; action: GuideAction } | { ok: false; error: Record<string, unknown> }

/** Per-answer state: one destination page, and either highlights or a tour, never both. */
export class TurnState {
  private readonly knowledge: Knowledge
  private route: string | null = null
  private mode: 'show' | 'tour' | null = null

  constructor(knowledge: Knowledge) {
    this.knowledge = knowledge
  }

  run(name: string, input: unknown): ToolOutcome {
    const args = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
    if (name === 'show_on_page') return this.show(String(args.target_id ?? ''), String(args.reason ?? ''))
    if (name === 'start_tour') return this.tour(args.steps)
    if (name === 'offer_links') return this.links(args.link_ids)
    return { ok: false, error: { error: 'UNKNOWN_TOOL', message: `No tool named ${name}.` } }
  }

  private unknownTarget(value: string, context: string) {
    const candidates = candidatesFor(this.knowledge.targets, value, context)
    return {
      ok: false as const,
      error: {
        error: 'TARGET_NOT_FOUND',
        target_id: value,
        candidates,
        hint: candidates.length
          ? 'Retry once with the candidate id that matches what the visitor asked about.'
          : 'Pick an id from the target registry in the knowledge, or answer in words without moving the page.',
      },
    }
  }

  private show(id: string, reason: string): ToolOutcome {
    if (this.mode === 'tour') return { ok: false, error: { error: 'TOUR_ALREADY_STARTED', message: 'This answer already starts a tour; describe anything else in words.' } }
    const target = this.knowledge.targetById.get(id)
    if (!target) return this.unknownTarget(id, reason)
    if (this.route && this.route !== target.route) {
      return { ok: false, error: { error: 'ONE_PAGE_PER_ANSWER', message: `This answer already moved the visitor to ${this.route}. Name the other item in words instead.` } }
    }
    this.route = target.route
    this.mode = 'show'
    return { ok: true, result: { status: 'shown', label: target.label, page: target.route }, action: { type: 'show', target: id } }
  }

  private tour(rawSteps: unknown): ToolOutcome {
    if (this.mode) return { ok: false, error: { error: 'ALREADY_SHOWING', message: 'Use either start_tour or show_on_page in one answer, not both.' } }
    const steps = Array.isArray(rawSteps) ? rawSteps : []
    if (steps.length < 2 || steps.length > 4) return { ok: false, error: { error: 'TOUR_LENGTH', message: 'A tour needs 2 to 4 steps.' } }
    const clean: Array<{ target: string; narration: string }> = []
    for (const step of steps) {
      const id = String(step?.target_id ?? '')
      const narration = String(step?.narration ?? '').trim()
      if (!this.knowledge.targetById.has(id)) return this.unknownTarget(id, narration)
      if (!narration) return { ok: false, error: { error: 'EMPTY_NARRATION', target_id: id } }
      clean.push({ target: id, narration: narration.slice(0, 400) })
    }
    this.mode = 'tour'
    return { ok: true, result: { status: 'tour_started', steps: clean.map((step) => this.knowledge.targetById.get(step.target)!.label) }, action: { type: 'tour', steps: clean } }
  }

  private links(rawIds: unknown): ToolOutcome {
    const ids = (Array.isArray(rawIds) ? rawIds : []).map(String).slice(0, 4)
    const unknown = ids.filter((id) => !this.knowledge.linkById.has(id))
    if (!ids.length || unknown.length) {
      return { ok: false, error: { error: 'LINK_NOT_FOUND', link_ids: unknown, hint: 'Use exact ids from the link registry.' } }
    }
    return { ok: true, result: { status: 'offered', labels: ids.map((id) => this.knowledge.linkById.get(id)!.label) }, action: { type: 'links', links: ids } }
  }
}
