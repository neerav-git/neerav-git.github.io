'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react'

import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import type { ProjectRecord } from '@/lib/types'

import { ProjectKeywords } from './ProjectKeywords'

type ProjectRailProps = {
  projects: ProjectRecord[]
}

export function ProjectRail({ projects }: ProjectRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function move(direction: -1 | 1) {
    const rail = railRef.current
    const nextIndex = Math.min(projects.length - 1, Math.max(0, activeIndex + direction))
    const target = rail?.querySelector<HTMLElement>(`[data-project-index="${nextIndex}"]`)

    if (!rail || !target) return
    setActiveIndex(nextIndex)
    rail.scrollTo({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      left: target.offsetLeft,
    })
  }

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const activeRail = rail

    let frame = 0
    function syncActiveCard() {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const cards = Array.from(activeRail.querySelectorAll<HTMLElement>('[data-project-index]'))
        const nearest = cards.reduce(
          (best, card, index) => {
            const distance = Math.abs(card.offsetLeft - activeRail.scrollLeft)
            return distance < best.distance ? { distance, index } : best
          },
          { distance: Number.POSITIVE_INFINITY, index: 0 }
        )
        setActiveIndex(nearest.index)
      })
    }

    activeRail.addEventListener('scroll', syncActiveCard, { passive: true })
    return () => {
      activeRail.removeEventListener('scroll', syncActiveCard)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="product-index-shell">
      <div className="product-index-controls" aria-label="Product index controls">
        <div className="product-index-position" aria-live="polite">
          <span>{activeIndex + 1} of {projects.length} systems</span>
          <span className="product-index-progress" aria-hidden="true">
            <i style={{ transform: `scaleX(${projects.length ? (activeIndex + 1) / projects.length : 0})` }} />
          </span>
        </div>
        <div>
          <button aria-label="Previous product" disabled={activeIndex === 0} onClick={() => move(-1)} type="button">←</button>
          <button aria-label="Next product" disabled={activeIndex === projects.length - 1} onClick={() => move(1)} type="button">→</button>
        </div>
      </div>

      <div className="product-index" ref={railRef}>
        {projects.map((project, index) => {
          const image = getUploadUrl(project.thumbnailImage || project.coverImage)
          return (
            <a
              aria-current={activeIndex === index ? 'true' : undefined}
              className="product-index-card"
              data-project-index={index}
              href={`#project-${project.slug}`}
              key={project.slug}
            >
              {image ? (
                <div className="product-index-media">
                  <img alt={getUploadAlt(project.thumbnailImage || project.coverImage)} src={image} />
                </div>
              ) : (
                <div className="product-index-media product-index-placeholder"><span>{project.cardEyebrow || 'Product system'}</span></div>
              )}
              <ProjectKeywords keywords={project.portfolioKeywords} />
              <div className="product-index-copy">
                <span>{project.cardEyebrow || 'Product system'}</span>
                <h3>{project.title}</h3>
                <p>{project.landingDeck || project.summary}</p>
              </div>
              <strong>View dossier ↓</strong>
            </a>
          )
        })}
      </div>
    </div>
  )
}
