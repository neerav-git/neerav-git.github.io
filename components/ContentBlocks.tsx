/* eslint-disable @next/next/no-img-element */
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import type { ContentBlock } from '@/lib/types'

import { ArtifactList } from '@/components/ArtifactList'
import { MarkdownArticle } from '@/components/MarkdownArticle'

type ContentBlocksProps = {
  blocks?: ContentBlock[] | null
}

export function ContentBlocks({ blocks }: ContentBlocksProps) {
  if (!blocks?.length) {
    return null
  }

  return (
    <div className="content-blocks">
      {blocks.map((block, index) => {
        const key = `${String(block.blockType || 'block')}-${index}`

        switch (block.blockType) {
          case 'markdownSection':
            return (
              <section className="content-section" key={key}>
                {typeof block.eyebrow === 'string' && block.eyebrow ? (
                  <div className="panel-eyebrow">{block.eyebrow}</div>
                ) : null}
                <h2>{typeof block.title === 'string' ? block.title : 'Section'}</h2>
                <MarkdownArticle markdown={typeof block.markdown === 'string' ? block.markdown : ''} />
              </section>
            )

          case 'mediaFeature': {
            const mediaUrl = getUploadUrl(block.media)
            const mediaAlt = getUploadAlt(block.media)

            return (
              <section className={['content-section', 'media-feature', block.layout === 'split' ? 'split' : 'wide'].join(' ')} key={key}>
                <div className="media-copy">
                  {typeof block.eyebrow === 'string' && block.eyebrow ? (
                    <div className="panel-eyebrow">{block.eyebrow}</div>
                  ) : null}
                  <h2>{typeof block.title === 'string' ? block.title : 'Media feature'}</h2>
                  {typeof block.description === 'string' ? <p className="section-summary">{block.description}</p> : null}
                  {typeof block.caption === 'string' && block.caption ? <p className="media-caption">{block.caption}</p> : null}
                </div>
                {mediaUrl ? (
                  <div className="media-frame">
                    <img alt={mediaAlt} src={mediaUrl} />
                  </div>
                ) : null}
              </section>
            )
          }

          case 'quote':
            return (
              <blockquote className="quote-block" key={key}>
                <p>{typeof block.quote === 'string' ? block.quote : ''}</p>
                {(typeof block.attribution === 'string' && block.attribution) ||
                (typeof block.context === 'string' && block.context) ? (
                  <footer>
                    {[block.attribution, block.context].filter(Boolean).join(' · ')}
                  </footer>
                ) : null}
              </blockquote>
            )

          case 'metrics':
            return (
              <section className="content-section" key={key}>
                {typeof block.eyebrow === 'string' && block.eyebrow ? (
                  <div className="panel-eyebrow">{block.eyebrow}</div>
                ) : null}
                <h2>{typeof block.title === 'string' ? block.title : 'Metrics'}</h2>
                <div className="metric-grid">
                  {Array.isArray(block.items)
                    ? block.items.map((item, itemIndex) => (
                        <article className="metric-card" key={`${key}-${itemIndex}`}>
                          <strong>{typeof item.value === 'string' ? item.value : ''}</strong>
                          <span>{typeof item.label === 'string' ? item.label : ''}</span>
                          {typeof item.context === 'string' && item.context ? <small>{item.context}</small> : null}
                        </article>
                      ))
                    : null}
                </div>
              </section>
            )

          case 'links':
            return <ArtifactList key={key} links={Array.isArray(block.links) ? block.links : []} title={String(block.title || 'Links')} />

          case 'attachments':
            return (
              <ArtifactList
                attachments={Array.isArray(block.attachments) ? block.attachments : []}
                key={key}
                title={String(block.title || 'Attachments')}
              />
            )

          default:
            return null
        }
      })}
    </div>
  )
}
