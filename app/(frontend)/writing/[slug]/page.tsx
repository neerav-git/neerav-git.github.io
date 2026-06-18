import { notFound } from 'next/navigation'

import { ArtifactList } from '@/components/ArtifactList'
import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { EntrySectionMap } from '@/components/EntrySectionMap'
import { adminLinks } from '@/lib/admin'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getArticleBySlug, getArticles } from '@/lib/content'

type ArticlePageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const articles = await getArticles()
  return articles.map((article) => ({ slug: article.slug }))
}

export const dynamicParams = false

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  return (
    <EditableRegion editHref={adminLinks.article(article.slug)} editLabel={article.title || 'article'}>
      <article className="detail-page detail-entry">
        <div className="entry-layout">
          <div className="entry-main">
            <div className="detail-header detail-mast">
              <div className="panel-eyebrow">{article.category || 'Writing'}</div>
              <h1>{article.title}</h1>
              <p className="hero-copy">{article.excerpt}</p>
            </div>

            {article.coverImage && getUploadUrl(article.coverImage) ? (
              <div className="cover-frame detail-cover">
                <img alt={getUploadAlt(article.coverImage)} src={getUploadUrl(article.coverImage) || ''} />
              </div>
            ) : null}

            <ContentBlocks blocks={article.pageSections} />
          </div>

          <aside className="entry-rail">
            <section className="entry-rail-panel">
              <div className="panel-eyebrow">Reading frame</div>
              <div className="entry-summary-stack">
                {article.publishDate ? <p>{new Date(article.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p> : null}
                {article.category ? <p>{article.category}</p> : null}
              </div>
            </section>

            <ArtifactList attachments={article.attachments} links={article.links} title="References and files" />
            <EntrySectionMap blocks={article.pageSections} />
          </aside>
        </div>
      </article>
    </EditableRegion>
  )
}
