'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function EditModeControls() {
  const [pathname, setPathname] = useState('/')
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const enabled = params.get('edit') === '1' || window.localStorage.getItem('portfolio-edit-mode') === '1'

    if (params.get('edit') === '1') {
      window.localStorage.setItem('portfolio-edit-mode', '1')
    }

    setIsEditMode(enabled)
    setPathname(window.location.pathname || '/')
  }, [])

  if (!isEditMode) {
    return null
  }

  return (
    <div className="admin-tools">
      <Link href="/admin/">Open Studio</Link>
      <Link
        href={pathname || '/'}
        onClick={() => {
          window.localStorage.removeItem('portfolio-edit-mode')
        }}
      >
        Exit Edit Mode
      </Link>
    </div>
  )
}
