'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

type EditableRegionProps = {
  children: ReactNode
  className?: string
  editHref?: string
  editLabel: string
  mode?: 'section' | 'card'
}

export function EditableRegion({ children, className, editHref, editLabel, mode = 'section' }: EditableRegionProps) {
  const pathname = usePathname()
  const [isEditable, setIsEditable] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const enabled = params.get('edit') === '1' || window.localStorage.getItem('portfolio-edit-mode') === '1'

    if (params.get('edit') === '1') {
      window.localStorage.setItem('portfolio-edit-mode', '1')
    }

    setIsEditable(enabled)
  }, [pathname])

  return (
    <div
      className={[
        'editable-region',
        isEditable ? 'is-editable' : '',
        isEditable ? `is-${mode}` : '',
        className || '',
      ]
        .join(' ')
        .trim()}
    >
      {isEditable && editHref ? (
        <div className="edit-chip">
          <div className="edit-chip-copy">
            <span className="edit-chip-label">{editLabel}</span>
            <small>Opens the matching studio entry</small>
          </div>
          <Link className="edit-chip-link" href={editHref}>
            Edit in Studio
          </Link>
        </div>
      ) : null}
      {children}
    </div>
  )
}
