// Key-term comparison: checks a candidate rubric run against the recorded baseline so that naming the field and
// technology never costs the plain, benefit-led answers. Both inputs come from rubric.mjs with RUBRIC_JSON set.
// Usage (from the repo root): node guide-api/eval/compare.mjs <baseline.json> <candidate.json> [review.md]
// Writes a side-by-side review sheet (default: next to the candidate) and exits 1 if a hard gate fails.
import fs from 'node:fs'
import path from 'node:path'

const [baselinePath, candidatePath, reviewArg] = process.argv.slice(2)
const baseline = new Map(JSON.parse(fs.readFileSync(baselinePath, 'utf8')).results.map((r) => [r.id, r]))
const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8')).results
const keyTerms = JSON.parse(fs.readFileSync('content/guide/key-terms.json', 'utf8'))
const reviewPath = reviewArg || candidatePath.replace(/\.json$/, '-review.md')

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const termPattern = ({ term, match }) => new RegExp(match ?? escape(term), 'i')

// How an answer refers to each project, and which tour targets belong to it.
const PROJECTS = {
  'projects/relay.md': { name: /\bRelay\b/g, target: 'project.relay' },
  'projects/refract-ai.md': { name: /\bRefract\b/g, target: 'project.refract-ai' },
  'projects/homeward.md': { name: /\bHomeward\b/g, target: 'project.homeward' },
  'projects/birb-hangout.md': { name: /\bBirb Hangout\b/g, target: 'project.birb-hangout' },
  'projects/brain-atrophy-computer-vision.md': { name: /brain[- ]atrophy|IEEE (paper|study)/gi, target: 'project.brain-atrophy-computer-vision' },
  'projects/alzheimers-disease-research.md': { name: /four-class|four stages|MRI (classification|ensemble)|78 to 85/gi, target: 'project.alzheimers-disease-research' },
  'deep-strat.md': { name: /Deep Strat/gi, target: null },
}

// Technical vocabulary: every key term plus common stack words, longest first so phrases win over their parts.
const vocabulary = new Set(['LLM', 'LLMs', 'AI agent', 'AI agents', 'machine learning', 'neural network', 'neural networks', 'embeddings', 'vector', 'API', 'APIs', 'SQL', 'Python', 'TypeScript', 'React', 'agentic'])
for (const entry of Object.values(keyTerms)) {
  for (const { term } of entry.lead) vocabulary.add(term.replace(/\s*\(.*\)$/, ''))
  for (const term of entry.supporting) for (const part of term.split(/ with | and /)) vocabulary.add(part.trim())
}
vocabulary.add('RAG').add('MCP').add('CNNs').add('CNN')
const TECH = new RegExp(`\\b(?:${[...vocabulary].filter(Boolean).sort((a, b) => b.length - a.length).map(escape).join('|')})\\b`, 'gi')
const FILLER = /\b(leverag\w*|robust|seamless\w*|cutting-edge|state-of-the-art|synerg\w*|best-in-class|next-generation|game-chang\w*|world-class|holistic|paradigm)\b/gi
const TECH_QUESTION = /\b(tech|stack|tools?|built with|build|built|how (was|is|does|did)|framework|languages?|skills?|engineer\w*|machine learning|ML|AI|models?|architecture|technical|methodology|method)\b/i

const words = (text) => text.trim().split(/\s+/).filter(Boolean).length
const firstSentence = (text) => text.trim().split(/(?<=[.!?])\s+/)[0] || ''
const techTerms = (text) => text.match(TECH) || []
const metrics = (text) => new Set(text.match(/\b\d[\d,.]*\b(?: percent)?/g) || [])
// Three or more technical terms joined only by commas or "and": a stacked list of jargon.
const stacked = (text) => {
  const runs = []
  const pattern = new RegExp(`${TECH.source}(?:\\s*(?:,|, and|and)\\s*${TECH.source}){2,}`, 'gi')
  for (const match of text.matchAll(pattern)) runs.push(match[0])
  return runs
}

/** Splits an answer into what it describes: the main text per project it focuses on, and each tour stop. */
function segments(result) {
  const out = []
  const text = result.answer || ''
  const named = Object.entries(PROJECTS).map(([key, spec]) => ({ key, count: (text.match(spec.name) || []).length })).filter((item) => item.count)
  for (const { key, count } of named) {
    // A project counts as described when it is the answer's only project or is named more than once;
    // a passing mention in a list of all four products is not a description.
    if (named.length === 1 || count >= 2) out.push({ key, text })
  }
  for (const step of result.tour || []) {
    // Newer runs record the target id; round 2 recorded a plain description of the stop ("the top of the Relay case study").
    const key = Object.entries(PROJECTS).find(([, spec]) => (spec.target && step.target?.startsWith(spec.target)) || (step.stop && new RegExp(spec.name.source, 'i').test(step.stop)))?.[0]
    if (key) out.push({ key, text: step.narration || '' })
  }
  return out
}

