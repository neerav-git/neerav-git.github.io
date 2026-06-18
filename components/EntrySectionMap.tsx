import { getBlockAnchor } from '@/components/ContentBlocks'
import type { ContentBlock } from '@/lib/types'

type EntrySectionMapProps = {
  blocks?: ContentBlock[] | null
  title?: string
}

export function EntrySectionMap({ blocks, title = 'Section map' }: EntrySectionMapProps) {
  const sections = (blocks || [])
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => typeof block.title === 'string' && block.title.trim())

  if (!sections.length) {
    return null
  }

  return (
    <section className="entry-rail-panel">
      <div className="panel-eyebrow">{title}</div>
      <nav className="section-map" aria-label={title}>
        {sections.map((block, index) => (
          <a href={`#${getBlockAnchor(block.block, block.index)}`} key={`${block.block.title}-${block.index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{block.block.title}</strong>
          </a>
        ))}
      </nav>
    </section>
  )
}
