/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'

import { ArtifactList } from '@/components/ArtifactList'
import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { EntrySectionMap } from '@/components/EntrySectionMap'
import { adminLinks } from '@/lib/admin'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getArticleBySlug, getArticles } from '@/lib/content'
import { normalizeContentMedia } from '@/lib/mediaDeduplication'

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

  const coverUrl = getUploadUrl(article.coverImage)
  const normalizedMedia = normalizeContentMedia(article.pageSections, coverUrl ? [coverUrl] : [])

  return (
    <EditableRegion editHref={adminLinks.article(article.slug)} editLabel={article.title || 'article'}>
      <article className="detail-page detail-entry">
        <div className="detail-overview">
          <div className="detail-header detail-mast">
            <div className="panel-eyebrow">{article.category || 'Writing'}</div>
            <h1>{article.title}</h1>
            <p className="hero-copy">{article.excerpt}</p>
          </div>

          <aside className="detail-overview-aside">
            <section className="entry-rail-panel">
              <div className="panel-eyebrow">Publication details</div>
              <div className="entry-summary-stack">
                {article.publishDate ? <p>{new Date(article.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p> : null}
                {article.category ? <p>{article.category}</p> : null}
              </div>
            </section>

            <ArtifactList attachments={article.attachments} links={article.links} title="References and files" />
          </aside>
        </div>

        {article.coverImage && getUploadUrl(article.coverImage) ? (
          <div className="cover-frame detail-cover">
            <img alt={getUploadAlt(article.coverImage)} src={getUploadUrl(article.coverImage) || ''} />
          </div>
        ) : null}

        <EntrySectionMap blocks={normalizedMedia.blocks} />
        <ContentBlocks blocks={normalizedMedia.blocks} />
      </article>
    </EditableRegion>
  )
}
