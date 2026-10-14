import assert from 'node:assert/strict'
import { test } from 'node:test'

import { HeardFilter, needsPostToolResponse, toApiMessages } from '../src/agent.ts'

test('a successful action does not trigger a second model reply after text was spoken', () => {
  assert.equal(needsPostToolResponse('Relay completed the workflow.', true), false)
})

test('the model replies after a tool-first action or a tool error', () => {
  assert.equal(needsPostToolResponse('', true), true)
  assert.equal(needsPostToolResponse('I will show Relay.', false), true)
})

test('page-move notes leave earlier guide answers and travel with the next visitor turn', () => {
  const api = toApiMessages([
    { role: 'user', content: 'Tell me about Refract' },
    { role: 'assistant', content: 'Refract is a research workspace. (Shown on the page: Refract)' },
    { role: 'user', content: 'Who would use it?' },
  ], '/projects/refract-ai/')
  assert.deepEqual(api[0], { role: 'user', content: 'Tell me about Refract' })
  assert.deepEqual(api[1], { role: 'assistant', content: 'Refract is a research workspace.' })
  assert.deepEqual(api[2], {
    role: 'user',
    content: [
      { type: 'text', text: '[Your previous answer showed on the page: Refract]' },
      { type: 'text', text: '[The visitor is currently on /projects/refract-ai/]' },
      { type: 'text', text: 'Who would use it?' },
    ],
  })
})

test('long guide turns are trimmed and oversized histories drop the oldest turns instead of failing', async () => {
  const { parseMessages } = await import('../src/messages.ts')
  const long = 'x'.repeat(2600)
  const parsed = parseMessages([{ role: 'user', content: 'What has he built?' }, { role: 'assistant', content: long }, { role: 'user', content: 'Tell me more about the second one' }])
  assert.ok(parsed)
  assert.equal(parsed![1].content.length, 2000)
  const many = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'y'.repeat(i % 2 ? 2000 : 7000) }))
  many.push({ role: 'user', content: 'latest question' })
  const trimmed = parseMessages(many)
  assert.ok(trimmed)
  assert.equal(trimmed!.at(-1)!.content, 'latest question')
  assert.equal(trimmed![0].role, 'user')
  assert.equal(parseMessages([{ role: 'user', content: 'z'.repeat(8001) }]), null)
})

test('the heard line leaves the answer and reaches the browser separately, even split across deltas', () => {
  const heard: string[] = []
  const filter = new HeardFilter((question) => heard.push(question))
  const out = ['<he', 'ard>What has Neer', 'av built?</heard>\n', 'Neerav has built ', 'four products.'].map((delta) => filter.push(delta)).join('') + filter.flush()
  assert.deepEqual(heard, ['What has Neerav built?'])
  assert.equal(out, 'Neerav has built four products.')
})

test('replies without a heard line pass through unchanged', () => {
  const heard: string[] = []
  const filter = new HeardFilter((question) => heard.push(question))
  const out = ['<', 'b>Relay</b> is', ' a workspace.'].map((delta) => filter.push(delta)).join('') + filter.flush()
  assert.deepEqual(heard, [])
  assert.equal(out, '<b>Relay</b> is a workspace.')
})

test('voice questions are marked so the model restates what was heard', () => {
  const api = toApiMessages([{ role: 'user', content: 'what has need of built' }], '/', true)
  assert.deepEqual(api[0], {
    role: 'user',
    content: [
      { type: 'text', text: '[The visitor is currently on /]' },
      { type: 'text', text: "[Asked by voice: this is the speech recognizer's transcript]" },
      { type: 'text', text: 'what has need of built' },
    ],
  })
})

test('a heard line written after a text-free page action is still taken out', () => {
  const heard: string[] = []
  const filter = new HeardFilter((question) => heard.push(question))
  // First model step: only a tool call, so the step ends with no text.
  const first = filter.flush()
  const second = ['<heard>Show me the brain atrophy paper.</heard> ', 'This is the IEEE study.'].map((delta) => filter.push(delta)).join('') + filter.flush()
  assert.equal(first, '')
  assert.deepEqual(heard, ['Show me the brain atrophy paper.'])
  assert.equal(second, 'This is the IEEE study.')
})
