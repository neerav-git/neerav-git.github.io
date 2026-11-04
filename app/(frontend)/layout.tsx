import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { SiteChrome } from '@/components/SiteChrome'
import { getSiteSettings } from '@/lib/content'

import './styles.css'

export const metadata: Metadata = {
  description: 'Applied AI engineering projects, evaluation systems, published research, and technical writing by Neerav Chaudhary.',
  title: 'Neerav Chaudhary | Applied AI Engineer',
}

export const viewport: Viewport = {
  initialScale: 1,
  viewportFit: 'cover',
  width: 'device-width',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <html lang="en">
      <body>
        <SiteChrome settings={settings}>
          {children}
        </SiteChrome>
      </body>
    </html>
  )
}