function coverage(results) {
  const table = {}
  for (const result of results) {
    for (const { key, text } of segments(result)) {
      const row = (table[key] ??= { described: 0, named: 0 })
      row.described++
      if (keyTerms[key].lead.some((lead) => termPattern(lead).test(text))) row.named++
    }
  }
  return table
}

const gates = []
const gate = (name, pass, detail, hard = true) => gates.push({ name, pass, detail, hard })
const before = coverage([...baseline.values()])
const after = coverage(candidate)

const weak = Object.entries(after).filter(([, row]) => row.described >= 3 && row.named / row.described < 0.7)
gate('Lead-term coverage ≥ 70% per project', !weak.length, Object.entries(after).map(([key, row]) => `${path.basename(key, '.md')} ${row.named}/${row.described} (was ${before[key]?.named ?? 0}/${before[key]?.described ?? 0})`).join('; '))

// Opening sentences may name the field (computer vision, interaction design); they stay free of tools and acronyms.
const fields = new Set(Object.values(keyTerms).flatMap((entry) => entry.lead.map(({ term }) => term.replace(/\s*\(.*\)$/, '').toLowerCase())).concat(['machine learning', 'neural network', 'neural networks', 'ai agent', 'ai agents', 'evaluation harness', 'ieee']))
const toolTerms = (text) => techTerms(text).filter((term) => !fields.has(term.toLowerCase()))
const plainFirst = (results) => results.filter((r) => !TECH_QUESTION.test(r.question) && toolTerms(firstSentence(r.answer || '')).length)
const firstBefore = plainFirst([...baseline.values()])
const firstAfter = plainFirst(candidate)
gate('First sentence names no tools or acronyms on non-technical questions', firstAfter.length <= firstBefore.length, `${firstAfter.length} (baseline ${firstBefore.length})${firstAfter.length ? `: ${firstAfter.map((r) => r.id).join(', ')}` : ''}`)

const fullText = (r) => [r.answer || '', ...(r.tour || []).map((step) => step.narration || '')].join(' ')
const density = (r) => (techTerms(fullText(r)).length * 100) / Math.max(1, words(fullText(r)))
// Technical questions may name the stack; elsewhere an answer fails only if it is denser than 4 per 100 words
// and denser than its own baseline answer, so the gate measures what this change adds.
const general = (r) => !/^4\./.test(r.id) && !TECH_QUESTION.test(r.question)
const dense = candidate.filter((r) => general(r) && words(fullText(r)) >= 25 && density(r) > 4 && density(r) > density(baseline.get(r.id) ?? r))
gate('At most 4 technical terms per 100 words on non-technical questions', !dense.length, dense.map((r) => `${r.id} ${density(r).toFixed(1)}`).join(', ') || 'none')

const stacks = candidate.filter((r) => general(r) && stacked(fullText(r)).length > stacked(fullText(baseline.get(r.id) ?? { answer: '' })).length).flatMap((r) => stacked(fullText(r)).map((run) => `${r.id}: "${run}"`))
gate('No run of 3+ technical terms on non-technical questions', !stacks.length, stacks.join('; ') || 'none')

// Style the round-2 answers did without: talking about the tour, announcing page moves, and contrast phrasing.
const STYLE = {
  'Tour talk ("three stops", "one stop each")': /\b(?:one|two|three|four|five|six|\d|next|first|last|final|each) stops?\b|\bstop each\b|\bstops? (?:show|cover|map|walk)/i,
  'Announced page moves ("I can show you", "let me show you")': /\bI'll show\b|\bI can show\b|\blet me show\b|\bI'm opening\b|\bI'll open\b|\bI'll take you\b/i,
  'Contrast phrasing ("rather than", "not just")': /\brather than\b|\bnot just\b|\binstead of\b|\bmore than a\b/i,
}
for (const [name, pattern] of Object.entries(STYLE)) {
  const count = (results) => results.filter((r) => pattern.test(r.answer || ''))
  const was = count([...baseline.values()])
  const now = count(candidate)
  gate(`${name}: no more than baseline`, now.length <= was.length, `${now.length} (baseline ${was.length})${now.length ? `: ${now.map((r) => r.id).join(', ')}` : ''}`)
}

// Tour answers carry their own evidence before the tour starts, as round 2 did; a bare one-liner is a regression.
// Before a tour starts, round 2 usually gave concrete evidence: a named project, the IEEE study, Deep Strat, or a number.
const EVIDENCE = /\b(Relay|Refract|Homeward|Birb Hangout|IEEE|Deep Strat|Nullcon)\b|\d/
const specific = (results) => results.filter((r) => r.tour?.length && EVIDENCE.test(r.answer || ''))
const tours = (results) => results.filter((r) => r.tour?.length)
const specificBefore = specific([...baseline.values()]).length / Math.max(1, tours([...baseline.values()]).length)
const specificAfter = specific(candidate).length / Math.max(1, tours(candidate).length)
const vague = tours(candidate).filter((r) => !EVIDENCE.test(r.answer || ''))
gate('Tour answers give specific evidence first: share at least baseline', specificAfter >= specificBefore, `${(specificAfter * 100).toFixed(0)}% of tour answers (baseline ${(specificBefore * 100).toFixed(0)}%); without evidence: ${vague.map((r) => r.id).join(', ') || 'none'}`)

