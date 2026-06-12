/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { ContentBlocks } from '@/components/ContentBlocks'
import { EditableRegion } from '@/components/EditableRegion'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getHomePageData } from '@/lib/content'

export default async function HomePage() {
  const { featuredArchiveItems, featuredArticles, featuredProjects, home } = await getHomePageData()

  return (
    <div className="page-flow">
      <EditableRegion editHref="/admin/#/collections/site_content/entries/home" editLabel="homepage">
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
        <div className="section-heading">
          <div className="panel-eyebrow">Featured Work</div>
          <h2>{home?.featuredProjectsHeading || 'Selected Projects'}</h2>
        </div>
        <div className="card-grid">
          {featuredProjects.map((project) => (
            <Link className="feature-card" href={`/projects/${project.slug}`} key={project.slug}>
              <div className="card-meta">{project.cardEyebrow || 'Project'}</div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <span>{project.dateLabel || 'Open record'}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-stack">
        <div className="section-heading">
          <div className="panel-eyebrow">Writing</div>
          <h2>{home?.featuredWritingHeading || 'Writing and Notes'}</h2>
        </div>
        <div className="stacked-list">
          {featuredArticles.map((article) => (
            <Link className="stacked-item" href={`/writing/${article.slug}`} key={article.slug}>
              <div>
                <strong>{article.title}</strong>
                <p>{article.excerpt}</p>
              </div>
              <span>{article.category || 'Writing'}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-stack">
        <div className="section-heading">
          <div className="panel-eyebrow">Archive</div>
          <h2>{home?.featuredArchiveHeading || 'Research Archive'}</h2>
        </div>
        <div className="stacked-list">
          {featuredArchiveItems.map((item) => (
            <Link className="stacked-item" href={`/archive/${item.slug}`} key={item.slug}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </div>
              <span>{item.itemType || 'Archive item'}</span>
            </Link>
          ))}
        </div>
      </section>

      <ContentBlocks blocks={Array.isArray(home?.modules) ? home.modules : []} />

      {home?.recommendationsNote ? (
        <section className="quiet-note">
          <div className="panel-eyebrow">Recommendations</div>
          <p>{home.recommendationsNote}</p>
        </section>
      ) : null}
    </div>
  )
}
