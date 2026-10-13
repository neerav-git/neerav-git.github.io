'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getProjectStatus } from '@/lib/projectStatus'
import type { ProjectRecord } from '@/lib/types'

type ProductShowcaseProps = {
  projects: ProjectRecord[]
}

function productHash(slug: string) {
  return `#product-${slug}`
}

export function ProductShowcase({ projects }: ProductShowcaseProps) {
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug || '')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeProject = projects.find((project) => project.slug === activeSlug) || projects[0]

  useEffect(() => {
    function syncToHash() {
      const match = projects.find((project) => window.location.hash === productHash(project.slug))
      if (match) setActiveSlug(match.slug)
    }

    syncToHash()
    window.addEventListener('hashchange', syncToHash)
    return () => window.removeEventListener('hashchange', syncToHash)
  }, [projects])

  if (!activeProject) return null

  const image = getUploadUrl(activeProject.coverImage || activeProject.thumbnailImage)
  const maturity = getProjectStatus(activeProject.status)
  const highlights = activeProject.landingHighlights || []

  function selectProduct(slug: string, moveFocus = false) {
    setActiveSlug(slug)
    window.history.replaceState(null, '', productHash(slug))
    if (moveFocus) tabRefs.current[projects.findIndex((project) => project.slug === slug)]?.focus()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % projects.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + projects.length) % projects.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = projects.length - 1
    else return

    event.preventDefault()
    selectProduct(projects[nextIndex].slug, true)
  }

  return (
    <section className="product-showcase" aria-label="Product portfolio">
      <div className="product-selector" role="tablist" aria-label="Choose a product">
        {projects.map((project) => (
          <button
            aria-controls="active-product-panel"
            aria-selected={project.slug === activeProject.slug}
            id={`product-tab-${project.slug}`}
            key={project.slug}
            onClick={() => selectProduct(project.slug)}
            onKeyDown={(event) => handleTabKeyDown(event, projects.indexOf(project))}
            ref={(element) => { tabRefs.current[projects.indexOf(project)] = element }}
            role="tab"
            tabIndex={project.slug === activeProject.slug ? 0 : -1}
            type="button"
          >
            <span>{project.title}</span>
            <small>{getProjectStatus(project.status).label}</small>
          </button>
        ))}
      </div>

      <article
        aria-labelledby={`product-tab-${activeProject.slug}`}
        className="active-product"
        id="active-product-panel"
        key={activeProject.slug}
        role="tabpanel"
      >
        {image ? (
          <Link className="active-product-media" href={`/projects/${activeProject.slug}/`}>
            <img alt={getUploadAlt(activeProject.coverImage || activeProject.thumbnailImage)} src={image} />
          </Link>
        ) : null}

        <div className="active-product-copy">
          <div className="active-product-meta">
            <span>{activeProject.cardEyebrow || 'Product'}</span>
            <span>{maturity.label}</span>
          </div>
          <h3>{activeProject.title}</h3>
          <p className="active-product-summary">{activeProject.summary}</p>
          {highlights[0] ? <p className="active-product-outcome"><strong>Lead evidence:</strong> {highlights[0]}</p> : null}

          {(highlights.length > 1 || activeProject.methodology?.evaluation || activeProject.methodology?.boundary) ? (
            <details className="product-details">
              <summary>Method, evaluation, and scope</summary>
              {highlights.length > 1 ? (
                <ul>
                  {highlights.slice(1).map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>
              ) : null}
              {activeProject.methodology?.evaluation ? (
                <p><strong>Evaluation:</strong> {activeProject.methodology.evaluation}</p>
              ) : null}
              {activeProject.methodology?.boundary ? (
                <p><strong>Next validation:</strong> {activeProject.methodology.boundary}</p>
              ) : null}
            </details>
          ) : null}

          <Link className="primary-button" href={`/projects/${activeProject.slug}/`}>
            Open {activeProject.title} case study
          </Link>
        </div>
      </article>
    </section>
  )
}
