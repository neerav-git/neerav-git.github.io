import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { SiteChrome } from '@/components/SiteChrome'
import { getSiteSettings } from '@/lib/content'

import './styles.css'

export const metadata: Metadata = {
  description: 'A public record of work, projects, research, and technical writing by Neerav Chaudhary.',
  title: 'Neerav Chaudhary',
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