const filler = candidate.flatMap((r) => (fullText(r).match(FILLER) || []).map((word) => `${r.id}: ${word}`))
gate('No vague filler words', !filler.length, filler.join(', ') || 'none')

const tooLong = candidate.filter((r) => words(r.answer || '') > 130)
gate('Spoken length ≤ 130 words', !tooLong.length, tooLong.map((r) => `${r.id} ${words(r.answer)}w`).join(', ') || 'none')

const ratios = candidate.map((r) => ({ id: r.id, ratio: words(r.answer || '') / Math.max(1, words(baseline.get(r.id)?.answer || '')) }))
const median = ratios.map((r) => r.ratio).sort((a, b) => a - b)[Math.floor(ratios.length / 2)]
const longer = ratios.filter((r) => r.ratio > 1.2 && words(baseline.get(r.id)?.answer || '') >= 20)
gate('Answers stay about as long (median within 10%)', median <= 1.1, `median ${(median * 100).toFixed(0)}% of baseline; over 120%: ${longer.map((r) => `${r.id} ${(r.ratio * 100).toFixed(0)}%`).join(', ') || 'none'}`, true)

// Model output varies run to run, so these are reported for review rather than failing the change.
const lostMetrics = candidate.filter((r) => metrics(baseline.get(r.id)?.answer || '').size && !metrics(r.answer || '').size)
gate('Answers that had numbers still give one', !lostMetrics.length, lostMetrics.map((r) => r.id).join(', ') || 'none', false)
const navChanged = candidate.filter((r) => baseline.get(r.id) && (Boolean(r.tour?.length) !== Boolean(baseline.get(r.id).tour?.length) || /No navigation/.test(r.navigation) !== /No navigation/.test(baseline.get(r.id).navigation)))
gate('Same kind of page move (none, highlight, or tour)', !navChanged.length, navChanged.map((r) => r.id).join(', ') || 'none', false)

const failed = gates.filter((g) => g.hard && !g.pass)
console.log('Key-term comparison\n')
for (const g of gates) console.log(`${g.pass ? 'pass' : g.hard ? 'FAIL' : 'note'}  ${g.name}\n      ${g.detail}`)
console.log(`\n${failed.length ? `${failed.length} hard gate(s) failed` : 'All hard gates passed'}`)

// Side-by-side review sheet: every answer whose wording changed in a way that adds key terms, plus anything flagged.
const flagged = new Set([...firstAfter, ...dense, ...tooLong, ...lostMetrics].map((r) => r.id).concat(stacks.map((s) => s.split(':')[0]), longer.map((r) => r.id)))
const bold = (text) => text.replace(TECH, (term) => `**${term}**`)
const lines = ['# Key terms: baseline and candidate side by side', '', `Baseline: \`${path.basename(baselinePath)}\` · Candidate: \`${path.basename(candidatePath)}\``, '', 'Technical terms are in bold. Read each pair for one question: is the candidate at least as clear and natural as the baseline?', '', '## Gates', '', '| Gate | Result | Detail |', '| --- | --- | --- |']
for (const g of gates) lines.push(`| ${g.name} | ${g.pass ? 'pass' : g.hard ? '**FAIL**' : 'review'} | ${g.detail.replace(/\|/g, '/')} |`)
lines.push('', '## Answers', '')
for (const r of candidate) {
  const base = baseline.get(r.id)
  if (!base) continue
  const gained = techTerms(fullText(r)).length - techTerms(fullText(base)).length
  if (!flagged.has(r.id) && gained <= 0) continue
  lines.push(`### ${r.id}${flagged.has(r.id) ? ' (flagged)' : ''}: ${r.question.length > 140 ? `${r.question.slice(0, 140)}…` : r.question}`, '')
  lines.push(`**Baseline** (${words(base.answer)} words): ${bold(base.answer.trim())}`, '')
  lines.push(`**Candidate** (${words(r.answer)} words): ${bold(r.answer.trim())}`, '')
  for (const step of r.tour || []) lines.push(`- Tour stop ${step.target}: ${bold(step.narration || '')}`)
  if (r.tour?.length) lines.push('')
}
fs.writeFileSync(reviewPath, `${lines.join('\n')}\n`)
console.log(`Review sheet: ${reviewPath}`)
process.exit(failed.length ? 1 : 0)
