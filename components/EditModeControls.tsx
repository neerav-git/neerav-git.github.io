'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { getPageEditTarget } from '@/lib/admin'

export function EditModeControls() {
  const pathname = usePathname() || '/'
  const [isEditMode, setIsEditMode] = useState(false)
  const pageEditTarget = useMemo(() => getPageEditTarget(pathname), [pathname])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const enabled = params.get('edit') === '1' || window.localStorage.getItem('portfolio-edit-mode') === '1'

    if (params.get('edit') === '1') {
      window.localStorage.setItem('portfolio-edit-mode', '1')
    }

    setIsEditMode(enabled)
  }, [pathname])

  if (!isEditMode) {
    return null
  }

  return (
    <div className="admin-tools" role="region" aria-label="Author mode controls">
      <div className="admin-tools-copy">
        <strong>Author mode</strong>
        <span>Editing happens in the studio. Section buttons open the matching entry.</span>
      </div>
      <Link href={pageEditTarget.href}>{pageEditTarget.label}</Link>
      <Link href="/admin/">Open Studio</Link>
      <Link
        href={pathname || '/'}
        onClick={() => {
          window.localStorage.removeItem('portfolio-edit-mode')
        }}
      >
        Exit Author Mode
      </Link>
    </div>
  )
}
