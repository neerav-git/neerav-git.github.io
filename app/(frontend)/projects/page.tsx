/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { adminLinks } from '@/lib/admin'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getProjects, getSiteSettings } from '@/lib/content'
import type { ProjectRecord } from '@/lib/types'

const productSlugs = new Set(['relay', 'refract-ai', 'homeward', 'birb-hangout'])

function ProjectIndexCard({ project }: { project: ProjectRecord }) {
  return (
    <EditableRegion
      className="case-index-card"
      editHref={adminLinks.project(project.slug)}
      editLabel={project.title || 'project'}
      mode="card"
    >
      <Link className="case-index-card-link" href={`/projects/${project.slug}`}>
        {project.coverImage && getUploadUrl(project.coverImage) ? (
          <div className="case-index-media">
            <img alt={getUploadAlt(project.coverImage)} src={getUploadUrl(project.coverImage) || ''} />
          </div>
        ) : null}
        <div className="case-index-copy">
          <div className="card-meta">
            {project.cardEyebrow || 'Project'} {project.dateLabel ? `· ${project.dateLabel}` : ''}
          </div>
          <h2>{project.title}</h2>
          <p>{project.summary}</p>
          <span className="text-link">Open case study →</span>
        </div>
      </Link>
    </EditableRegion>
  )
}

export default async function ProjectsPage() {
  const [settings, projects] = await Promise.all([getSiteSettings(), getProjects()])
  const pageIntro = settings?.pageIntros?.projects || {}
  const productProjects = projects.filter((project) => productSlugs.has(project.slug))
  const studyProjects = projects.filter((project) => !productSlugs.has(project.slug))

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.projectsPage} editLabel="projects page intro">
        <section className="section-heading section-heading-wide page-mast">
          <div>
            <div className="panel-eyebrow">{pageIntro.label || 'Selected work'}</div>
            <h1>{pageIntro.title || 'Projects'}</h1>
          </div>
          <div className="mast-side">
            {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
            <span className="count-pill">{projects.length} case studies</span>
          </div>
        </section>
      </EditableRegion>

      {productProjects.length ? (
        <section className="case-index-section" aria-labelledby="product-case-studies">
          <div className="compact-index-heading">
            <div className="panel-eyebrow">Products</div>
            <h2 id="product-case-studies">Four implemented products, from interface to evaluated outcome</h2>
          </div>
          <div className="case-index-grid">
            {productProjects.map((project) => <ProjectIndexCard key={project.slug} project={project} />)}
          </div>
        </section>
      ) : null}

      {studyProjects.length ? (
        <section className="case-index-section" aria-labelledby="research-case-studies">
          <div className="compact-index-heading">
            <div className="panel-eyebrow">ML studies</div>
            <h2 id="research-case-studies">Peer-reviewed atrophy measurement and four-class MRI ensembling</h2>
          </div>
          <div className="case-index-grid case-index-grid--studies">
            {studyProjects.map((project) => <ProjectIndexCard key={project.slug} project={project} />)}
          </div>
        </section>
      ) : null}
    </div>
  )
}
