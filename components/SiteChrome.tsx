import Link from 'next/link'
import type { ReactNode } from 'react'

import { EditModeControls } from '@/components/EditModeControls'
import { EditableRegion } from '@/components/EditableRegion'
import { adminLinks } from '@/lib/admin'
import type { SiteSettings } from '@/lib/types'

type SiteChromeProps = {
  children: ReactNode
  settings: SiteSettings
}

export function SiteChrome({ children, settings }: SiteChromeProps) {
  const navigation = settings?.navigation || {}
  const socialLinks = Array.isArray(settings?.socialLinks) ? settings.socialLinks : []

  const navItems = [
    { href: '/', label: navigation.homeLabel || 'Home' },
    { href: '/projects', label: navigation.projectsLabel || 'Projects' },
    { href: '/writing', label: navigation.writingLabel || 'Writing' },
    { href: '/archive', label: navigation.archiveLabel || 'Archive' },
    { href: '/about', label: navigation.aboutLabel || 'About' },
    { href: '/recommendations', label: navigation.recommendationsLabel || 'Recommendations' },
  ]

  return (
    <div className="site-shell">
      <EditableRegion editHref={adminLinks.site} editLabel="site header and navigation">
        <header className="site-header">
          <div className="brand-stack">
            <Link className="brand-mark" href="/">
              {settings?.siteTitle || 'Neerav Chaudhary'}
            </Link>
            <p className="brand-tagline">
              {settings?.siteTagline || 'Projects, research, and long-form technical thinking.'}
            </p>
          </div>

          <div className="header-right">
            <nav className="top-nav" aria-label="Primary">
              {navItems.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <EditModeControls />
          </div>
        </header>
      </EditableRegion>

      <main className="site-main">{children}</main>

      <EditableRegion editHref={adminLinks.site} editLabel="footer and contact links">
        <footer className="site-footer">
          <div>
            <div className="panel-eyebrow">Site</div>
            <p>{settings?.footerLine || 'Built as a living archive rather than a resume.'}</p>
          </div>

          <div>
            <div className="panel-eyebrow">Elsewhere</div>
            <div className="footer-links">
              {socialLinks.map((link: any, index: number) =>
                typeof link?.url === 'string' ? (
                  <a href={link.url} key={`${link.url}-${index}`} rel="noreferrer" target="_blank">
                    {link.label || link.url}
                  </a>
                ) : null
              )}
              {settings?.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : null}
            </div>
          </div>
        </footer>
      </EditableRegion>
    </div>
  )
}
