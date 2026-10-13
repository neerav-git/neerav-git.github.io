/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { PortfolioDeskTabs } from '@/components/PortfolioDeskTabs'
import { adminLinks } from '@/lib/admin'
import { getHomePageData } from '@/lib/content'

export default async function HomePage() {
  const { featuredArchiveItems, featuredArticles, home, productProjects, studyProjects } = await getHomePageData()
  const homeArticles = featuredArticles
    .filter((article) => article.slug !== 'designing-a-session-centered-research-workspace')
    .slice(0, 3)
  const experimentRecords = featuredArchiveItems.filter((item) => !item.slug.startsWith('refract-'))
  const technicalRecords = featuredArchiveItems.filter((item) => item.slug.startsWith('refract-'))

  return (
    <div className="page-flow product-home">
      <EditableRegion editHref={adminLinks.home} editLabel="home page hero">
        <section className="home-intro" id="glance">
          <div className="home-intro-copy">
            <div className="cover-issue-line">
              <span>Neerav Chaudhary · AI engineer</span>
              <span>Selected work · 2026</span>
            </div>
            <div className="panel-eyebrow">{home?.heroEyebrow || 'Product systems · applied AI · evaluation'}</div>
            <h1>{home?.heroTitle || 'AI products with implemented workflows and measured evaluation.'}</h1>
            <p>{home?.heroBody}</p>
            <div className="cover-actions">
              <a className="primary-button" href="#products-and-systems">See the products</a>
              <Link className="text-link" href="/about/">About my role →</Link>
            </div>
          </div>
          <aside className="home-principles" aria-label="How the products work">
            <div><strong>Keep evidence attached</strong><span>Show the employee record, cited passage, source instruction, or measured image region behind the result.</span></div>
            <div><strong>Make control explicit</strong><span>Separate a model’s proposal from the confirmation, approval, or review that authorizes the next step.</span></div>
            <div><strong>Test the outcome</strong><span>Verify the resulting application state, model output, synchronized interaction, or quantitative measurement with recorded evidence.</span></div>
          </aside>
        </section>
      </EditableRegion>

      <EditableRegion editHref={adminLinks.home} editLabel="portfolio sections">
        <div id="products-and-systems">
          <span aria-hidden="true" id="ml-ai-studies" />
          <PortfolioDeskTabs productProjects={productProjects} studyProjects={studyProjects} />
        </div>
      </EditableRegion>

      <section className="home-resources" aria-labelledby="home-resources-title">
        <header className="home-resources-heading">
          <div>
            <div className="panel-eyebrow">Notes and records</div>
            <h2 id="home-resources-title">Technical notes and source records</h2>
          </div>
          <p>Read the engineering decisions behind the products, then open the notebooks, peer-reviewed publication, and technical records supporting the reported methods and results.</p>
        </header>

        <div className="home-resource-columns">
          <section className="home-resource-group" id="home-writing">
            <div className="home-resource-group-heading">
              <h3>Engineering notes</h3>
              <Link href="/writing/">All notes →</Link>
            </div>
            <div className="home-link-list">
              {homeArticles.map((article) => (
                <Link href={`/writing/${article.slug}/`} key={article.slug}>
                  <span>{article.category || 'Technical note'}</span>
                  <strong>{article.title}</strong>
                  <small>{article.excerpt}</small>
                </Link>
              ))}
            </div>
          </section>

          <section className="home-resource-group" id="home-archive">
            <div className="home-resource-group-heading">
              <h3>Source records</h3>
              <Link href="/archive/">All records →</Link>
            </div>
            <div className="home-link-list">
              {experimentRecords.map((item) => (
                <Link href={`/archive/${item.slug}/`} key={item.slug}>
                  <span>{item.itemType || 'Source record'}</span>
                  <strong>{item.title}</strong>
                  <small>{item.summary}</small>
                </Link>
              ))}
            </div>
            {technicalRecords.length ? (
              <details className="technical-records">
                <summary>Refract technical diagrams ({technicalRecords.length})</summary>
                <p>Supporting architecture and workflow records. Refract’s application screens remain the primary product presentation.</p>
                <div>
                  {technicalRecords.map((item) => (
                    <Link href={`/archive/${item.slug}/`} key={item.slug}>{item.title} →</Link>
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  )
}
