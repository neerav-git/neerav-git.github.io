/**
 * Build the guide's conversational knowledge and action registry as separate layers.
 * Narrative comes only from reviewed content/guide sources. Targets and links are derived
 * from the site content but never appended to the prose the guide can read aloud.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { getBlockAnchor } from '../lib/blockAnchors'
import { getUploadUrl } from '../lib/assets'
import { getArchiveItems, getArticles, getProjects, getRecommendations, getSiteSettings } from '../lib/content'
import { normalizeContentMedia } from '../lib/mediaDeduplication'
import type { ContentBlock, LinkItem } from '../lib/types'

type Target = { id: string; route: string; anchor: string | null; label: string }
type GuideLink = { id: string; label: string; url: string }
type MetricRule = { id: string; pattern: string; maxNarrativeOccurrences: number }
/** Per-source key terms (content/guide/key-terms.json): lead terms are named whenever the work is described. */
type KeyTerms = Record<string, { section: string; lead: Array<{ term: string; match?: string }>; supporting: string[] }>

const root = process.cwd()
const outDir = path.join(root, 'public', 'guide')
const guideDir = path.join(root, 'content', 'guide')
const targets: Target[] = []
const links: GuideLink[] = []

function slug(value: string, words = 4) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, words).join('-')
}

function text(value: unknown) {
  return typeof value === 'string' ? value.replace(/\s+\n/g, '\n').trim() : ''
}

function addTarget(id: string, route: string, anchor: string | null, label: string) {
  if (targets.some((target) => target.id === id)) throw new Error(`Duplicate guide target ${id}`)
  targets.push({ id, route, anchor, label })
}

function addLinks(prefix: string, items: LinkItem[] | undefined | null) {
  for (const item of items || []) {
    if (!item?.url || !item.label) continue
    const id = `link.${prefix}.${slug(item.label, 3)}`
    if (!links.some((link) => link.id === id)) links.push({ id, label: item.label, url: item.url })
  }
}

function registerBlocks(prefix: string, route: string, linkPrefix: string, blocks: ContentBlock[]) {
  blocks.forEach((block, index) => {
    const title = text(block.title)
    if (title) addTarget(`${prefix}.${index + 1}-${slug(title, 3)}`, route, getBlockAnchor(block, index), title)
    addLinks(linkPrefix, block.links)
  })
}

function narrativeOnly(markdown: string) {
  return markdown
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/<!--[\s\S]*?-->\n?/g, '')
    .replace(/\n## Approved page targets and links\n[\s\S]*$/m, '')
    .trim()
}

function occurrences(value: string, pattern: string) {
  return [...value.matchAll(new RegExp(pattern, 'gi'))].length
}

async function readGuideSource(relativePath: string, keyTerms: KeyTerms) {
  return withKeyTerms(relativePath, narrativeOnly(await fs.readFile(path.join(guideDir, relativePath), 'utf8')), keyTerms)
}

/**
 * Puts the source's key terms under its title, so the guide names the field and technology alongside the plain
 * explanation. Every lead term must already appear in the named plain-language section, which shows the model the
 * term used plainly in context; a missing one fails the build.
 */
