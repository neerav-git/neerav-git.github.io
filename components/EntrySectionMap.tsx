import { getBlockAnchor } from '@/components/ContentBlocks'
import type { ContentBlock } from '@/lib/types'

type EntrySectionMapProps = {
  blocks?: ContentBlock[] | null
  maxItems?: number
  title?: string
}

export function EntrySectionMap({ blocks, maxItems = 0, title = 'On this page' }: EntrySectionMapProps) {
  const sections = (blocks || [])
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => typeof block.title === 'string' && block.title.trim())
  const visibleSections = maxItems > 0 ? sections.slice(0, maxItems) : sections

  if (!sections.length) {
    return null
  }

  return (
    <details className="entry-section-map">
      <summary>{title}</summary>
      <nav className="section-map" aria-label={title}>
          {visibleSections.map((block) => (
            <a href={`#${getBlockAnchor(block.block, block.index)}`} key={`${block.block.title}-${block.index}`}>
              <strong>{block.block.title}</strong>
            </a>
          ))}
      </nav>
    </details>
  )
}
