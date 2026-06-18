/* eslint-disable @next/next/no-img-element */
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import type { ContentBlock, ContentItem, MetricItem } from '@/lib/types'

import { ArtifactList } from '@/components/ArtifactList'
import { MarkdownArticle } from '@/components/MarkdownArticle'

type ContentBlocksProps = {
  blocks?: ContentBlock[] | null
}

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

function asContentItem(item: MetricItem | ContentItem) {
  return item as ContentItem
}

function renderBlockIntro(block: ContentBlock) {
  return (
    <>
      {typeof block.eyebrow === 'string' && block.eyebrow ? <div className="panel-eyebrow">{block.eyebrow}</div> : null}
      {typeof block.title === 'string' && block.title ? <h2>{block.title}</h2> : null}
      {typeof block.description === 'string' && block.description ? <p className="section-summary">{block.description}</p> : null}
    </>
  )
}

export function ContentBlocks({ blocks }: ContentBlocksProps) {
  if (!blocks?.length) {
    return null
  }

  return (
    <div className="content-blocks">
      {blocks.map((block, index) => {
        const key = `${String(block.blockType || 'block')}-${index}`
        const anchor = getBlockAnchor(block, index)

        switch (block.blockType) {
          case 'sectionLead':
            return (
              <section className="content-section section-lead" id={anchor} key={key}>
                {renderBlockIntro(block)}
                {typeof block.context === 'string' && block.context ? <p className="section-context">{block.context}</p> : null}
              </section>
            )

          case 'proseSection':
          case 'markdownSection':
            return (
              <section className={['content-section', 'prose-section', block.layout === 'narrow' ? 'is-narrow' : ''].join(' ').trim()} id={anchor} key={key}>
                {renderBlockIntro(block)}
                <MarkdownArticle markdown={typeof block.markdown === 'string' ? block.markdown : ''} />
                {typeof block.context === 'string' && block.context ? <p className="section-context">{block.context}</p> : null}
              </section>
            )

          case 'figure':
          case 'mediaFeature': {
            const mediaUrl = getUploadUrl(block.media)
            const mediaAlt = getUploadAlt(block.media)

            return (
              <section className={['content-section', 'figure-block', block.layout === 'split' ? 'split' : 'wide'].join(' ')} id={anchor} key={key}>
                <div className="figure-copy">
                  {renderBlockIntro(block)}
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

          case 'callout':
            return (
              <section className="content-section callout-block" id={anchor} key={key}>
                {renderBlockIntro(block)}
                <MarkdownArticle markdown={typeof block.markdown === 'string' ? block.markdown : ''} />
                {typeof block.context === 'string' && block.context ? <p className="section-context">{block.context}</p> : null}
              </section>
            )

          case 'quote':
            return (
              <blockquote className="quote-block" id={anchor} key={key}>
                <p>{typeof block.quote === 'string' ? block.quote : ''}</p>
                {(typeof block.attribution === 'string' && block.attribution) ||
                (typeof block.context === 'string' && block.context) ? (
                  <footer>{[block.attribution, block.context].filter(Boolean).join(' · ')}</footer>
                ) : null}
              </blockquote>
            )

          case 'insightGrid':
            return (
              <section className="content-section insight-grid-block" id={anchor} key={key}>
                {renderBlockIntro(block)}
                <div className="insight-grid">
                  {Array.isArray(block.items)
                    ? block.items.map((item, itemIndex) => {
                        const entry = asContentItem(item)
                        return (
                          <article className="insight-card" key={`${key}-${itemIndex}`}>
                            {entry.label ? <div className="panel-eyebrow">{entry.label}</div> : null}
                            {entry.title ? <h3>{entry.title}</h3> : null}
                            {entry.body ? <p>{entry.body}</p> : null}
                            {entry.context ? <small>{entry.context}</small> : null}
                          </article>
                        )
                      })
                    : null}
                </div>
              </section>
            )

          case 'timeline':
            return (
              <section className="content-section timeline-block" id={anchor} key={key}>
                {renderBlockIntro(block)}
                <div className="timeline-list">
                  {Array.isArray(block.items)
                    ? block.items.map((item, itemIndex) => {
                        const entry = asContentItem(item)
                        return (
                          <article className="timeline-item" key={`${key}-${itemIndex}`}>
                            <div className="timeline-marker">{entry.label || String(itemIndex + 1).padStart(2, '0')}</div>
                            <div className="timeline-copy">
                              {entry.title ? <h3>{entry.title}</h3> : null}
                              {entry.body ? <p>{entry.body}</p> : null}
                              {entry.context ? <small>{entry.context}</small> : null}
                            </div>
                          </article>
                        )
                      })
                    : null}
                </div>
              </section>
            )

          case 'metrics':
            return (
              <section className="content-section metrics-block" id={anchor} key={key}>
                {renderBlockIntro(block)}
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