function withKeyTerms(relativePath: string, markdown: string, keyTerms: KeyTerms) {
  const entry = keyTerms[relativePath.split(path.sep).join('/')]
  if (!entry) {
    if (relativePath.startsWith('projects')) throw new Error(`[guide] ${relativePath} has no entry in key-terms.json`)
    return markdown
  }
  const section = markdown.match(new RegExp(`^## ${entry.section}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1]
  if (!section) throw new Error(`[guide] ${relativePath}: key-terms section "${entry.section}" not found`)
  const missing = entry.lead.filter(({ term, match }) => !new RegExp(match ?? term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(section))
  if (missing.length) throw new Error(`[guide] ${relativePath}: lead key terms missing from "${entry.section}": ${missing.map(({ term }) => term).join(', ')}`)
  const lines = [
    entry.lead.length ? `Key terms (lead): ${entry.lead.map(({ term }) => term).join(', ')}.` : '',
    entry.supporting.length ? `Key terms (supporting): ${entry.supporting.join(', ')}.` : '',
  ].filter(Boolean)
  return markdown.replace(/^(# .*)$/m, `$1\n\n${lines.join('\n')}`)
}

async function main() {
  const [settings, projects, articles, archive, records] = await Promise.all([
    getSiteSettings(), getProjects(), getArticles(), getArchiveItems(), getRecommendations(),
  ])

  // Action metadata is derived from the rendered site's source of truth.
  addTarget('page.home', '/', 'glance', 'Home')
  addTarget('home.products', '/', 'products-and-systems', 'Home: products and studies')
  addTarget('home.writing', '/', 'home-writing', 'Home: technical notes')
  addTarget('home.archive', '/', 'home-archive', 'Home: source records')
  addTarget('page.projects', '/projects/', null, 'Work index')
  addTarget('projects.products', '/projects/', 'product-case-studies', 'Work index: product case studies')
  addTarget('projects.studies', '/projects/', 'research-case-studies', 'Work index: research studies')
  addTarget('page.writing', '/writing/', null, 'Writing index')
  addTarget('page.archive', '/archive/', null, 'Archive index')
  addTarget('page.about', '/about/', null, 'About')
  addTarget('about.biography', '/about/', 'biography', 'About: biography')
  addTarget('about.focus', '/about/', 'current-focus', 'About: current focus')
  addTarget('page.resume', '/resume/', null, 'Resume')
  addTarget('resume.pdf', '/resume/', 'resume-pdf', 'Resume: PDF and summary')
  addTarget('resume.references', '/resume/', 'references', 'Resume: references')

  addLinks('contact', [
    ...(settings?.socialLinks || []),
    ...(settings?.contactEmail ? [{ label: 'Email', url: `mailto:${settings.contactEmail}` }] : []),
  ])
  const resume = records.find((record) => /resume/i.test(`${record.recommenderRole} ${record.title}`)) || null
  const resumeUrl = resume ? getUploadUrl(resume.pdfLetter) : null
  if (resumeUrl) addLinks('resume', [{ label: 'Resume PDF', url: resumeUrl }])

  for (const project of projects) {
    const route = `/projects/${project.slug}/`
    const base = `project.${project.slug}`
    // Naming the subject keeps "show me the paper" on the case study rather than its archive record.
    const kind = [project.cardEyebrow || project.primaryCategory || 'project', project.status === 'peer-reviewed-publication' ? 'peer-reviewed IEEE paper' : ''].filter(Boolean).join(', ')
    addTarget(base, route, 'overview', `${project.title}: case study (${kind})`)
    addTarget(`projects.card.${project.slug}`, '/projects/', `case-${project.slug}`, `Work index card: ${project.title}`)
    if (project.methodology) addTarget(`${base}.methodology`, route, 'methodology', `${project.title}: build, evidence, and scope`)
    const coverUrl = getUploadUrl(project.coverImage)
    const normalized = normalizeContentMedia(project.pageSections, coverUrl ? [coverUrl] : [])
    registerBlocks(base, route, project.slug, normalized.blocks)
    if (project.gallery?.length) addTarget(`${base}.gallery`, route, 'gallery', `${project.title}: gallery`)
    addLinks(project.slug, project.links)
    if (project.links?.length || project.attachments?.length) addTarget(`${base}.links`, route, 'project-links', `${project.title}: project links`)
  }

  for (const article of articles) {
    const route = `/writing/${article.slug}/`
    const base = `writing.${article.slug}`
    addTarget(base, route, null, article.title)
    const coverUrl = getUploadUrl(article.coverImage)
    const normalized = normalizeContentMedia(article.pageSections, coverUrl ? [coverUrl] : [])
    registerBlocks(base, route, `writing-${article.slug}`, normalized.blocks)
    addLinks(`writing-${article.slug}`, article.links)
  }

  for (const item of archive) {
    const route = `/archive/${item.slug}/`
    const base = `archive.${item.slug}`
    // Archive items are source records; the label keeps a named paper or project resolving to its case study first.
    addTarget(base, route, null, `Archive source record (supporting files for a case study): ${item.title}`)
    registerBlocks(base, route, `archive-${item.slug}`, item.pageSections || [])
    addLinks(`archive-${item.slug}`, item.links)
  }

  // Curated narrative is intentionally small and explicit. A missing project record is fatal.
  const keyTerms = JSON.parse(await fs.readFile(path.join(guideDir, 'key-terms.json'), 'utf8')) as KeyTerms
  const sources: Array<{ name: string; value: string }> = [
    { name: 'profile.md', value: await readGuideSource('profile.md', keyTerms) },
    { name: 'resume.md', value: await readGuideSource('resume.md', keyTerms) },
    { name: 'deep-strat.md', value: await readGuideSource('deep-strat.md', keyTerms) },
  ]
  for (const project of projects) {
    const relativePath = path.join('projects', `${project.slug}.md`)
    try {
      sources.push({ name: relativePath, value: await readGuideSource(relativePath, keyTerms) })
    } catch (error) {
      throw new Error(`[guide] Missing curated guide record for ${project.slug}: ${(error as Error).message}`)
    }
  }

  const knowledge = sources.map((source) => source.value).join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
  const metrics = JSON.parse(await fs.readFile(path.join(guideDir, 'metrics.json'), 'utf8')) as MetricRule[]
  const prohibited = [
    'not shown on the site', 'claim ledger', 'record status', 'evidence basis', 'dirty worktree',
    'untracked', 'merge commit', 'HTTP 401', 'paid scenarios', 'Claude Code', 'OpenAI Codex',
  ]
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const prohibitedHits = prohibited.map((phrase) => ({ phrase, count: occurrences(knowledge, escape(phrase)) })).filter((item) => item.count)
  const metricCounts = metrics.map((metric) => ({ id: metric.id, count: occurrences(knowledge, metric.pattern), max: metric.maxNarrativeOccurrences }))
  const estimatedTokens = Math.ceil(knowledge.length / 3)
  if (knowledge.length > 140_000 || estimatedTokens > 50_000) {
    throw new Error(`[guide] Narrative is ${knowledge.length.toLocaleString()} chars (~${estimatedTokens.toLocaleString()} tokens); limit is 140,000 chars and 50,000 conservative tokens.`)
  }
  if (prohibitedHits.length) throw new Error(`[guide] Prohibited narrative phrases: ${prohibitedHits.map((item) => `${item.phrase} (${item.count})`).join(', ')}`)

  const version = createHash('sha256').update(knowledge).digest('hex').slice(0, 12)
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'knowledge.json'), `${JSON.stringify({ version, knowledge, targets, links })}\n`)
  await fs.writeFile(path.join(outDir, 'targets.json'), `${JSON.stringify({ version, targets, links })}\n`)

  console.log(`[guide] ${targets.length} targets, ${links.length} links, ${knowledge.length.toLocaleString()} narrative chars (~${estimatedTokens.toLocaleString()} tokens, conservative), version ${version}`)
  for (const source of sources) console.log(`[guide] source ${source.name}: ${source.value.length.toLocaleString()} chars (~${Math.ceil(source.value.length / 3).toLocaleString()} tokens)`)
  console.log(`[guide] prohibited phrases: ${prohibitedHits.length ? prohibitedHits.map((item) => `${item.phrase}=${item.count}`).join(', ') : 'none'}`)
  console.log(`[guide] metric occurrences: ${metricCounts.map((item) => `${item.id}=${item.count}/${item.max}`).join(', ')}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
