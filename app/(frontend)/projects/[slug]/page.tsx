/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'

import { ArtifactList } from '@/components/ArtifactList'
import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { EntrySectionMap } from '@/components/EntrySectionMap'
import { MarkdownArticle } from '@/components/MarkdownArticle'
import { ProjectProof } from '@/components/ProjectProof'
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
      <article className="detail-page detail-entry">
        <div className="entry-layout">
          <div className="entry-main">
            <div className="detail-header detail-mast">
              <div className="panel-eyebrow">
                {project.cardEyebrow || 'Project'} {project.dateLabel ? `· ${project.dateLabel}` : ''}
              </div>
              <h1>{project.title}</h1>
              <p className="hero-copy">{project.summary}</p>
              <ProjectProof project={project} />
              {project.role ? <p className="detail-role">Role: {project.role}</p> : null}
            </div>

            {project.coverImage && getUploadUrl(project.coverImage) ? (
              <div className="cover-frame">
                <img alt={getUploadAlt(project.coverImage)} src={getUploadUrl(project.coverImage) || ''} />
              </div>
            ) : null}

            <ContentBlocks blocks={project.pageSections} />

            {project.github?.importedReadmeMarkdown ? (
              <section className="content-section appendix-section repo-appendix-section">
                <div className="panel-eyebrow">Repository source</div>
                <h2>README appendix</h2>
                <p className="section-summary">
                  The curated project page above is the main reading path. The imported README is kept as source context for readers who want to compare the portfolio narrative with the repository record.
                </p>
                <details className="repo-readme-details">
                  <summary>Open imported README</summary>
                  <MarkdownArticle markdown={project.github.importedReadmeMarkdown} />
                </details>
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
          </div>

          <aside className="entry-rail">
            {Array.isArray(project.technologies) && project.technologies.length ? (
              <section className="entry-rail-panel">
                <div className="panel-eyebrow">Summary</div>
                <div className="entry-summary-stack">
                  <p>{project.status ? `Status: ${project.status.replace(/-/g, ' ')}` : 'Repository-backed project record.'}</p>
                  <div className="tag-row">
                    {project.technologies.map((technology, index) =>
                      technology?.value ? <span key={`${technology.value}-${index}`}>{technology.value}</span> : null
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            <ArtifactList attachments={project.attachments} links={project.links} title="Project links" />
            <EntrySectionMap blocks={project.pageSections} />

            {repoTopics.length ? (
              <section className="entry-rail-panel">
                <div className="panel-eyebrow">Repository topics</div>
                <div className="tag-row">
                  {repoTopics.map((topic, index) =>
                    topic?.value ? <span key={`${topic.value}-${index}`}>{topic.value}</span> : null
                  )}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </article>
    </EditableRegion>
  )
}
