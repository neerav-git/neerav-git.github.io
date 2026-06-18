/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { adminLinks } from '@/lib/admin'
import { getHomePageData } from '@/lib/content'

export default async function HomePage() {
  const { featuredArchiveItems, featuredArticles, featuredProjects, home } = await getHomePageData()
  const leadProject = featuredProjects[0] || null
  const supportingProjects = leadProject ? featuredProjects.slice(1) : []
  const leadArticle = featuredArticles[0] || null
  const secondaryArticles = leadArticle ? featuredArticles.slice(1) : []
  const leadArchive = featuredArchiveItems[0] || null
  const secondaryArchive = leadArchive ? featuredArchiveItems.slice(1) : []
  const glanceItems = [
    { value: String(featuredProjects.length || 0), label: 'projects in focus' },
    { value: String(featuredArticles.length || 0), label: 'featured writing entries' },
    { value: String(featuredArchiveItems.length || 0), label: 'archive records surfaced' },
  ]

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.home} editLabel="home page hero">
        <section className="hero-panel editorial-hero" id="glance">
          <div className="hero-grid editorial-hero-grid">
            <div className="hero-copy-column">
              <div className="panel-eyebrow">{home?.heroEyebrow || 'Research systems · writing · long-form work'}</div>
              <h1>{home?.heroTitle || 'A public record of projects, research, and careful technical work.'}</h1>
              {home?.heroBody ? <p className="hero-copy">{home.heroBody}</p> : null}
              {Array.isArray(home?.heroLinks) && home.heroLinks.length ? (
                <div className="hero-route-list">
                  {home.heroLinks.map((link, index) =>
                    typeof link?.url === 'string' ? (
                      <Link className="hero-route-card" href={link.url} key={`${link.url}-${index}`}>
                        <strong>{link.label || link.url}</strong>
                        {link.description ? <span>{link.description}</span> : null}
                      </Link>
                    ) : null
                  )}
                </div>
              ) : null}
              <div className="jump-ribbon">
                <a href="#home-projects">Projects</a>
                <a href="#home-writing">Writing</a>
                <a href="#home-archive">Archive</a>
              </div>
            </div>

            <aside className="hero-sidecar">
              {home?.heroImage && getUploadUrl(home.heroImage) ? (
                <div className="hero-image-frame editorial-hero-image">
                  <img alt={getUploadAlt(home.heroImage)} src={getUploadUrl(home.heroImage) || ''} />
                </div>
              ) : null}

              <div className="overview-panel">
                <div className="panel-eyebrow">At a glance</div>
                <div className="glance-grid">
                  {glanceItems.map((item) => (
                    <article className="glance-card" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </article>
                  ))}
                </div>
                <p className="overview-note">
                  Begin with the projects, then follow the writing and archive records that deepen the technical context around them.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </EditableRegion>

      <section className="section-stack" id="home-projects">
        <EditableRegion editHref={adminLinks.home} editLabel="featured projects section">
          <div className="section-heading section-heading-wide">
            <div>
              <div className="panel-eyebrow">Featured Work</div>
              <h2>{home?.featuredProjectsHeading || 'Selected Projects'}</h2>
            </div>
            <p className="section-summary">
              The main projects combine system design, experimental work, and supporting records so the technical story remains complete.
            </p>
          </div>
        </EditableRegion>

        {leadProject ? (
          <div className="project-feature-grid">
            <EditableRegion editHref={adminLinks.project(leadProject.slug)} editLabel={`${leadProject.title || 'project'} spotlight`}>
              <article className="spotlight-panel">
                <div className="spotlight-grid">
                  <div className="spotlight-copy">
                    <div className="panel-eyebrow">
                      {leadProject.cardEyebrow || 'Project'} {leadProject.dateLabel ? `· ${leadProject.dateLabel}` : ''}
                    </div>
                    <h3>{leadProject.title}</h3>
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
                        Open Project
                      </Link>
                      {Array.isArray(leadProject.links)
                        ? leadProject.links.slice(0, 2).map((link, index) =>
                            typeof link?.url === 'string' ? (
                              <a className="secondary-button" href={link.url} key={`${link.url}-${index}`} rel="noreferrer" target="_blank">
                                {link.label || link.url}
                              </a>
                            ) : null
                          )
                        : null}
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

            {supportingProjects.length ? (
              <div className="project-support-stack">
                {supportingProjects.map((project) => (
                  <EditableRegion
                    className="feature-card project-support-card"
                    editHref={adminLinks.project(project.slug)}
                    editLabel={project.title || 'project'}
                    key={project.slug}
                    mode="card"
                  >
                    <Link className="project-support-link" href={`/projects/${project.slug}`}>
                      {project.coverImage && getUploadUrl(project.coverImage) ? (
                        <div className="project-support-media">
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
                      {project.role ? <small>{project.role}</small> : null}
                      {Array.isArray(project.technologies) && project.technologies.length ? (
                        <div className="tag-row">
                          {project.technologies.slice(0, 4).map((technology, index) =>
                            technology?.value ? <span key={`${technology.value}-${index}`}>{technology.value}</span> : null
                          )}
                        </div>
                      ) : null}
                      <span className="project-support-cta">Open project</span>
                    </Link>
                  </EditableRegion>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="editorial-columns">
        <section className="primary-column section-stack" id="home-writing">
          <EditableRegion editHref={adminLinks.home} editLabel="featured writing section">
          <div className="section-heading section-heading-wide">
            <div>
              <div className="panel-eyebrow">Writing</div>
              <h2>{home?.featuredWritingHeading || 'Writing and Notes'}</h2>
            </div>
            <p className="section-summary">
              Essays and project notes on design choices, evaluation, and the reasoning behind the work.
            </p>
          </div>
        </EditableRegion>

          {leadArticle ? (
            <EditableRegion editHref={adminLinks.article(leadArticle.slug)} editLabel={leadArticle.title || 'article'}>
              <article className="lead-story">
                <div className="panel-eyebrow">{leadArticle.category || 'Writing'}</div>
                <h3>{leadArticle.title}</h3>
                <p className="lead-story-copy">{leadArticle.excerpt}</p>
                <Link className="primary-button" href={`/writing/${leadArticle.slug}`}>
                  Read Article
                </Link>
              </article>
            </EditableRegion>
          ) : null}

          <div className="stacked-list">
            {secondaryArticles.map((article) => (
              <EditableRegion editHref={adminLinks.article(article.slug)} editLabel={article.title || 'article'} key={article.slug} mode="card">
                <Link className="stacked-item" href={`/writing/${article.slug}`}>
                  <div>
                    <strong>{article.title}</strong>
                    <p>{article.excerpt}</p>
                  </div>
                  <span>{article.category || 'Writing'}</span>
                </Link>
              </EditableRegion>
            ))}
          </div>
        </section>

        <aside className="secondary-column section-stack" id="home-archive">
          <EditableRegion editHref={adminLinks.home} editLabel="featured archive section">
          <div className="section-heading">
            <div className="panel-eyebrow">Archive</div>
            <h2>{home?.featuredArchiveHeading || 'Research Archive'}</h2>
            <p className="section-summary">
              Diagrams, notebook records, and reference materials that extend the main project pages with implementation and study context.
            </p>
          </div>
        </EditableRegion>

          {leadArchive ? (
            <EditableRegion editHref={adminLinks.archive(leadArchive.slug)} editLabel={leadArchive.title || 'archive record'}>
              <article className="archive-lead-card">
                {leadArchive.previewImage && getUploadUrl(leadArchive.previewImage) ? (
                  <div className="archive-lead-media">
                    <img alt={getUploadAlt(leadArchive.previewImage)} src={getUploadUrl(leadArchive.previewImage) || ''} />
                  </div>
                ) : null}
                <div className="panel-eyebrow">{leadArchive.itemType || 'Archive item'}</div>
                <h3>{leadArchive.title}</h3>
                <p>{leadArchive.summary}</p>
                <Link className="secondary-button" href={`/archive/${leadArchive.slug}`}>
                  Open Record
                </Link>
              </article>
            </EditableRegion>
          ) : null}

          <div className="mini-card-stack">
            {secondaryArchive.map((item) => (
              <EditableRegion editHref={adminLinks.archive(item.slug)} editLabel={item.title || 'archive item'} key={item.slug} mode="card">
                <Link className="mini-card" href={`/archive/${item.slug}`}>
                  <div className="card-meta">
                    {item.itemType || 'Archive item'} {item.dateLabel ? `· ${item.dateLabel}` : ''}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </Link>
              </EditableRegion>
            ))}
          </div>

          {home?.recommendationsNote ? (
            <EditableRegion editHref={adminLinks.home} editLabel="letters note">
              <section className="quiet-note quiet-note-emphasis">
                <div className="panel-eyebrow">Letters</div>
                <p>{home.recommendationsNote}</p>
              </section>
            </EditableRegion>
          ) : null}
        </aside>
      </div>

      <EditableRegion editHref={adminLinks.home} editLabel="home page modules">
        <ContentBlocks blocks={Array.isArray(home?.modules) ? home.modules : []} />
      </EditableRegion>
    </div>
  )
}
