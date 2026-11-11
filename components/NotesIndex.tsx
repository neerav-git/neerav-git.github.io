import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { adminLinks } from '@/lib/admin'
import { getArchiveItems, getArticles, getSiteSettings } from '@/lib/content'

type NotesIndexProps = {
  defaultOpen?: 'articles' | 'records'
}

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatPublishDate(value?: string) {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : monthFormatter.format(new Date(parsed))
}

export async function NotesIndex({ defaultOpen = 'articles' }: NotesIndexProps) {
  const [settings, articles, records] = await Promise.all([
    getSiteSettings(),
    getArticles(),
    getArchiveItems(),
  ])
  const writingIntro = settings?.pageIntros?.writing || {}
  const archiveIntro = settings?.pageIntros?.archive || {}

  return (
    <div className="page-flow notes-page">
      <EditableRegion editHref={adminLinks.writingPage} editLabel="notes page intro">
        <section className="section-heading section-heading-wide page-mast">
          <div>
            <div className="panel-eyebrow">Engineering documentation</div>
            <h1>Notes</h1>
          </div>
          <div className="mast-side">
            <p className="section-summary">
              Engineering methods and the source records behind the reported work, organized in two expandable collections.
            </p>
            <span className="count-pill">{articles.length + records.length} notes and records</span>
          </div>
        </section>
      </EditableRegion>

      <div className="notes-groups">
        <details className="notes-group" id="engineering-notes" open={defaultOpen === 'articles'}>
          <summary>
            <span>
              <small>Methods and implementation decisions</small>
              <strong>Engineering notes</strong>
            </span>
            <span>{articles.length} notes</span>
          </summary>
          <div className="notes-group-body">
            {writingIntro.intro ? <p className="section-summary">{writingIntro.intro}</p> : null}
            <div className="notes-entry-list">
              {articles.map((article) => {
                const date = formatPublishDate(article.publishDate)
                return (
                  <EditableRegion
                    editHref={adminLinks.article(article.slug)}
                    editLabel={article.title || 'article'}
                    key={article.slug}
                    mode="card"
                  >
                    <Link className="notes-entry" href={`/writing/${article.slug}/`}>
                      <span>{article.category || 'Engineering note'}{date ? ` · ${date}` : ''}</span>
                      <strong>{article.title}</strong>
                      <p>{article.excerpt}</p>
                      <small>Read note →</small>
                    </Link>
                  </EditableRegion>
                )
              })}
            </div>
          </div>
        </details>

        <details className="notes-group" id="source-records" open={defaultOpen === 'records'}>
          <summary>
            <span>
              <small>Notebooks, publications, and diagrams</small>
              <strong>Source records</strong>
            </span>
            <span>{records.length} records</span>
          </summary>
          <div className="notes-group-body">
            {archiveIntro.intro ? <p className="section-summary">{archiveIntro.intro}</p> : null}
            <div className="notes-entry-list">
              {records.map((record) => (
                <EditableRegion
                  editHref={adminLinks.archive(record.slug)}
                  editLabel={record.title || 'source record'}
                  key={record.slug}
                  mode="card"
                >
                  <Link className="notes-entry" href={`/archive/${record.slug}/`}>
                    <span>{record.itemType || 'Source record'}{record.dateLabel ? ` · ${record.dateLabel}` : ''}</span>
                    <strong>{record.title}</strong>
                    <p>{record.summary}</p>
                    <small>Open record →</small>
                  </Link>
                </EditableRegion>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
