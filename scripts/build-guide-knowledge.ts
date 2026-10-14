/**
 * Builds the portfolio guide's knowledge and target registry from the same content the site renders.
 *
 * - public/guide/knowledge.json: the grounded text the guide answers from, with every section labelled by its
 *   target id, plus the registry. The guide API fetches it from the deployed site, so a site deploy updates it.
 * - public/guide/targets.json: the registry alone, which the browser uses to map a target id to a route and anchor.
 *
 * Anchors come from the page code's own helpers (normalizeContentMedia, getBlockAnchor), so they cannot drift.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { extractText, getDocumentProxy } from 'unpdf'

import { getBlockAnchor } from '../lib/blockAnchors'
import { getUploadUrl } from '../lib/assets'
import {
  getArchiveItems,
  getArticles,
  getHomeContent,
  getProjects,
  getRecommendations,
  getSiteSettings,
} from '../lib/content'
import { normalizeContentMedia } from '../lib/mediaDeduplication'
import { getProjectStatus } from '../lib/projectStatus'
import type { ContentBlock, ContentItem, LinkItem, MetricItem } from '../lib/types'

type Target = { id: string; route: string; anchor: string | null; label: string }
type GuideLink = { id: string; label: string; url: string }

const root = process.cwd()
const outDir = path.join(root, 'public', 'guide')

/** Source work records (docs/work-records) that back each project page. */
const WORK_RECORDS: Record<string, string> = {
  'alzheimers-disease-research': 'alzheimers-mri-classification.md',
  'birb-hangout': 'birb-hangout.md',
  'brain-atrophy-computer-vision': 'brain-atrophy-paper.md',
  homeward: 'homeward.md',
  'refract-ai': 'refract.md',
  relay: 'relay.md',
}

const targets: Target[] = []
const links: GuideLink[] = []
const lines: string[] = []

function slug(value: string, words = 4) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, words)
    .join('-')
}

function addTarget(id: string, route: string, anchor: string | null, label: string) {
  if (targets.some((target) => target.id === id)) throw new Error(`Duplicate guide target ${id}`)
  targets.push({ id, route, anchor, label })
  return id
}

function addLinks(prefix: string, items: LinkItem[] | undefined | null) {
  const ids: string[] = []
  for (const item of items || []) {
    if (!item?.url || !item.label) continue
    const id = `link.${prefix}.${slug(item.label, 3)}`
    if (!links.some((link) => link.id === id)) links.push({ id, label: item.label, url: item.url })
    ids.push(id)
  }
  return ids
}

function text(value: unknown) {
  return typeof value === 'string' ? value.replace(/\s+\n/g, '\n').trim() : ''
}

function push(...parts: Array<string | false | null | undefined>) {
  for (const part of parts) if (part) lines.push(part)
}

function describeBlock(block: ContentBlock, linkPrefix: string) {
  const out: string[] = []
  if (text(block.eyebrow)) out.push(`(${text(block.eyebrow)})`)
  for (const field of ['description', 'context', 'markdown', 'quote', 'caption'] as const) {
    if (text(block[field])) out.push(text(block[field]))
  }
  if (text(block.attribution)) out.push(`— ${text(block.attribution)}`)
  for (const raw of block.items || []) {
    const item = raw as MetricItem & ContentItem
    const head = [item.label, item.title, item.value].map(text).filter(Boolean).join(': ')
    const body = [item.body, item.context].map(text).filter(Boolean).join(' ')
    if (head || body) out.push(`- ${[head, body].filter(Boolean).join(' — ')}`)
  }
  if (block.media && text(block.media.alt)) out.push(`[Image: ${text(block.media.alt)}]`)
  const blockLinks = addLinks(linkPrefix, block.links)
  if (blockLinks.length) out.push(`Links: ${blockLinks.join(', ')}`)
  return out.join('\n')
}

function sectionBlocks(prefix: string, route: string, linkPrefix: string, blocks: ContentBlock[]) {
  blocks.forEach((block, index) => {
    const anchor = getBlockAnchor(block, index)
    const title = text(block.title)
    const body = describeBlock(block, linkPrefix)
    if (!title && !body) return
    const id = title ? addTarget(`${prefix}.${index + 1}-${slug(title, 3)}`, route, anchor, title) : null
    push(`### ${title || 'Untitled section'}${id ? ` [target: ${id}]` : ''}`, body, '')
  })
}

