export type Asset = {
  alt?: string
  caption?: string
  credit?: string
  filename?: string
  label?: string
  url?: string
}

export type LinkItem = {
  description?: string
  label: string
  url: string
}

export type AttachmentItem = {
  description?: string
  externalUrl?: string
  file?: Asset | null
  label: string
}

export type MetricItem = {
  context?: string
  label: string
  value: string
}

export type ContentItem = {
  body?: string
  context?: string
  label?: string
  title?: string
  value?: string
}

export type ContentBlock = {
  attachments?: AttachmentItem[]
  attribution?: string
  blockType:
    | 'markdownSection'
    | 'proseSection'
    | 'sectionLead'
    | 'mediaFeature'
    | 'figure'
    | 'quote'
    | 'callout'
    | 'metrics'
    | 'insightGrid'
    | 'timeline'
    | 'links'
    | 'attachments'
  caption?: string
  context?: string
  description?: string
  eyebrow?: string
  items?: Array<MetricItem | ContentItem>
  layout?: 'narrow' | 'wide' | 'split'
  links?: LinkItem[]
  markdown?: string
  media?: Asset | null
  quote?: string
  title?: string
}

export type PageIntro = {
  intro?: string
  label?: string
  title?: string
}

export type SiteSettings = {
  about?: {
    biographyMarkdown?: string
    currentFocusMarkdown?: string
    lead?: string
    portrait?: Asset | null
  }
  contactEmail?: string
  footerLine?: string
  navigation?: {
    aboutLabel?: string
    archiveLabel?: string
    homeLabel?: string
    projectsLabel?: string
    recommendationsLabel?: string
    resumeLabel?: string
    writingLabel?: string
  }
  pageIntros?: {
    about?: PageIntro
    archive?: PageIntro
    projects?: PageIntro
    recommendations?: PageIntro
    resume?: PageIntro
    writing?: PageIntro
  }
  siteTagline?: string
  siteTitle?: string
  socialLinks?: LinkItem[]
}

export type HomeContent = {
  featuredArchiveHeading?: string
  featuredArchiveSlugs?: string[]
  featuredArticleSlugs?: string[]
  featuredProjectsHeading?: string
  featuredProjectSlugs?: string[]
  featuredWritingHeading?: string
  heroBody?: string
  heroEyebrow?: string
  heroImage?: Asset | null
  heroLinks?: LinkItem[]
  heroTitle?: string
  modules?: ContentBlock[]
  recommendationsNote?: string
}

export type ProjectRecord = {
  attachments?: AttachmentItem[]
  cardEyebrow?: string
  coverImage?: Asset | null
  dateLabel?: string
  displayOrder?: number
  featured?: boolean
  gallery?: Asset[]
  github?: {
    branch?: string
    importedReadmeMarkdown?: string
    lastSyncedAt?: string
    owner?: string
    repo?: string
    repoHomepage?: string
    repoLanguage?: string
    repoName?: string
    repoTopics?: Array<{ value: string }>
    repoUrl?: string
    sourceDescription?: string
    sourceReadmePath?: string
    syncEnabled?: boolean
    updatedAt?: string
  }
  links?: LinkItem[]
  pageSections?: ContentBlock[]
  problem?: string
  approach?: string
  output?: string
  relatedArchiveSlugs?: string[]
  relatedArticleSlugs?: string[]
  role?: string
  slug: string
  status?: string
  summary: string
  technologies?: Array<{ value: string }>
  title: string
}

export type ArticleRecord = {
  attachments?: AttachmentItem[]
  category?: string
  coverImage?: Asset | null
  excerpt: string
  featured?: boolean
  links?: LinkItem[]
  pageSections?: ContentBlock[]
  publishDate?: string
  relatedArchiveSlugs?: string[]
  relatedProjectSlugs?: string[]
  slug: string
  title: string
}

export type ArchiveRecord = {
  attachments?: AttachmentItem[]
  dateLabel?: string
  featured?: boolean
  itemType?: string
  links?: LinkItem[]
  pageSections?: ContentBlock[]
  previewImage?: Asset | null
  relatedArticleSlugs?: string[]
  relatedProjectSlugs?: string[]
  slug: string
  summary: string
  title: string
}

export type RecommendationRecord = {
  context?: string
  excerpt?: string
  links?: LinkItem[]
  pdfLetter?: Asset | null
  recommenderName: string
  recommenderRole?: string
  slug: string
  thumbnail?: Asset | null
  title: string
  visibilityPriority?: number
}

export type GithubCacheEntry = {
  importedReadmeMarkdown?: string
  lastSyncedAt?: string
  repoHomepage?: string
  repoLanguage?: string
  repoName?: string
  repoTopics?: Array<{ value: string }>
  repoUrl?: string
  sourceDescription?: string
  updatedAt?: string
}
