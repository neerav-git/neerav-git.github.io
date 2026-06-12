/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { adminLinks } from '@/lib/admin'
import { getHomePageData } from '@/lib/content'

export default async function HomePage() {
  const { featuredArchiveItems, featuredArticles, featuredProjects, home } = await getHomePageData()

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.home} editLabel="home page">
        <section className="hero-panel">
          <div className="hero-grid">
            <div>
              <div className="panel-eyebrow">{home?.heroEyebrow || 'Research systems · writing · long-form work'}</div>
              <h1>{home?.heroTitle || 'A public record of projects, research, and careful technical work.'}</h1>
              {home?.heroBody ? <p className="hero-copy">{home.heroBody}</p> : null}
              <div className="hero-links">
                {Array.isArray(home?.heroLinks)
                  ? home.heroLinks.map((link, index) =>
                      typeof link?.url === 'string' ? (
                        <Link href={link.url} key={`${link.url}-${index}`}>
                          {link.label || link.url}
                        </Link>
                      ) : null
                    )
                  : null}
              </div>
            </div>

            {home?.heroImage && getUploadUrl(home.heroImage) ? (
              <div className="hero-image-frame">
                <img alt={getUploadAlt(home.heroImage)} src={getUploadUrl(home.heroImage) || ''} />
              </div>
            ) : null}
          </div>
        </section>
      </EditableRegion>

      <section className="section-stack">
        <EditableRegion editHref={adminLinks.home} editLabel="featured projects section">
          <div className="section-heading">
            <div className="panel-eyebrow">Featured Work</div>
            <h2>{home?.featuredProjectsHeading || 'Selected Projects'}</h2>
          </div>
        </EditableRegion>
        <div className="card-grid">
          {featuredProjects.map((project) => (
            <EditableRegion
              className="feature-card"
              editHref={adminLinks.project(project.slug)}
              editLabel={project.title || 'project'}
              key={project.slug}
              mode="card"
            >
              <Link href={`/projects/${project.slug}`}>
                <div className="card-meta">{project.cardEyebrow || 'Project'}</div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <span>{project.dateLabel || 'Open record'}</span>
              </Link>
            </EditableRegion>
          ))}
        </div>
      </section>

      <section className="section-stack">
        <EditableRegion editHref={adminLinks.home} editLabel="featured writing section">
          <div className="section-heading">
            <div className="panel-eyebrow">Writing</div>
            <h2>{home?.featuredWritingHeading || 'Writing and Notes'}</h2>
          </div>
        </EditableRegion>
        <div className="stacked-list">
          {featuredArticles.map((article) => (
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

      <section className="section-stack">
        <EditableRegion editHref={adminLinks.home} editLabel="featured archive section">
          <div className="section-heading">
            <div className="panel-eyebrow">Archive</div>
            <h2>{home?.featuredArchiveHeading || 'Research Archive'}</h2>
          </div>
        </EditableRegion>
        <div className="stacked-list">
          {featuredArchiveItems.map((item) => (
            <EditableRegion editHref={adminLinks.archive(item.slug)} editLabel={item.title || 'archive item'} key={item.slug} mode="card">
              <Link className="stacked-item" href={`/archive/${item.slug}`}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>
                <span>{item.itemType || 'Archive item'}</span>
              </Link>
            </EditableRegion>
          ))}
        </div>
      </section>

      <EditableRegion editHref={adminLinks.home} editLabel="home page modules">
        <ContentBlocks blocks={Array.isArray(home?.modules) ? home.modules : []} />
      </EditableRegion>

      {home?.recommendationsNote ? (
        <EditableRegion editHref={adminLinks.home} editLabel="letters note">
          <section className="quiet-note">
            <div className="panel-eyebrow">Letters</div>
            <p>{home.recommendationsNote}</p>
          </section>
        </EditableRegion>
      ) : null}
    </div>
  )
}
