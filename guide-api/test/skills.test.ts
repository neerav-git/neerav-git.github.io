import assert from 'node:assert/strict'
import { test } from 'node:test'

import { guideFooterSkills } from '../../lib/guide/skills.ts'
import { GUIDE_RULES } from '../src/prompt.ts'

test('project context produces a compact, stable response footer', () => {
  assert.deepEqual(
    guideFooterSkills('Relay verifies the completed request.', ['Agentic Workflows', 'Harness Engineering', 'TypeScript', 'Voice AI', 'Playwright']),
    ['Agentic Workflows', 'Harness Engineering', 'TypeScript', 'Voice AI'],
  )
})

test('portfolio-level skills appear only when the answer names them', () => {
  assert.deepEqual(
    guideFooterSkills('His broader toolkit includes Python, PyTorch, LangChain, and Hugging Face.'),
    ['Python', 'PyTorch', 'LangChain', 'Hugging Face'],
  )
  assert.deepEqual(guideFooterSkills('Refract keeps research evidence connected.'), [])
})

test('the response rules require focused evidence and project-grounded skill explanations', () => {
  assert.match(GUIDE_RULES, /observed problem, engineering decision, and verified result/i)
  assert.match(GUIDE_RULES, /group technologies by the work they enable/i)
  assert.match(GUIDE_RULES, /Do not turn a focused question into a portfolio inventory/i)
})
