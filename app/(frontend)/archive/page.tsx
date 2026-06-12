import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { getArchiveItems, getSiteSettings } from '@/lib/content'

export default async function ArchivePage() {
  const [settings, items] = await Promise.all([getSiteSettings(), getArchiveItems()])
  const pageIntro = settings?.pageIntros?.archive || {}

  return (
    <div className="page-flow">
      <EditableRegion editHref="/admin/#/collections/site_settings/entries/site" editLabel="archive intro">
        <section className="section-heading">
          <div className="panel-eyebrow">{pageIntro.label || '03'}</div>
          <h1>{pageIntro.title || 'Research Archive'}</h1>
          {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
        </section>
      </EditableRegion>

      <div className="card-list">
        {items.map((item) => (
          <EditableRegion
            className="feature-card"
            editHref={`/admin/#/collections/archive/entries/${item.slug}`}
            editLabel={item.title || 'archive item'}
            key={item.slug}
          >
            <Link href={`/archive/${item.slug}`}>
              <div className="card-meta">
                {item.itemType || 'Archive item'} {item.dateLabel ? `· ${item.dateLabel}` : ''}
              </div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
            </Link>
          </EditableRegion>
        ))}
      </div>
    </div>
  )
}
