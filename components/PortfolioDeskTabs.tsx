'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import type { ProjectRecord } from '@/lib/types'

import { ProductShowcase } from './ProductShowcase'

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
  const tabRefs = useRef<Record<Desk, HTMLButtonElement | null>>({ products: null, studies: null })

  useEffect(() => {
    function syncDeskToHash() {
      if (window.location.hash === deskHash.studies) setActiveDesk('studies')
      if (window.location.hash === deskHash.products) setActiveDesk('products')
    }

    syncDeskToHash()
    window.addEventListener('hashchange', syncDeskToHash)
    return () => window.removeEventListener('hashchange', syncDeskToHash)
  }, [])

  function selectDesk(desk: Desk, moveFocus = false) {
    setActiveDesk(desk)
    window.history.replaceState(null, '', deskHash[desk])
    if (moveFocus) tabRefs.current[desk]?.focus()
  }

  function handleDeskKeyDown(event: KeyboardEvent<HTMLButtonElement>, desk: Desk) {
    const desks: Desk[] = ['products', 'studies']
    const index = desks.indexOf(desk)
    let nextDesk = desk
    if (event.key === 'ArrowRight') nextDesk = desks[(index + 1) % desks.length]
    else if (event.key === 'ArrowLeft') nextDesk = desks[(index - 1 + desks.length) % desks.length]
    else if (event.key === 'Home') nextDesk = desks[0]
    else if (event.key === 'End') nextDesk = desks[desks.length - 1]
    else return

    event.preventDefault()
    selectDesk(nextDesk, true)
  }

  return (
    <section className="portfolio-tabs-shell" aria-label="Portfolio sections">
      <div className="portfolio-tab-list" role="tablist" aria-label="Choose a portfolio section">
        <button
          aria-controls="products-panel"
          aria-selected={activeDesk === 'products'}
          className="portfolio-tab"
          data-guide-mentions={['product', ...productProjects.map((project) => project.title)].join(',')}
          id="products-tab"
          onClick={() => selectDesk('products')}
          onKeyDown={(event) => handleDeskKeyDown(event, 'products')}
          ref={(element) => { tabRefs.current.products = element }}
          role="tab"
          tabIndex={activeDesk === 'products' ? 0 : -1}
          type="button"
        >
          <strong>Products &amp; Systems</strong>
          <small>{productProjects.length} working products</small>
        </button>
        <button
          aria-controls="studies-panel"
          aria-selected={activeDesk === 'studies'}
          className="portfolio-tab"
          data-guide-mentions="study,studies,imaging,MRI,IEEE,atrophy,Alzheimer,dementia"
          id="studies-tab"
          onClick={() => selectDesk('studies')}
          onKeyDown={(event) => handleDeskKeyDown(event, 'studies')}
          ref={(element) => { tabRefs.current.studies = element }}
          role="tab"
          tabIndex={activeDesk === 'studies' ? 0 : -1}
          type="button"
        >
          <strong>ML &amp; AI Studies</strong>
          <small>{studyProjects.length} research studies</small>
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
          <div><div className="panel-eyebrow">Products</div><h2>Four systems built around real workflows</h2></div>
          <p>Select a product to see its working interface, core outcome, leading evidence, and complete engineering dossier.</p>
        </div>

        <ProductShowcase projects={productProjects} />
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
          <div><div className="panel-eyebrow">Studies</div><h2>Two distinct medical-imaging contributions</h2></div>
          <p>One peer-reviewed OpenCV study turns MRI intensity regions into an interpretable atrophy score; the other builds and evaluates a four-class TensorFlow ensemble across 6,400 images.</p>
        </div>

        <div className="study-project-grid">
          {studyProjects.map((project) => {
            const image = getUploadUrl(project.coverImage)
            return (
              <Link className="study-project-card" href={`/projects/${project.slug}/`} key={project.slug}>
                {image ? (
                  <div className="study-project-media">
                    <img alt={getUploadAlt(project.coverImage)} src={image} />
                  </div>
                ) : null}
                <div className="study-project-copy">
                  <div className="study-project-meta">
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
