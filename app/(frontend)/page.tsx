/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { PortfolioDeskTabs } from '@/components/PortfolioDeskTabs'
import { adminLinks } from '@/lib/admin'
import { getHomePageData } from '@/lib/content'

export default async function HomePage() {
  const { featuredArchiveItems, featuredArticles, home, productProjects, studyProjects } = await getHomePageData()
  const leadArticle = featuredArticles[0] || null

  return (
    <div className="page-flow product-home">
      <EditableRegion editHref={adminLinks.home} editLabel="home page hero">
        <section className="editorial-cover" id="glance">
          <div className="editorial-cover-copy">
            <div className="cover-issue-line">
              <span>Neerav Chaudhary · AI engineer</span>
              <span>Selected work · 2026</span>
            </div>
            <div className="panel-eyebrow">{home?.heroEyebrow || 'Product systems · applied AI · evaluation'}</div>
            <h1>{home?.heroTitle || 'AI products with implemented workflows and measured evaluation.'}</h1>
            <p>{home?.heroBody}</p>
            <div className="cover-actions">
              <a className="primary-button" href="#products-and-systems">Explore products</a>
              <a className="text-link" href="#ml-ai-studies">ML &amp; AI studies ↓</a>
            </div>
          </div>
          <aside className="cover-index" aria-label="Portfolio sections">
            <div className="panel-eyebrow">Portfolio sections</div>
            <ol>
              <li><a href="#products-and-systems"><span>01</span> Products &amp; Systems</a></li>
              <li><a href="#ml-ai-studies"><span>02</span> ML &amp; AI Studies</a></li>
              <li><a href="#home-writing"><span>03</span> Methods</a></li>
              <li><a href="#home-archive"><span>04</span> Evidence</a></li>
            </ol>
          </aside>
        </section>
      </EditableRegion>

      <EditableRegion editHref={adminLinks.home} editLabel="portfolio sections">
        <div id="products-and-systems">
          <span aria-hidden="true" id="ml-ai-studies" />
          <PortfolioDeskTabs productProjects={productProjects} studyProjects={studyProjects} />
        </div>
      </EditableRegion>

      <div className="editorial-columns home-lower-desks">
        <section className="primary-column editorial-desk" id="home-writing">
          <div className="desk-heading compact"><div><span>03</span><div><div className="panel-eyebrow">Methods</div><h2>Technical methods</h2></div></div></div>
          {leadArticle ? (
            <Link className="lead-story" href={`/writing/${leadArticle.slug}/`}>
              <div className="panel-eyebrow">{leadArticle.category || 'Field note'}</div>
              <h3>{leadArticle.title}</h3>
              <p className="lead-story-copy">{leadArticle.excerpt}</p>
              <strong>Read method →</strong>
            </Link>
          ) : null}
          <div className="stacked-list">
            {featuredArticles.slice(1, 4).map((article) => (
              <Link className="stacked-item" href={`/writing/${article.slug}/`} key={article.slug}>
                <div><strong>{article.title}</strong><p>{article.excerpt}</p></div><span>{article.category || 'Note'}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="secondary-column editorial-desk" id="home-archive">
          <div className="desk-heading compact"><div><span>04</span><div><div className="panel-eyebrow">Evidence</div><h2>Sources and records</h2></div></div></div>
          <div className="mini-card-stack">
            {featuredArchiveItems.slice(0, 4).map((item) => (
              <Link className="mini-card" href={`/archive/${item.slug}/`} key={item.slug}>
                <div className="card-meta">{item.itemType || 'Record'} {item.dateLabel ? `· ${item.dateLabel}` : ''}</div>
                <strong>{item.title}</strong><p>{item.summary}</p>
              </Link>
            ))}
          </div>
          <Link className="secondary-button" href="/archive/">View all evidence</Link>
        </aside>
      </div>
    </div>
  )
}
