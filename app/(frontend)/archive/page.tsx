/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { adminLinks } from '@/lib/admin'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getArchiveItems, getSiteSettings } from '@/lib/content'

export default async function ArchivePage() {
  const [settings, items] = await Promise.all([getSiteSettings(), getArchiveItems()])
  const pageIntro = settings?.pageIntros?.archive || {}

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.site} editLabel="archive page intro">
        <section className="section-heading section-heading-wide page-mast">
          <div>
            <div className="panel-eyebrow">{pageIntro.label || '03'}</div>
            <h1>{pageIntro.title || 'Records'}</h1>
          </div>
          <div className="mast-side">
            {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
            <span className="count-pill">{items.length} records</span>
          </div>
        </section>
      </EditableRegion>

      <div className="archive-grid">
        {items.map((item) => (
          <EditableRegion
            className="feature-card archive-card"
            editHref={adminLinks.archive(item.slug)}
            editLabel={item.title || 'archive item'}
            key={item.slug}
            mode="card"
          >
            <Link className="archive-card-link" href={`/archive/${item.slug}`}>
              {item.previewImage && getUploadUrl(item.previewImage) ? (
                <div className="archive-card-media">
                  <img alt={getUploadAlt(item.previewImage)} src={getUploadUrl(item.previewImage) || ''} />
                </div>
              ) : null}
              <div className="card-meta">
                {item.itemType || 'Archive item'} {item.dateLabel ? `· ${item.dateLabel}` : ''}
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </Link>
          </EditableRegion>
        ))}
      </div>
    </div>
  )
}
