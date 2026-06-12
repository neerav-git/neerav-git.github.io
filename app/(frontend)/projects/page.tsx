import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { getProjects, getSiteSettings } from '@/lib/content'

export default async function ProjectsPage() {
  const [settings, projects] = await Promise.all([getSiteSettings(), getProjects()])
  const pageIntro = settings?.pageIntros?.projects || {}

  return (
    <div className="page-flow">
      <EditableRegion editHref="/admin/#/collections/site_settings/entries/site" editLabel="projects intro">
        <section className="section-heading">
          <div className="panel-eyebrow">{pageIntro.label || '01'}</div>
          <h1>{pageIntro.title || 'Projects'}</h1>
          {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
        </section>
      </EditableRegion>

      <div className="card-list">
        {projects.map((project) => (
          <EditableRegion
            className="feature-card"
            editHref={`/admin/#/collections/projects/entries/${project.slug}`}
            editLabel={project.title || 'project'}
            key={project.slug}
          >
            <Link href={`/projects/${project.slug}`}>
              <div className="card-meta">
                {project.cardEyebrow || 'Project'} {project.dateLabel ? `· ${project.dateLabel}` : ''}
              </div>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
              {Array.isArray(project.technologies) && project.technologies.length ? (
                <div className="tag-row">
                  {project.technologies.map((technology, index) =>
                    technology?.value ? <span key={`${technology.value}-${index}`}>{technology.value}</span> : null
                  )}
                </div>
              ) : null}
            </Link>
          </EditableRegion>
        ))}
      </div>
    </div>
  )
}
