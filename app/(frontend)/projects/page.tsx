/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { adminLinks } from '@/lib/admin'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getProjects, getSiteSettings } from '@/lib/content'

export default async function ProjectsPage() {
  const [settings, projects] = await Promise.all([getSiteSettings(), getProjects()])
  const pageIntro = settings?.pageIntros?.projects || {}
  const leadProject = projects[0] || null
  const remainingProjects = leadProject ? projects.slice(1) : []

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.projectsPage} editLabel="projects page intro">
        <section className="section-heading section-heading-wide page-mast">
          <div>
            <div className="panel-eyebrow">{pageIntro.label || '01'}</div>
            <h1>{pageIntro.title || 'Projects'}</h1>
          </div>
          <div className="mast-side">
            {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
            <span className="count-pill">{projects.length} records</span>
          </div>
        </section>
      </EditableRegion>

      {leadProject ? (
        <EditableRegion editHref={adminLinks.project(leadProject.slug)} editLabel={leadProject.title || 'project spotlight'}>
          <article className="spotlight-panel">
            <div className="spotlight-grid">
              <div className="spotlight-copy">
                <div className="panel-eyebrow">
                  {leadProject.cardEyebrow || 'Project'} {leadProject.dateLabel ? `· ${leadProject.dateLabel}` : ''}
                </div>
                <h2>{leadProject.title}</h2>
                <p className="spotlight-summary">{leadProject.summary}</p>
                {leadProject.role ? <p className="spotlight-detail">{leadProject.role}</p> : null}
                {Array.isArray(leadProject.technologies) && leadProject.technologies.length ? (
                  <div className="tag-row">
                    {leadProject.technologies.map((technology, index) =>
                      technology?.value ? <span key={`${technology.value}-${index}`}>{technology.value}</span> : null
                    )}
                  </div>
                ) : null}
                <div className="spotlight-actions">
                  <Link className="primary-button" href={`/projects/${leadProject.slug}`}>
                    Read Project
                  </Link>
                </div>
              </div>

              {leadProject.coverImage && getUploadUrl(leadProject.coverImage) ? (
                <Link className="spotlight-media" href={`/projects/${leadProject.slug}`}>
                  <img alt={getUploadAlt(leadProject.coverImage)} src={getUploadUrl(leadProject.coverImage) || ''} />
                </Link>
              ) : null}
            </div>
          </article>
        </EditableRegion>
      ) : null}

      {remainingProjects.length ? (
        <div className="card-grid project-card-grid">
          {remainingProjects.map((project) => (
            <EditableRegion
              className="feature-card project-card-shell"
              editHref={adminLinks.project(project.slug)}
              editLabel={project.title || 'project'}
              key={project.slug}
              mode="card"
            >
              <Link className="project-card-link" href={`/projects/${project.slug}`}>
                {project.coverImage && getUploadUrl(project.coverImage) ? (
                  <div className="project-card-media">
                    <img alt={getUploadAlt(project.coverImage)} src={getUploadUrl(project.coverImage) || ''} />
                  </div>
                ) : (
                  <div className="project-card-media project-card-media-placeholder">
                    <span>{project.cardEyebrow || 'Project'}</span>
                  </div>
                )}
                <div className="card-meta">
                  {project.cardEyebrow || 'Project'} {project.dateLabel ? `· ${project.dateLabel}` : ''}
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                {Array.isArray(project.technologies) && project.technologies.length ? (
                  <div className="tag-row">
                    {project.technologies.slice(0, 4).map((technology, index) =>
                      technology?.value ? <span key={`${technology.value}-${index}`}>{technology.value}</span> : null
                    )}
                  </div>
                ) : null}
              </Link>
            </EditableRegion>
          ))}
        </div>
      ) : null}
    </div>
  )
}
