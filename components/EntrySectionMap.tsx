import { getBlockAnchor } from '@/components/ContentBlocks'
import type { ContentBlock } from '@/lib/types'

type EntrySectionMapProps = {
  blocks?: ContentBlock[] | null
  maxItems?: number
  title?: string
}

export function EntrySectionMap({ blocks, maxItems = 6, title = 'Page sections' }: EntrySectionMapProps) {
  const sections = (blocks || [])
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => typeof block.title === 'string' && block.title.trim())
  const visibleSections = maxItems > 0 ? sections.slice(0, maxItems) : sections

  if (!sections.length) {
    return null
  }

  return (
    <section className="entry-rail-panel">
      <div className="panel-eyebrow">{title}</div>
      <nav className="section-map" aria-label={title}>
        {visibleSections.map((block, index) => (
          <a href={`#${getBlockAnchor(block.block, block.index)}`} key={`${block.block.title}-${block.index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{block.block.title}</strong>
          </a>
        ))}
      </nav>
      {sections.length > visibleSections.length ? <p className="section-map-note">More sections continue below.</p> : null}
    </section>
  )
}
