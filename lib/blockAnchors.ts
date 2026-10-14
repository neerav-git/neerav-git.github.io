import type { ContentBlock } from '@/lib/types'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getBlockAnchor(block: ContentBlock, index: number) {
  const title = typeof block.title === 'string' ? block.title.trim() : ''
  if (!title) {
    return `section-${index + 1}`
  }

  return `${slugify(title) || `section-${index + 1}`}-${index + 1}`
}
