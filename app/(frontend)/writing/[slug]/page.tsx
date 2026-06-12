import { notFound } from 'next/navigation'

import { ArtifactList } from '@/components/ArtifactList'
import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
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
    <EditableRegion
      editHref={`/admin/#/collections/writing/entries/${article.slug}`}
      editLabel={article.title || 'article'}
    >
      <article className="detail-page">
        <div className="detail-header">
          <div className="panel-eyebrow">{article.category || 'Writing'}</div>
          <h1>{article.title}</h1>
          <p className="hero-copy">{article.excerpt}</p>
          <ArtifactList attachments={article.attachments} links={article.links} title="References and Files" />
        </div>

        <ContentBlocks blocks={article.pageSections} />
      </article>
    </EditableRegion>
  )
}
