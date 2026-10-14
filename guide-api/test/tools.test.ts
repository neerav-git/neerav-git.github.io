import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Knowledge } from '../src/knowledge.ts'
import { TurnState, candidatesFor } from '../src/tools.ts'

const targets = [
  { id: 'project.relay', route: '/projects/relay/', anchor: 'overview', label: 'Relay' },
  { id: 'project.relay.methodology', route: '/projects/relay/', anchor: 'methodology', label: 'Relay: build, evidence, and scope' },
  { id: 'project.refract-ai', route: '/projects/refract-ai/', anchor: 'overview', label: 'Refract' },
  { id: 'resume.pdf', route: '/resume/', anchor: 'resume-pdf', label: 'Resume: PDF and summary' },
]
const links = [{ id: 'link.contact.email', label: 'Email', url: 'mailto:someone@example.com' }]
const knowledge: Knowledge = {
  version: 'test', knowledge: '', targets, links,
  targetById: new Map(targets.map((t) => [t.id, t])),
  linkById: new Map(links.map((l) => [l.id, l])),
}

test('a registered target is shown', () => {
  const outcome = new TurnState(knowledge).run('show_on_page', { target_id: 'project.relay', reason: 'overview' })
  assert.equal(outcome.ok, true)
  assert.deepEqual(outcome.ok && outcome.action, { type: 'show', target: 'project.relay' })
})

test('an invented target returns candidates instead of moving the page', () => {
  const outcome = new TurnState(knowledge).run('show_on_page', { target_id: 'project.relay.evaluation', reason: 'relay evaluation methodology' })
  assert.equal(outcome.ok, false)
  const ids = (outcome.ok ? [] : (outcome.error.candidates as Array<{ id: string }>)).map((c) => c.id)
  assert.equal(ids[0], 'project.relay.methodology')
})

test('a second page in the same answer is refused, same page is allowed', () => {
  const state = new TurnState(knowledge)
  assert.equal(state.run('show_on_page', { target_id: 'project.relay', reason: '' }).ok, true)
  assert.equal(state.run('show_on_page', { target_id: 'project.relay.methodology', reason: '' }).ok, true)
  const other = state.run('show_on_page', { target_id: 'project.refract-ai', reason: '' })
  assert.equal(other.ok, false)
  assert.equal(!other.ok && other.error.error, 'ONE_PAGE_PER_ANSWER')
})

test('tours may cross pages but need 2 to 4 valid steps and exclude highlights', () => {
  const state = new TurnState(knowledge)
  assert.equal(state.run('start_tour', { steps: [{ target_id: 'project.relay', narration: 'x' }] }).ok, false)
  const repeated = state.run('start_tour', { steps: [
    { target_id: 'project.relay', narration: 'Relay.' },
    { target_id: 'project.relay', narration: 'Relay again.' },
  ] })
  assert.equal(!repeated.ok && repeated.error.error, 'DUPLICATE_STEP')
  const tour = state.run('start_tour', { steps: [
    { target_id: 'project.relay', narration: 'Relay shows agent safety.' },
    { target_id: 'project.refract-ai', narration: 'Refract shows research tooling.' },
  ] })
  assert.equal(tour.ok, true)
  assert.equal(state.run('show_on_page', { target_id: 'resume.pdf', reason: '' }).ok, false)
})

test('links must come from the registry', () => {
  const state = new TurnState(knowledge)
  assert.equal(state.run('offer_links', { link_ids: ['link.contact.email'] }).ok, true)
  assert.equal(state.run('offer_links', { link_ids: ['https://evil.example'] }).ok, false)
})

test('candidates ignore unrelated targets', () => {
  assert.deepEqual(candidatesFor(targets, 'zzz unrelated'), [])
})

test('declining marks the turn off topic without moving the page', () => {
  const state = new TurnState(knowledge)
  const outcome = state.run('decline_off_topic', { category: 'code_or_writing_task' })
  assert.equal(outcome.ok, true)
  assert.equal(outcome.ok && outcome.action, undefined)
  assert.equal(state.offTopic, true)
})
