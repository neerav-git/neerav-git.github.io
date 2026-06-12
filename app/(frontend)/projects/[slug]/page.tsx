/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'

import { ArtifactList } from '@/components/ArtifactList'
import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { MarkdownArticle } from '@/components/MarkdownArticle'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { adminLinks } from '@/lib/admin'
import { getProjectBySlug, getProjects } from '@/lib/content'

type ProjectPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const projects = await getProjects()
  return projects.map((project) => ({ slug: project.slug }))
}

export const dynamicParams = false

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const gallery = Array.isArray(project.gallery) ? project.gallery : []
  const repoTopics = Array.isArray(project.github?.repoTopics) ? project.github.repoTopics : []

  return (
    <EditableRegion editHref={adminLinks.project(project.slug)} editLabel={project.title || 'project'}>
      <article className="detail-page">
        <div className="detail-header">
          <div className="panel-eyebrow">
            {project.cardEyebrow || 'Project'} {project.dateLabel ? `· ${project.dateLabel}` : ''}
          </div>
          <h1>{project.title}</h1>
          <p className="hero-copy">{project.summary}</p>
          {project.role ? <p className="detail-role">Role: {project.role}</p> : null}
          <ArtifactList attachments={project.attachments} links={project.links} title="Project Links" />
        </div>

        {project.coverImage && getUploadUrl(project.coverImage) ? (
          <div className="cover-frame">
            <img alt={getUploadAlt(project.coverImage)} src={getUploadUrl(project.coverImage) || ''} />
          </div>
        ) : null}

        <ContentBlocks blocks={project.pageSections} />

        {project.github?.importedReadmeMarkdown ? (
          <section className="content-section">
            <div className="panel-eyebrow">GitHub README</div>
            <h2>{project.github.repoName || 'Repository Source'}</h2>
            <MarkdownArticle markdown={project.github.importedReadmeMarkdown} />
          </section>
        ) : null}

        {repoTopics.length ? (
          <section className="resource-panel">
            <div className="panel-eyebrow">Repository Metadata</div>
            <div className="tag-row">
              {repoTopics.map((topic, index) =>
                topic?.value ? <span key={`${topic.value}-${index}`}>{topic.value}</span> : null
              )}
            </div>
          </section>
        ) : null}

        {gallery.length ? (
          <section className="gallery-grid">
            {gallery.map((image, index) =>
              getUploadUrl(image) ? (
                <div className="gallery-card" key={`${image.url || 'image'}-${index}`}>
                  <img alt={getUploadAlt(image)} src={getUploadUrl(image) || ''} />
                </div>
              ) : null
            )}
          </section>
        ) : null}
      </article>
    </EditableRegion>
  )
}
