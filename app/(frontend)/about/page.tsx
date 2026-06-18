/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { MarkdownArticle } from '@/components/MarkdownArticle'
import { getUploadAlt, getUploadUrl } from '@/lib/assets'
import { adminLinks } from '@/lib/admin'
import { getSiteSettings } from '@/lib/content'

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const pageIntro = settings?.pageIntros?.about || {}
  const about = settings?.about || {}

  return (
    <EditableRegion editHref={adminLinks.site} editLabel="about page">
      <div className="page-flow">
        <section className="section-heading">
          <div className="panel-eyebrow">{pageIntro.label || '05'}</div>
          <h1>{pageIntro.title || 'About'}</h1>
          {about.lead ? <p className="section-summary">{about.lead}</p> : null}
        </section>

        <div className="about-grid">
          <div className="about-column">
            <MarkdownArticle markdown={about.biographyMarkdown} />
            <MarkdownArticle markdown={about.currentFocusMarkdown} />
            <div className="about-actions">
              <Link className="secondary-button" href="/resume/">
                Resume
              </Link>
              <Link className="secondary-button" href="/projects/">
                Projects
              </Link>
            </div>
          </div>

          {about.portrait && getUploadUrl(about.portrait) ? (
            <div className="portrait-frame">
              <img alt={getUploadAlt(about.portrait)} src={getUploadUrl(about.portrait) || ''} />
            </div>
          ) : null}
        </div>
      </div>
    </EditableRegion>
  )
}
