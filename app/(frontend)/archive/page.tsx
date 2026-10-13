/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { adminLinks } from '@/lib/admin'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getArchiveItems, getSiteSettings } from '@/lib/content'

export default async function ArchivePage() {
  const [settings, items] = await Promise.all([getSiteSettings(), getArchiveItems()])
  const pageIntro = settings?.pageIntros?.archive || {}
  const primaryRecords = items.filter((item) => !item.itemType?.toLowerCase().includes('diagram'))
  const technicalRecords = items.filter((item) => item.itemType?.toLowerCase().includes('diagram'))

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.site} editLabel="archive page intro">
        <section className="section-heading section-heading-wide page-mast">
          <div>
            <div className="panel-eyebrow">{pageIntro.label || 'Evidence library'}</div>
            <h1>{pageIntro.title || 'Records'}</h1>
          </div>
          <div className="mast-side">
            {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
            <span className="count-pill">{items.length} records</span>
          </div>
        </section>
      </EditableRegion>

      <section className="archive-primary">
        <div className="section-heading compact-heading">
          <div className="panel-eyebrow">Primary artifacts</div>
          <h2>The published method and executable MRI experiment</h2>
        </div>
        <div className="archive-grid">
        {primaryRecords.map((item) => (
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
      </section>

      {technicalRecords.length ? (
        <details className="archive-technical">
          <summary>Refract system and workflow records ({technicalRecords.length})</summary>
          <p>These diagrams map the implemented FastAPI, PostgreSQL, ChromaDB, file-storage, and research-session architecture, then follow one question from paper ingestion through cited evidence, comparison, dataset audit, modeling, and interpretation.</p>
          <div className="resource-list">
            {technicalRecords.map((item) => (
              <Link className="resource-item" href={`/archive/${item.slug}`} key={item.slug}>
                <span>{item.itemType}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  )
}
