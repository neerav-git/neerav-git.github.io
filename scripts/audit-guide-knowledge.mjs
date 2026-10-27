import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const guideDir = path.join(root, 'content', 'guide')
const projectDir = path.join(guideDir, 'projects')
const generatedPath = path.join(root, 'public', 'guide', 'knowledge.json')
const requiredSections = [
  'Outcome', "Neerav's contribution", 'User journey', 'Architecture and tools', 'Methodology',
  'Results', 'Iterative improvement', 'Impact', 'Scope', 'Approved page targets and links',
]
const prohibited = [
  /not shown on the site/i, /claim ledger/i, /record status/i, /evidence basis/i,
  /dirty worktree/i, /untracked director/i, /merge commit/i, /HTTP 401/i,
  /paid scenarios/i, /Claude Code/i, /OpenAI Codex/i,
  /four years (?:in|at) one (?:full-time )?(?:job|employer)/i,
  // Editorial framing that describes how the record was curated rather than the work itself.
  /the portfolio emphasizes/i, /canonical (?:headline|baseline)/i, /story of the product/i,
  /without erasing/i, /silently merged/i, /source work record/i,
  // Abstract phrasing visitors found vague when spoken (round-1 review); describe the user benefit instead.
  /the application owns/i, /models? (?:only )?propose/i, /deterministic authority/i, /observable application state/i,
]
const homewardProhibited = [
  /team project/i, /four-person/i, /coordinated the team/i, /primary contributor/i,
  /predominantly/i, /core contributor/i, /sbasu107/i, /Shounak Basu/i,
]
const ownership = 'Neerav conceived and built Homeward end to end'

const errors = []
const notes = []
const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'))
const narrative = generated.knowledge
const targetIds = new Set(generated.targets.map((item) => item.id))
const linkIds = new Set(generated.links.map((item) => item.id))
const metricIds = new Set(JSON.parse(fs.readFileSync(path.join(guideDir, 'metrics.json'), 'utf8')).map((metric) => metric.id))
const frontmatterKeys = ['slug', 'approvedTargets', 'approvedLinks', 'metricIds']
const files = fs.readdirSync(projectDir).filter((name) => name.endsWith('.md')).sort()

if (files.length !== 7) errors.push(`Expected 7 curated project records; found ${files.length}.`)
for (const file of files) {
  const source = fs.readFileSync(path.join(projectDir, file), 'utf8')
  for (const section of requiredSections) {
    if (!source.includes(`## ${section}`)) errors.push(`${file}: missing required section "${section}".`)
  }
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] || ''
  for (const id of frontmatter.match(/project\.[a-z0-9.-]+/g) || []) {
    if (!targetIds.has(id)) errors.push(`${file}: approved target does not exist: ${id}`)
  }
  for (const id of frontmatter.match(/link\.[a-z0-9.-]+/g) || []) {
    if (!linkIds.has(id)) errors.push(`${file}: approved link does not exist: ${id}`)
  }
  for (const key of frontmatterKeys) {
    if (!new RegExp(`^${key}:`, 'm').test(frontmatter)) errors.push(`${file}: front matter is missing "${key}".`)
  }
  const metricBlock = frontmatter.match(/^metricIds:(?: \[\])?\n((?:\s+- .+\n?)*)/m)?.[1] || ''
  for (const id of metricBlock.match(/[a-z0-9-]+$/gm) || []) {
    if (!metricIds.has(id)) errors.push(`${file}: metric id is not in metrics.json: ${id}`)
  }
}

for (const pattern of prohibited) {
  if (pattern.test(narrative)) errors.push(`Prohibited internal/meta phrase in narrative: ${pattern}`)
}
for (const pattern of homewardProhibited) {
  if (pattern.test(narrative)) errors.push(`Prohibited Homeward contributor/team wording: ${pattern}`)
}
if (/\b(?:project|link)\.[a-z0-9.-]+\b/i.test(narrative)) errors.push('Target or link id leaked into narrative prose.')

const paragraphs = narrative.split(/\n\s*\n/).map((value) => value.replace(/^#+\s*/gm, '').replace(/\s+/g, ' ').trim()).filter((value) => value.length >= 120)
const seen = new Map()
for (const paragraph of paragraphs) seen.set(paragraph, (seen.get(paragraph) || 0) + 1)
for (const [paragraph, count] of seen) {
  if (count > 1) errors.push(`Duplicate paragraph appears ${count} times: ${paragraph.slice(0, 90)}...`)
}

const metrics = JSON.parse(fs.readFileSync(path.join(guideDir, 'metrics.json'), 'utf8'))
for (const metric of metrics) {
  const count = [...narrative.matchAll(new RegExp(metric.pattern, 'gi'))].length
  notes.push(`${metric.id}=${count}/${metric.maxNarrativeOccurrences}`)
  if (count > metric.maxNarrativeOccurrences) errors.push(`Metric ${metric.id} appears ${count} times; maximum is ${metric.maxNarrativeOccurrences}.`)
}

const canonicalHomewardSources = [
  path.join(projectDir, 'homeward.md'), path.join(root, 'docs', 'work-records', 'homeward.md'),
  path.join(root, 'docs', 'CONTENT_SOURCE_LEDGER.md'),
]
for (const sourcePath of canonicalHomewardSources) {
  const source = fs.readFileSync(sourcePath, 'utf8')
  if (!source.includes(ownership)) errors.push(`${path.relative(root, sourcePath)}: canonical Homeward ownership statement is missing.`)
  for (const pattern of homewardProhibited) {
    if (pattern.test(source)) errors.push(`${path.relative(root, sourcePath)}: conflicting Homeward contribution wording ${pattern}.`)
  }
}
const publicHomeward = fs.readFileSync(path.join(root, 'content', 'projects', 'homeward.json'), 'utf8')
if (!publicHomeward.includes('I conceived and built Homeward end to end')) errors.push('content/projects/homeward.json: direct Homeward ownership statement is missing.')
const editorialIndex = fs.readFileSync(path.join(root, 'docs', 'work-records', 'README.md'), 'utf8')
if (!editorialIndex.includes("Present Homeward directly as Neerav's end-to-end work")) errors.push('docs/work-records/README.md: direct Homeward ownership rule is missing.')
for (const [name, source] of [['content/projects/homeward.json', publicHomeward], ['docs/work-records/README.md', editorialIndex]]) {
  for (const pattern of homewardProhibited) if (pattern.test(source)) errors.push(`${name}: conflicting Homeward contribution wording ${pattern}.`)
}

const conservativeTokens = Math.ceil(narrative.length / 3)
if (narrative.length > 140000) errors.push(`Narrative has ${narrative.length} characters; limit is 140000.`)
if (conservativeTokens > 50000) errors.push(`Narrative has about ${conservativeTokens} conservative tokens; limit is 50000.`)

if (errors.length) {
  console.error(`[guide-audit] FAIL (${errors.length} findings)`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}
console.log(`[guide-audit] PASS: ${files.length} project records, ${narrative.length.toLocaleString()} chars, ~${conservativeTokens.toLocaleString()} conservative tokens`)
console.log(`[guide-audit] Metric occurrences: ${notes.join(', ')}`)
console.log('[guide-audit] No prohibited meta, contribution conflicts, duplicate paragraphs, or target/link id leakage.')
