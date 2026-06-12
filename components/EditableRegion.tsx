'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

type EditableRegionProps = {
  children: ReactNode
  className?: string
  editHref?: string
  editLabel: string
}

export function EditableRegion({ children, className, editHref, editLabel }: EditableRegionProps) {
  const [isEditable, setIsEditable] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const enabled = params.get('edit') === '1' || window.localStorage.getItem('portfolio-edit-mode') === '1'

    if (params.get('edit') === '1') {
      window.localStorage.setItem('portfolio-edit-mode', '1')
    }

    setIsEditable(enabled)
  }, [])

  return (
    <div className={['editable-region', isEditable ? 'is-editable' : '', className || ''].join(' ').trim()}>
      {isEditable && editHref ? (
        <Link className="edit-chip" href={editHref}>
          Edit {editLabel}
        </Link>
      ) : null}
      {children}
    </div>
  )
}
