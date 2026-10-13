'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type NavigationItem = {
  href: string
  label: string
  resume?: boolean
}

type PrimaryNavigationProps = {
  items: NavigationItem[]
}

function pathFromHref(href: string) {
  return href.split('#')[0] || '/'
}

export function PrimaryNavigation({ items }: PrimaryNavigationProps) {
  const pathname = usePathname()
  const [hash, setHash] = useState('')

  useEffect(() => {
    function updateLocation() {
      setHash(window.location.hash)
    }

    updateLocation()
    window.addEventListener('hashchange', updateLocation)

    return () => {
      window.removeEventListener('hashchange', updateLocation)
    }
  }, [pathname])

  function isActive(item: NavigationItem) {
    const itemPath = pathFromHref(item.href)
    const itemHash = item.href.includes('#') ? `#${item.href.split('#')[1]}` : ''

    if (itemHash) return pathname === itemPath && hash === itemHash
    if (itemPath === '/') return pathname === '/'
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
  }

  return (
    <nav className="top-nav" aria-label="Primary">
      {items.map((item) => (
        <Link
          aria-current={isActive(item) ? 'page' : undefined}
          className={item.resume ? 'resume-nav-link' : undefined}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
