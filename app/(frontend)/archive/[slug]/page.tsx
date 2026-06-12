import { notFound } from 'next/navigation'

import { ArtifactList } from '@/components/ArtifactList'
import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { adminLinks } from '@/lib/admin'
import { getArchiveItemBySlug, getArchiveItems } from '@/lib/content'

type ArchiveDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const items = await getArchiveItems()
  return items.map((item) => ({ slug: item.slug }))
}

export const dynamicParams = false

export default async function ArchiveDetailPage({ params }: ArchiveDetailPageProps) {
  const { slug } = await params
  const item = await getArchiveItemBySlug(slug)

  if (!item) {
    notFound()
  }

  return (
    <EditableRegion editHref={adminLinks.archive(item.slug)} editLabel={item.title || 'archive item'}>
      <article className="detail-page">
        <div className="detail-header">
          <div className="panel-eyebrow">{item.itemType || 'Archive item'}</div>
          <h1>{item.title}</h1>
          <p className="hero-copy">{item.summary}</p>
          <ArtifactList attachments={item.attachments} links={item.links} title="Artifacts" />
        </div>

        <ContentBlocks blocks={item.pageSections} />
      </article>
    </EditableRegion>
  )
}
