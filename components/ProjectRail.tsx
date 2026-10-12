'use client'

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react'

import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import type { ProjectRecord } from '@/lib/types'

import { ProjectKeywords } from './ProjectKeywords'

type ProjectRailProps = {
  projects: ProjectRecord[]
}

export function ProjectRail({ projects }: ProjectRailProps) {
  const railRef = useRef<HTMLDivElement>(null)

  function move(direction: -1 | 1) {
    railRef.current?.scrollBy({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      left: direction * Math.min(420, railRef.current.clientWidth * 0.78),
    })
  }

  return (
    <div className="product-index-shell">
      <div className="product-index-controls" aria-label="Product index controls">
        <span>{String(projects.length).padStart(2, '0')} systems</span>
        <div>
          <button aria-label="Previous product" onClick={() => move(-1)} type="button">←</button>
          <button aria-label="Next product" onClick={() => move(1)} type="button">→</button>
        </div>
      </div>

      <div className="product-index" ref={railRef}>
        {projects.map((project, index) => {
          const image = getUploadUrl(project.thumbnailImage || project.coverImage)
          return (
            <a className="product-index-card" href={`#project-${project.slug}`} key={project.slug}>
              <div className="product-index-number">{String(index + 1).padStart(2, '0')}</div>
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
