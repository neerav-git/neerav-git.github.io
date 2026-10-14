export type GuideTarget = { id: string; route: string; anchor: string | null; label: string }
export type GuideLink = { id: string; label: string; url: string }
export type Knowledge = {
  version: string
  knowledge: string
  targets: GuideTarget[]
  links: GuideLink[]
  targetById: Map<string, GuideTarget>
  linkById: Map<string, GuideLink>
}

const TTL_MS = 5 * 60 * 1000
let cached: { at: number; url: string; value: Knowledge } | null = null

/**
 * The knowledge file is published with the site, so a site deploy updates what the guide knows without
 * redeploying the API. It is cached per isolate; an unchanged version keeps the prompt cache warm.
 */
export async function loadKnowledge(url: string): Promise<Knowledge> {
  if (cached && cached.url === url && Date.now() - cached.at < TTL_MS) return cached.value
  const response = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit)
  if (!response.ok) {
    if (cached?.url === url) return cached.value
    throw new Error(`Knowledge fetch failed: ${response.status}`)
  }
  const raw = (await response.json()) as Partial<Knowledge>
  if (typeof raw.knowledge !== 'string' || !Array.isArray(raw.targets) || !Array.isArray(raw.links)) {
    throw new Error('Knowledge file has an unexpected shape')
  }
  const value: Knowledge = {
    version: String(raw.version || ''),
    knowledge: raw.knowledge,
    targets: raw.targets,
    links: raw.links,
    targetById: new Map(raw.targets.map((target) => [target.id, target])),
    linkById: new Map(raw.links.map((link) => [link.id, link])),
  }
  cached = { at: Date.now(), url, value }
  return value
}
