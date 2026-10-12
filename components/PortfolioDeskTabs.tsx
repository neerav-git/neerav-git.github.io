'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import type { ProjectRecord } from '@/lib/types'

import { ProjectDossier } from './ProjectDossier'
import { ProjectKeywords } from './ProjectKeywords'
import { ProjectRail } from './ProjectRail'

type PortfolioDeskTabsProps = {
  productProjects: ProjectRecord[]
  studyProjects: ProjectRecord[]
}

type Desk = 'products' | 'studies'

const deskHash: Record<Desk, string> = {
  products: '#products-and-systems',
  studies: '#ml-ai-studies',
}

export function PortfolioDeskTabs({ productProjects, studyProjects }: PortfolioDeskTabsProps) {
  const [activeDesk, setActiveDesk] = useState<Desk>('products')

  useEffect(() => {
    function syncDeskToHash() {
      if (window.location.hash === deskHash.studies) setActiveDesk('studies')
      if (window.location.hash === deskHash.products) setActiveDesk('products')
    }

    syncDeskToHash()
    window.addEventListener('hashchange', syncDeskToHash)
    return () => window.removeEventListener('hashchange', syncDeskToHash)
  }, [])

  function selectDesk(desk: Desk) {
    setActiveDesk(desk)
    window.history.replaceState(null, '', deskHash[desk])
  }

  return (
    <section className="portfolio-tabs-shell" aria-label="Portfolio sections">
      <div className="portfolio-tab-list" role="tablist" aria-label="Choose a portfolio section">
        <button
          aria-controls="products-panel"
          aria-selected={activeDesk === 'products'}
          className="portfolio-tab"
          id="products-tab"
          onClick={() => selectDesk('products')}
          role="tab"
          type="button"
        >
          <span>01</span>
          <strong>Products &amp; Systems</strong>
          <small>4 working products</small>
        </button>
        <button
          aria-controls="studies-panel"
          aria-selected={activeDesk === 'studies'}
          className="portfolio-tab"
          id="studies-tab"
          onClick={() => selectDesk('studies')}
          role="tab"
          type="button"
        >
          <span>02</span>
          <strong>ML &amp; AI Studies</strong>
          <small>Methods and evaluation</small>
        </button>
      </div>

      <div
        aria-labelledby="products-tab"
        className="portfolio-tab-panel editorial-desk"
        hidden={activeDesk !== 'products'}
        id="products-panel"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="desk-heading">
          <div><span>01</span><div><div className="panel-eyebrow">Products</div><h2>Working interfaces and systems</h2></div></div>
          <p>Open a product to see the interface, the user flow, the system decisions, and the checks used to verify it.</p>
        </div>

        <ProjectRail projects={productProjects} />

        <div className="dossier-stack">
          {productProjects.map((project, index) => (
            <ProjectDossier featured={index === 0} key={project.slug} project={project} />
          ))}
        </div>
      </div>

      <div
        aria-labelledby="studies-tab"
        className="portfolio-tab-panel editorial-desk"
        hidden={activeDesk !== 'studies'}
        id="studies-panel"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="desk-heading">
          <div><span>02</span><div><div className="panel-eyebrow">Studies</div><h2>Methods, models, and evaluation</h2></div></div>
          <p>These studies show the data, experimental steps, evaluation method, and limits of each result.</p>
        </div>

        <div className="study-project-grid">
          {studyProjects.map((project, index) => {
            const image = getUploadUrl(project.coverImage)
            return (
              <Link className="study-project-card" href={`/projects/${project.slug}/`} key={project.slug}>
                {image ? (
                  <div className="study-project-media">
                    <img alt={getUploadAlt(project.coverImage)} src={image} />
                  </div>
                ) : null}
                <ProjectKeywords keywords={project.portfolioKeywords} />
                <div className="study-project-copy">
                  <div className="study-project-meta">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span>{project.cardEyebrow || 'ML & AI study'}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.landingDeck || project.summary}</p>
                  {project.landingHighlights?.length ? (
                    <ul>
                      {project.landingHighlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                  <strong>Open study →</strong>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
