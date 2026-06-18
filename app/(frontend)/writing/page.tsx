import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { adminLinks } from '@/lib/admin'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getArticles, getSiteSettings } from '@/lib/content'

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

function formatPublishDate(value?: string) {
  if (!value) {
    return null
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return null
  }

  return monthFormatter.format(new Date(parsed))
}

export default async function WritingPage() {
  const [settings, articles] = await Promise.all([getSiteSettings(), getArticles()])
  const pageIntro = settings?.pageIntros?.writing || {}
  const leadArticle = articles[0] || null
  const remainingArticles = leadArticle ? articles.slice(1) : []

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.writingPage} editLabel="writing page intro">
        <section className="section-heading section-heading-wide page-mast">
          <div>
            <div className="panel-eyebrow">{pageIntro.label || '02'}</div>
            <h1>{pageIntro.title || 'Writing'}</h1>
          </div>
          <div className="mast-side">
            {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
            <span className="count-pill">{articles.length} entries</span>
          </div>
        </section>
      </EditableRegion>

      {leadArticle ? (
        <EditableRegion editHref={adminLinks.article(leadArticle.slug)} editLabel={leadArticle.title || 'lead article'}>
          <article className="lead-story lead-story-wide">
            <div className="lead-story-grid">
              <div className="lead-story-stack">
                <div className="lead-story-meta">
                  <span className="panel-eyebrow">{leadArticle.category || 'Writing'}</span>
                  {formatPublishDate(leadArticle.publishDate) ? <span className="panel-eyebrow">{formatPublishDate(leadArticle.publishDate)}</span> : null}
                </div>
                <h2>{leadArticle.title}</h2>
                <p className="lead-story-copy">{leadArticle.excerpt}</p>
                <Link className="primary-button" href={`/writing/${leadArticle.slug}`}>
                  Read Entry
                </Link>
              </div>

              {leadArticle.coverImage && getUploadUrl(leadArticle.coverImage) ? (
                <div className="lead-story-media">
                  <img alt={getUploadAlt(leadArticle.coverImage)} src={getUploadUrl(leadArticle.coverImage) || ''} />
                </div>
              ) : null}
            </div>
          </article>
        </EditableRegion>
      ) : null}

      <div className="writing-grid">
        {remainingArticles.map((article) => (
          <EditableRegion
            className="feature-card writing-card"
            editHref={adminLinks.article(article.slug)}
            editLabel={article.title || 'article'}
            key={article.slug}
            mode="card"
          >
            <Link className="writing-card-link" href={`/writing/${article.slug}`}>
              {article.coverImage && getUploadUrl(article.coverImage) ? (
                <div className="writing-card-media">
                  <img alt={getUploadAlt(article.coverImage)} src={getUploadUrl(article.coverImage) || ''} />
                </div>
              ) : null}
              <div className="card-meta">
                {article.category || 'Writing'} {formatPublishDate(article.publishDate) ? `· ${formatPublishDate(article.publishDate)}` : ''}
              </div>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </Link>
          </EditableRegion>
        ))}
      </div>
    </div>
  )
}
