'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { getProjectStatus } from '@/lib/projectStatus'
import type { ProjectRecord } from '@/lib/types'

import { SkillTags } from './SkillTags'

type ProductShowcaseProps = {
  projects: ProjectRecord[]
}

function productHash(slug: string) {
  return `#product-${slug}`
}

export function ProductShowcase({ projects }: ProductShowcaseProps) {
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug || '')
  const [autoplayEnabled, setAutoplayEnabled] = useState(false)
  const [failedVideoSlug, setFailedVideoSlug] = useState('')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const activeProject = projects.find((project) => project.slug === activeSlug) || projects[0]
  const activeIndex = Math.max(0, projects.findIndex((project) => project.slug === activeProject?.slug))
  const previousProject = projects.length ? projects[(activeIndex - 1 + projects.length) % projects.length] : null
  const nextProject = projects.length ? projects[(activeIndex + 1) % projects.length] : null
  const showcaseAsset = activeProject?.showcaseImage || activeProject?.coverImage || activeProject?.thumbnailImage
  const image = getUploadUrl(showcaseAsset)
  const configuredVideo = getUploadUrl(activeProject?.showcaseVideo)
  const video = failedVideoSlug === activeProject?.slug ? null : configuredVideo
  const captions = getUploadUrl(activeProject?.showcaseVideoCaptions)

  useEffect(() => {
    function syncToHash() {
      const match = projects.find((project) => window.location.hash === productHash(project.slug))
      if (match) setActiveSlug(match.slug)
    }

    syncToHash()
    window.addEventListener('hashchange', syncToHash)
    return () => window.removeEventListener('hashchange', syncToHash)
  }, [projects])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncAutoplayPreference = () => setAutoplayEnabled(!reducedMotion.matches)

    syncAutoplayPreference()
    reducedMotion.addEventListener('change', syncAutoplayPreference)
    return () => reducedMotion.removeEventListener('change', syncAutoplayPreference)
  }, [])

  useEffect(() => {
    const player = videoRef.current
    if (!autoplayEnabled || !video || !player) return

    player.currentTime = 0
    void player.play().catch(() => {
      // Browser autoplay rules can still block playback. The poster and controls remain available.
    })
  }, [activeSlug, autoplayEnabled, video])

  if (!activeProject) return null

  const maturity = getProjectStatus(activeProject.status)
  const highlights = activeProject.landingHighlights || []

  function selectProduct(slug: string, moveFocus = false) {
    setActiveSlug(slug)
    window.history.replaceState(null, '', productHash(slug))
    if (moveFocus) tabRefs.current[projects.findIndex((project) => project.slug === slug)]?.focus()
  }

  function selectAdjacentProject(direction: -1 | 1, moveFocus = false) {
    const nextIndex = (activeIndex + direction + projects.length) % projects.length
    selectProduct(projects[nextIndex].slug, moveFocus)
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

  function handleVideoEnded() {
    if (autoplayEnabled && nextProject && projects.length > 1) {
      selectProduct(nextProject.slug)
    }
  }

  return (
    <section className="product-showcase" aria-label="Product portfolio">
      <div className="product-selector" role="tablist" aria-label="Choose a product">
        {projects.map((project) => (
          <button
            aria-controls="active-product-panel"
            aria-selected={project.slug === activeProject.slug}
            data-guide-mentions={project.title}
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

      <div className="product-showcase-navigation" aria-label="Product navigation" role="group">
        <p>Use the tabs or arrows to move between products.</p>
        <div className="product-showcase-navigation-controls">
          <button
            aria-label={`Previous product: ${previousProject?.title || ''}`}
            onClick={() => selectAdjacentProject(-1)}
            type="button"
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </button>
          <span aria-live="polite" className="product-showcase-position">
            {activeIndex + 1} of {projects.length}
          </span>
          <button
            aria-label={`Next product: ${nextProject?.title || ''}`}
            onClick={() => selectAdjacentProject(1)}
            type="button"
          >
            <span>Next product</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <article
        aria-labelledby={`product-tab-${activeProject.slug}`}
        className="active-product"
        id="active-product-panel"
        key={activeProject.slug}
        role="tabpanel"
      >
        {video ? (
          <div className="active-product-media active-product-media--video">
            <video
              aria-label={`${activeProject.title} product demo`}
              autoPlay={autoplayEnabled}
              controls
              key={video}
              muted
              onEnded={handleVideoEnded}
              onError={() => setFailedVideoSlug(activeProject.slug)}
              playsInline
              poster={image || undefined}
              preload="metadata"
              ref={videoRef}
            >
              <source src={video} />
              {captions ? <track default kind="captions" label="English" src={captions} srcLang="en" /> : null}
            </video>
            <div className="active-product-media-status">
              <span>Product demo</span>
              {nextProject && projects.length > 1 ? <span>Next: {nextProject.title}</span> : null}
            </div>
            <Link className="active-product-media-link" href={`/projects/${activeProject.slug}/`}>
              Open case study ↗
            </Link>
          </div>
        ) : image ? (
          <Link className="active-product-media" href={`/projects/${activeProject.slug}/`}>
            <img alt={getUploadAlt(showcaseAsset)} src={image} />
          </Link>
        ) : null}

        <div className="active-product-copy">
          <div className="active-product-meta">
            <span>{activeProject.cardEyebrow || 'Product'}</span>
            <span>{maturity.label}</span>
          </div>
          <h3>{activeProject.title}</h3>
          {activeProject.headline ? <p className="project-headline">{activeProject.headline}</p> : null}
          <p className="active-product-summary">{activeProject.summary}</p>
          {highlights[0] ? <p className="active-product-outcome"><strong>Lead evidence:</strong> {highlights[0]}</p> : null}
          <SkillTags compact skills={activeProject.skills} />

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
