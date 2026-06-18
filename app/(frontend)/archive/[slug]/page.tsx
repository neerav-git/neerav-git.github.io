import { notFound } from 'next/navigation'

import { ArtifactList } from '@/components/ArtifactList'
import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { EntrySectionMap } from '@/components/EntrySectionMap'
import { adminLinks } from '@/lib/admin'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
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
      <article className="detail-page detail-entry">
        <div className="entry-layout">
          <div className="entry-main">
            <div className="detail-header detail-mast">
              <div className="panel-eyebrow">{item.itemType || 'Archive item'}</div>
              <h1>{item.title}</h1>
              <p className="hero-copy">{item.summary}</p>
            </div>

            {item.previewImage && getUploadUrl(item.previewImage) ? (
              <div className="cover-frame">
                <img alt={getUploadAlt(item.previewImage)} src={getUploadUrl(item.previewImage) || ''} />
              </div>
            ) : null}

            <ContentBlocks blocks={item.pageSections} />
          </div>

          <aside className="entry-rail">
            <section className="entry-rail-panel">
              <div className="panel-eyebrow">Record context</div>
              <div className="entry-summary-stack">
                {item.dateLabel ? <p>{item.dateLabel}</p> : null}
                {item.itemType ? <p>{item.itemType}</p> : null}
              </div>
            </section>

            <ArtifactList attachments={item.attachments} links={item.links} title="Artifacts" />
            <EntrySectionMap blocks={item.pageSections} />
          </aside>
        </div>
      </article>
    </EditableRegion>
  )
}
