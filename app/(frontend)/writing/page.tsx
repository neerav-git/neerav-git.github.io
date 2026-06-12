import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { getArticles, getSiteSettings } from '@/lib/content'

export default async function WritingPage() {
  const [settings, articles] = await Promise.all([getSiteSettings(), getArticles()])
  const pageIntro = settings?.pageIntros?.writing || {}

  return (
    <div className="page-flow">
      <EditableRegion editHref="/admin/#/collections/site_settings/entries/site" editLabel="writing intro">
        <section className="section-heading">
          <div className="panel-eyebrow">{pageIntro.label || '02'}</div>
          <h1>{pageIntro.title || 'Writing'}</h1>
          {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
        </section>
      </EditableRegion>

      <div className="stacked-list">
        {articles.map((article) => (
          <EditableRegion
            editHref={`/admin/#/collections/writing/entries/${article.slug}`}
            editLabel={article.title || 'article'}
            key={article.slug}
          >
            <Link className="stacked-item" href={`/writing/${article.slug}`}>
              <div>
                <strong>{article.title}</strong>
                <p>{article.excerpt}</p>
              </div>
              <span>{article.category || 'Writing'}</span>
            </Link>
          </EditableRegion>
        ))}
      </div>
    </div>
  )
}