/**
 * The project pages already carry each record's narrative, so only the parts they lack are kept: authorship,
 * results, scope limits, and the claim ledger. Source maps (repository file paths) are left out.
 */
const WORK_RECORD_SECTIONS = /role|attribution|claim ledger|bounded scope|scope and evidence|record status|results|lineage/i

function workRecordExcerpt(markdown: string) {
  return markdown
    .split(/^(?=## )/m)
    .filter((section) => WORK_RECORD_SECTIONS.test(section.split('\n', 1)[0]))
    .map((section) => section.replace(/^## /, '#### ').trim())
    .join('\n\n')
}

async function resumeText(url: string | null) {
  if (!url?.startsWith('/')) return ''
  try {
    const bytes = await fs.readFile(path.join(root, 'public', url))
    const pdf = await getDocumentProxy(new Uint8Array(bytes))
    const { text: raw } = await extractText(pdf, { mergePages: true })
    // Contact goes through email and LinkedIn; keep the phone number out of anything the guide could read aloud.
    return String(raw).replace(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\s*\|?\s*/g, '').trim()
  } catch (error) {
    console.warn(`[guide] Could not read resume PDF (${url}): ${(error as Error).message}`)
    return ''
  }
}

async function main() {
  const [settings, home, projects, articles, archive, records] = await Promise.all([
    getSiteSettings(), getHomeContent(), getProjects(), getArticles(), getArchiveItems(), getRecommendations(),
  ])

  // ---- site map ----
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

  // ---- profile ----
  const about = settings?.about || {}
  push(
    '# Neerav Chaudhary — profile [target: page.about]',
    text(settings?.siteTagline),
    text(about.lead),
    '## Biography [target: about.biography]', text(about.biographyMarkdown),
    '## Current focus [target: about.focus]', text(about.currentFocusMarkdown),
    '',
    '## Home page [target: page.home]',
    [text(home?.heroEyebrow), text(home?.heroTitle), text(home?.heroBody)].filter(Boolean).join('\n'),
    '',
  )

  const contactLinks = addLinks('contact', [
    ...(settings?.socialLinks || []),
    ...(settings?.contactEmail ? [{ label: 'Email', url: `mailto:${settings.contactEmail}` }] : []),
  ])
  push('## Contact', settings?.contactEmail ? `Email: ${settings.contactEmail}` : '', `Links: ${contactLinks.join(', ')}`, '')

  // ---- resume ----
  const resume = records.find((record) => /resume/i.test(`${record.recommenderRole} ${record.title}`)) || null
  const resumeUrl = resume ? getUploadUrl(resume.pdfLetter) : null
  if (resumeUrl) addLinks('resume', [{ label: 'Resume PDF', url: resumeUrl }])
  push('# Resume [target: resume.pdf]', text(resume?.excerpt), text(resume?.context), await resumeText(resumeUrl), '')

  const references = records.filter((record) => record !== resume)
  if (references.length) {
    push('## References [target: resume.references]')
    for (const reference of references) {
      push(`- ${reference.recommenderName}${reference.recommenderRole ? `, ${reference.recommenderRole}` : ''}: ${[reference.title, reference.excerpt, reference.context].map(text).filter(Boolean).join(' — ')}`)
    }
    push('')
  }

  // ---- projects ----
  push('# Projects')
  for (const project of projects) {
    const route = `/projects/${project.slug}/`
    const base = `project.${project.slug}`
    addTarget(base, route, 'overview', project.title)
    addTarget(`projects.card.${project.slug}`, '/projects/', `case-${project.slug}`, `Work index card: ${project.title}`)
    const status = getProjectStatus(project.status)
    const coverUrl = getUploadUrl(project.coverImage)
    const normalized = normalizeContentMedia(project.pageSections, coverUrl ? [coverUrl] : [])

    push(
      `## ${project.title} [target: ${base}] (page ${route})`,
      `${text(project.cardEyebrow)}${project.dateLabel ? ` · ${text(project.dateLabel)}` : ''} · Status: ${status.label}. ${status.definition}`,
      text(project.summary),
      text(project.landingDeck),
      ...(project.landingHighlights || []).map((highlight) => `- ${text(highlight)}`),
      project.problem && `Problem: ${text(project.problem)}`,
      project.approach && `Approach: ${text(project.approach)}`,
      project.output && `Output: ${text(project.output)}`,
      project.role && `Neerav's role: ${text(project.role)}`,
      project.technologies?.length ? `Technologies: ${project.technologies.map((technology) => technology.value).join(', ')}` : '',
      project.portfolioKeywords?.length ? `Keywords: ${project.portfolioKeywords.map((keyword) => `${keyword.label} (${keyword.kind})`).join(', ')}` : '',
    )
    if (project.methodology) {
      addTarget(`${base}.methodology`, route, 'methodology', `${project.title}: build, evidence, and scope`)
      push(
        `### Build, evidence, and scope [target: ${base}.methodology]`,
        project.methodology.evaluation && `Evaluation: ${text(project.methodology.evaluation)}`,
        project.methodology.boundary && `Boundary: ${text(project.methodology.boundary)}`,
        ...(project.methodology.standards || []).map((standard) => `- ${text(standard)}`),
      )
    }
    push('')
    sectionBlocks(base, route, project.slug, normalized.blocks)
    if (project.gallery?.length) addTarget(`${base}.gallery`, route, 'gallery', `${project.title}: gallery`)
    const projectLinks = addLinks(project.slug, project.links)
    if (projectLinks.length || project.attachments?.length) {
      addTarget(`${base}.links`, route, 'project-links', `${project.title}: project links`)
      push(`### Project links [target: ${base}.links]`, `Links: ${projectLinks.join(', ')}`, '')
    }
    const record = WORK_RECORDS[project.slug]
    if (record) {
      const markdown = await fs.readFile(path.join(root, 'docs', 'work-records', record), 'utf8')
      push(
        `### From the source work record for ${project.title} (not shown on the site; when citing it, show ${base} or ${base}.methodology)`,
        workRecordExcerpt(markdown),
        '',
      )
    }
  }

  // ---- writing ----
  push('# Writing')
  for (const article of articles) {
    const route = `/writing/${article.slug}/`
    const base = `writing.${article.slug}`
    addTarget(base, route, null, article.title)
    const coverUrl = getUploadUrl(article.coverImage)
    const normalized = normalizeContentMedia(article.pageSections, coverUrl ? [coverUrl] : [])
    push(`## ${article.title} [target: ${base}] (page ${route})`, text(article.excerpt), '')
    sectionBlocks(base, route, `writing-${article.slug}`, normalized.blocks)
    const articleLinks = addLinks(`writing-${article.slug}`, article.links)
    if (articleLinks.length) push(`Links: ${articleLinks.join(', ')}`, '')
  }

  // ---- archive ----
  push('# Archive (source records)')
  for (const item of archive) {
    const route = `/archive/${item.slug}/`
    const base = `archive.${item.slug}`
    addTarget(base, route, null, item.title)
    push(`## ${item.title} [target: ${base}] (page ${route})`, [text(item.itemType), text(item.dateLabel)].filter(Boolean).join(' · '), text(item.summary), '')
    sectionBlocks(base, route, `archive-${item.slug}`, item.pageSections || [])
    const itemLinks = addLinks(`archive-${item.slug}`, item.links)
    if (itemLinks.length) push(`Links: ${itemLinks.join(', ')}`, '')
  }

  // ---- registry appendix ----
  push(
    '# Target registry (the only ids show_on_page and start_tour accept)',
    ...targets.map((target) => `- ${target.id} — ${target.label} (${target.route}${target.anchor ? `#${target.anchor}` : ''})`),
    '',
    '# Link registry (the only ids offer_links accepts)',
    ...links.map((link) => `- ${link.id} — ${link.label}`),
  )

  const knowledge = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  const version = createHash('sha256').update(knowledge).digest('hex').slice(0, 12)

  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'knowledge.json'), `${JSON.stringify({ version, knowledge, targets, links })}\n`)
  await fs.writeFile(path.join(outDir, 'targets.json'), `${JSON.stringify({ version, targets, links })}\n`)
  const estimatedTokens = Math.round(knowledge.length / 3)
  if (estimatedTokens > 85_000) {
    // Claude Haiku 5.5 bills prompts over 100K tokens at five times the rate; keep well clear of that line.
    throw new Error(`[guide] Knowledge is ~${estimatedTokens.toLocaleString()} tokens; trim it below 85K before shipping.`)
  }
  console.log(`[guide] ${targets.length} targets, ${links.length} links, ${knowledge.length.toLocaleString()} chars (~${estimatedTokens.toLocaleString()} tokens, conservative), version ${version}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
