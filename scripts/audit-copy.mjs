import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const contentRoot = path.join(root, 'content')
const ignoredKeys = new Set(['url', 'slug', 'media', 'coverImage', 'thumbnailImage', 'previewImage', 'github'])

const rules = [
  ['meta-purpose', /\b(?:this|the) (?:entry|record|artifact|page|section|diagram|note) (?:exists|is useful|matters|belongs)\b/i],
  ['meta-purpose', /\bthe (?:point|purpose) is\b/i],
  ['contrast-scaffold', /\bnot\b[^.!?\n]{0,120}\b(?:but|because|rather)\b/i],
  ['contrast-scaffold', /\brather than\b/i],
  ['defensive-positioning', /\b(?:not a (?:clinical|production)|does not (?:claim|establish|provide)|should not be presented|not presented)\b/i],
  ['vague-abstraction', /\b(?:supporting context|operating model|implementation detail takes over|explain how to read|generic machine-learning language|texture of the work)\b/i],
  ['meta-preservation', /\bpreserv(?:e|es|ed|ing|ation)\b/i],
  ['reviewer-filler', /\beasier to (?:judge|review|inspect|understand)\b/i],
  ['reviewer-filler', /\b(?:the image already appears|restage it at full size|decorative questions)\b/i],
]

const uiFiles = [
  'app/(frontend)/archive/[slug]/page.tsx',
  'app/(frontend)/layout.tsx',
  'app/(frontend)/page.tsx',
  'app/(frontend)/projects/[slug]/page.tsx',
  'app/(frontend)/projects/page.tsx',
  'app/(frontend)/recommendations/page.tsx',
  'app/(frontend)/resume/page.tsx',
  'app/(frontend)/writing/[slug]/page.tsx',
  'app/(frontend)/writing/page.tsx',
  'components/PortfolioDeskTabs.tsx',
  'components/ProjectDossier.tsx',
  'components/ProjectMethodology.tsx',
  'components/ProjectRail.tsx',
  'components/SiteChrome.tsx',
  'lib/projectStatus.ts',
]

async function listJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === 'generated') continue
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listJsonFiles(fullPath))
    if (entry.isFile() && entry.name.endsWith('.json')) files.push(fullPath)
  }

  return files
}

function collectStrings(value, jsonPath = '$', output = []) {
  if (typeof value === 'string') {
    output.push({ path: jsonPath, value })
    return output
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${jsonPath}[${index}]`, output))
    return output
  }

  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (ignoredKeys.has(key)) continue
      collectStrings(item, `${jsonPath}.${key}`, output)
    }
  }

  return output
}

function checkText(file, location, value, failures) {
  for (const [rule, pattern] of rules) {
    if (pattern.test(value)) {
      failures.push({ file, location, rule, value: value.replace(/\s+/g, ' ').trim() })
    }
  }
}

function quotedStrings(line) {
  const values = []
  const pattern = /(['"`])((?:\\.|(?!\1).)*)\1/g
  for (const match of line.matchAll(pattern)) values.push(match[2])
  return values
}

function isImplementationToken(value) {
  return /^[a-z0-9_-]+(?:\s+[a-z0-9_-]+)*$/i.test(value) && /[-_]/.test(value)
}

const failures = []
for (const filePath of await listJsonFiles(contentRoot)) {
  const relative = path.relative(root, filePath)
  const parsed = JSON.parse(await readFile(filePath, 'utf8'))
  for (const entry of collectStrings(parsed)) checkText(relative, entry.path, entry.value, failures)
}

for (const relative of uiFiles) {
  const source = await readFile(path.join(root, relative), 'utf8')
  source.split('\n').forEach((line, index) => {
    for (const value of quotedStrings(line)) {
      if (isImplementationToken(value)) continue
      checkText(relative, `line ${index + 1}`, value, failures)
    }
  })
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`${failure.file}:${failure.location} [${failure.rule}] ${failure.value}`)
  }
  console.error(`\nCopy audit failed with ${failures.length} finding${failures.length === 1 ? '' : 's'}.`)
  process.exit(1)
}

console.log('Copy audit passed: no flagged meta-copy, contrast scaffolding, vague abstractions, or defensive positioning.')
