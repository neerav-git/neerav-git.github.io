import fs from 'node:fs/promises'
import path from 'node:path'

import type {
  ArchiveRecord,
  ArticleRecord,
  GithubCacheEntry,
  HomeContent,
  ProjectRecord,
  RecommendationRecord,
  SiteSettings,
} from '@/lib/types'

const contentRoot = path.join(process.cwd(), 'content')

async function readJsonFile<T>(...segments: string[]) {
  const filePath = path.join(contentRoot, ...segments)
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

async function readCollection<T>(directory: string) {
  const folder = path.join(contentRoot, directory)
  let files: string[] = []

  try {
    files = (await fs.readdir(folder)).filter((file) => file.endsWith('.json')).sort()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }

  const items = await Promise.all(files.map((file) => readJsonFile<T>(directory, file)))
  return items
}

function sortByDateDescending<T extends { publishDate?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.publishDate ? Date.parse(left.publishDate) : 0
    const rightTime = right.publishDate ? Date.parse(right.publishDate) : 0
    return rightTime - leftTime
  })
}

function sortByOrder<T extends { displayOrder?: number }>(items: T[]) {
  return [...items].sort((left, right) => (left.displayOrder ?? 999) - (right.displayOrder ?? 999))
}

function sortByPriority<T extends { visibilityPriority?: number }>(items: T[]) {
  return [...items].sort((left, right) => (left.visibilityPriority ?? 100) - (right.visibilityPriority ?? 100))
}

function listToMap<T extends { slug: string }>(items: T[]) {
  return new Map(items.map((item) => [item.slug, item]))
}

async function getGithubCache() {
  try {
    return await readJsonFile<Record<string, GithubCacheEntry>>('generated', 'github-cache.json')
  } catch {
    return {}
  }
}

function mergeProjectGithub(project: ProjectRecord, githubCache: Record<string, GithubCacheEntry>) {
  const cached = githubCache[project.slug]

  if (!cached) {
    return project
  }

  const github = {
    ...(project.github || {}),
    ...cached,
  }

  const links = Array.isArray(project.links) ? [...project.links] : []

  if (github.repoUrl && !links.some((link) => link.url === github.repoUrl)) {
    links.unshift({
      label: 'Repository',
      url: github.repoUrl,
    })
  }

  return {
    ...project,
    github,
    links,
    summary: project.summary || github.sourceDescription || '',
  }
}

function pickBySlugOrder<T extends { slug: string }>(items: T[], slugs: string[] | undefined, fallback: T[]) {
  if (!Array.isArray(slugs) || !slugs.length) {
    return fallback
  }

  const map = listToMap(items)
  return slugs.map((slug) => map.get(slug)).filter(Boolean) as T[]
}

export async function getSiteSettings() {
  return readJsonFile<SiteSettings>('settings', 'site.json')
}

export async function getHomeContent() {
  return readJsonFile<HomeContent>('settings', 'home.json')
}

export async function getProjects() {
  const [projects, githubCache] = await Promise.all([
    readCollection<ProjectRecord>('projects'),
    getGithubCache(),
  ])

  return sortByOrder(projects.map((project) => mergeProjectGithub(project, githubCache)))
}

export async function getProjectBySlug(slug: string) {
  const projects = await getProjects()
  return projects.find((project) => project.slug === slug) || null
}

export async function getArticles() {
  const articles = await readCollection<ArticleRecord>('writing')
  return sortByDateDescending(articles)
}

export async function getArticleBySlug(slug: string) {
  const articles = await getArticles()
  return articles.find((article) => article.slug === slug) || null
}

export async function getArchiveItems() {
  const items = await readCollection<ArchiveRecord>('archive')
  return items
}

export async function getArchiveItemBySlug(slug: string) {
  const items = await getArchiveItems()
  return items.find((item) => item.slug === slug) || null
}

export async function getRecommendations() {
  const items = await readCollection<RecommendationRecord>('recommendations')
  return sortByPriority(items)
}

export async function getHomePageData() {
  const [settings, home, projects, articles, archiveItems] = await Promise.all([
    getSiteSettings(),
    getHomeContent(),
    getProjects(),
    getArticles(),
    getArchiveItems(),
  ])

  return {
    archiveItems,
    articles,
    featuredArchiveItems: pickBySlugOrder(archiveItems, home.featuredArchiveSlugs, archiveItems.slice(0, 3)),
    featuredArticles: pickBySlugOrder(articles, home.featuredArticleSlugs, articles.slice(0, 3)),
    featuredProjects: pickBySlugOrder(
      projects,
      home.featuredProjectSlugs,
      projects.filter((project) => project.featured).slice(0, 3),
    ),
    home,
    projects,
    settings,
  }
}
