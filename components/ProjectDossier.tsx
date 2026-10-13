/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getProjectStatus } from '@/lib/projectStatus'
import type { ProjectRecord } from '@/lib/types'

type ProjectDossierProps = {
  featured?: boolean
  project: ProjectRecord
}

export function ProjectDossier({ featured = false, project }: ProjectDossierProps) {
  const image = getUploadUrl(project.coverImage)
  const capabilities = project.landingHighlights?.slice(0, 3) || []
  const maturity = getProjectStatus(project.status)

  return (
    <article className={featured ? 'product-dossier product-dossier--featured' : 'product-dossier'} id={`project-${project.slug}`}>
      <header className="product-dossier-header">
        <div>
          <div className="panel-eyebrow">
            {project.cardEyebrow || 'Product system'} {project.dateLabel ? `· ${project.dateLabel}` : ''}
          </div>
          <h3>{project.title}</h3>
        </div>
        <span className="dossier-status" title={maturity.definition}>{maturity.label}</span>
      </header>

      <div className="product-dossier-grid">
        <div className="product-dossier-copy">
          <p className="product-dossier-deck">{project.landingDeck || project.summary}</p>
          {capabilities.length ? (
            <ul className="dossier-capabilities">
              {capabilities.map((item, index) => (
                <li key={`${project.slug}-${index}`}>
                  <span aria-hidden="true" className="dossier-capability-marker" />
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          ) : null}
          {project.methodology?.evaluation ? (
            <div className="dossier-validation">
              <span>Validation</span>
              <p>{project.methodology.evaluation}</p>
            </div>
          ) : null}
          <div className="dossier-actions">
            <Link className="primary-button" href={`/projects/${project.slug}/`}>Open full case study</Link>
            {project.links?.slice(0, 1).map((link) => (
              <a className="text-link" href={link.url} key={link.url} rel="noreferrer" target="_blank">{link.label} ↗</a>
            ))}
          </div>
        </div>

        {image ? (
          <Link className="product-dossier-media" href={`/projects/${project.slug}/`}>
            <img alt={getUploadAlt(project.coverImage)} src={image} />
          </Link>
        ) : null}
      </div>
    </article>
  )
}
