/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'

import { ArtifactList } from '@/components/ArtifactList'
import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { EntrySectionMap } from '@/components/EntrySectionMap'
import { ProjectMethodology } from '@/components/ProjectMethodology'
import { SkillTags } from '@/components/SkillTags'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { adminLinks } from '@/lib/admin'
import { getProjectBySlug, getProjects } from '@/lib/content'
import { normalizeContentMedia, uniqueAssets } from '@/lib/mediaDeduplication'
import { getProjectStatus } from '@/lib/projectStatus'

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

  const coverUrl = getUploadUrl(project.coverImage)
  const normalizedMedia = normalizeContentMedia(project.pageSections, coverUrl ? [coverUrl] : [])
  const gallery = uniqueAssets(project.gallery, normalizedMedia.usedUrls)
  const repoTopics = Array.isArray(project.github?.repoTopics) ? project.github.repoTopics : []
  const maturity = getProjectStatus(project.status)
  const skills = project.skills?.length
    ? project.skills
    : (project.technologies || []).map((technology) => technology.value).filter(Boolean)

  return (
    <EditableRegion editHref={adminLinks.project(project.slug)} editLabel={project.title || 'project'}>
      <article className="detail-page detail-entry">
        <div className="detail-overview" id="overview">
          <div className="detail-header detail-mast">
            <div className="panel-eyebrow">
              {project.cardEyebrow || 'Project'} {project.dateLabel ? `· ${project.dateLabel}` : ''}
            </div>
            <h1>{project.title}</h1>
            {project.headline ? <p className="project-headline project-headline--hero">{project.headline}</p> : null}
            <p className="hero-copy">{project.summary}</p>
            {project.role ? <p className="detail-role"><strong>Role</strong>{project.role}</p> : null}
          </div>

          <aside className="detail-overview-aside">
            {skills.length ? (
              <section className="entry-rail-panel">
                <div className="panel-eyebrow">Summary</div>
                <div className="entry-summary-stack">
                  <p><strong>{maturity.label}.</strong> {maturity.definition}</p>
                  <a className="text-link" href="#methodology">Build, evidence, and scope ↓</a>
                  <SkillTags skills={skills} />
                </div>
              </section>
            ) : null}

          </aside>
        </div>

        {project.coverImage && getUploadUrl(project.coverImage) ? (
          <div className="cover-frame detail-cover">
            <img alt={getUploadAlt(project.coverImage)} src={getUploadUrl(project.coverImage) || ''} />
          </div>
        ) : null}

        <ProjectMethodology project={project} />
        <EntrySectionMap blocks={normalizedMedia.blocks} />
        <ContentBlocks blocks={normalizedMedia.blocks} />

        {gallery.length ? (
          <section className="gallery-grid" id="gallery">
            {gallery.map((image, index) =>
              getUploadUrl(image) ? (
                <div className="gallery-card" key={`${image.url || 'image'}-${index}`}>
                  <img alt={getUploadAlt(image)} src={getUploadUrl(image) || ''} />
                </div>
              ) : null
            )}
          </section>
        ) : null}

        <ArtifactList attachments={project.attachments} id="project-links" links={project.links} title="Project links" />

        {repoTopics.length ? (
          <section className="detail-topics">
            <div className="panel-eyebrow">Repository topics</div>
            <div className="tag-row">
              {repoTopics.map((topic, index) =>
                topic?.value ? <span key={`${topic.value}-${index}`}>{topic.value}</span> : null
              )}
            </div>
          </section>
        ) : null}
      </article>
    </EditableRegion>
  )
}
