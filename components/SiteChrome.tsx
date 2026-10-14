import Link from 'next/link'
import type { ReactNode } from 'react'

import { EditModeControls } from '@/components/EditModeControls'
import { EditableRegion } from '@/components/EditableRegion'
import { PortfolioGuide } from '@/components/PortfolioGuide'
import { PrimaryNavigation } from '@/components/PrimaryNavigation'
import { adminLinks } from '@/lib/admin'
import type { SiteSettings } from '@/lib/types'

type SiteChromeProps = {
  children: ReactNode
  settings: SiteSettings
}

export function SiteChrome({ children, settings }: SiteChromeProps) {
  // The guide only appears once its API is deployed and the URL is set at build time.
  const guideApiUrl = process.env.NEXT_PUBLIC_GUIDE_API_URL
  const navigation = settings?.navigation || {}
  const socialLinks = Array.isArray(settings?.socialLinks) ? settings.socialLinks : []

  const navItems = [
    { href: '/', label: navigation.homeLabel || 'Home' },
    { href: '/projects', label: navigation.projectsLabel || 'Work' },
    { href: '/writing', label: navigation.writingLabel || 'Writing' },
    { href: '/archive', label: navigation.archiveLabel || 'Archive' },
    { href: '/about', label: navigation.aboutLabel || 'About' },
    { href: '/resume', label: navigation.resumeLabel || 'Resume', resume: true },
  ]

  return (
    <div className="site-shell">
      <a className="skip-link" href="#site-main">Skip to content</a>
      <EditableRegion editHref={adminLinks.site} editLabel="site header and navigation">
        <header className="site-header">
          <div className="brand-stack">
            <Link className="brand-mark" href="/">
              {settings?.siteTitle || 'Neerav Chaudhary'}
            </Link>
            <p className="brand-tagline">
              {settings?.siteTagline || 'AI products, ML studies, and technical notes.'}
            </p>
          </div>

          <div className="header-right">
            <PrimaryNavigation items={navItems} />
            <EditModeControls />
          </div>
        </header>
      </EditableRegion>

      <main className="site-main" id="site-main">{children}</main>

      <EditableRegion editHref={adminLinks.site} editLabel="footer and contact links">
        <footer className="site-footer">
          <div>
            <div className="panel-eyebrow">Site</div>
            <p>{settings?.footerLine || 'Selected products, studies, and source records.'}</p>
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

      {guideApiUrl ? <PortfolioGuide apiUrl={guideApiUrl} /> : null}
    </div>
  )
}
