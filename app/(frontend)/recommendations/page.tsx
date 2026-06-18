import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { getUploadUrl } from '@/lib/assets'
import { adminLinks } from '@/lib/admin'
import { getRecommendations, getSiteSettings } from '@/lib/content'

function isResumeRecord(record: { recommenderRole?: string; title?: string }) {
  const value = `${record.title || ''} ${record.recommenderRole || ''}`.toLowerCase()
  return value.includes('resume') || value.includes('cv') || value.includes('professional record')
}

export default async function RecommendationsPage() {
  const [settings, records] = await Promise.all([getSiteSettings(), getRecommendations()])
  const pageIntro = settings?.pageIntros?.recommendations || {}
  const letters = records.filter((record) => !isResumeRecord(record))

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.lettersPage} editLabel="letters page intro">
        <section className="section-heading subdued-heading page-mast">
          <div>
            <div className="panel-eyebrow">{pageIntro.label || '06'}</div>
            <h1>{pageIntro.title || 'References'}</h1>
          </div>
          <div className="mast-side">
            {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
            <span className="count-pill">{letters.length} records</span>
          </div>
        </section>
      </EditableRegion>

      {letters.length ? (
        <div className="stacked-list recommendation-list">
          {letters.map((letter) => (
            <EditableRegion
              editHref={adminLinks.recommendations(letter.slug)}
              editLabel={letter.title || 'recommendation'}
              key={letter.slug}
              mode="card"
            >
              <article className="stacked-item quiet-card">
                <div>
                  <strong>{letter.title}</strong>
                  <p>{letter.excerpt || letter.context}</p>
                  <small>
                    {letter.recommenderName}
                    {letter.recommenderRole ? ` · ${letter.recommenderRole}` : ''}
                  </small>
                </div>
                {getUploadUrl(letter.pdfLetter) ? (
                  <a href={getUploadUrl(letter.pdfLetter) || ''} rel="noreferrer" target="_blank">
                    Open PDF
                  </a>
                ) : (
                  <span>Reference note</span>
                )}
              </article>
            </EditableRegion>
          ))}
        </div>
      ) : (
        <EditableRegion editHref="/admin/#/collections/recommendations" editLabel="letters collection" mode="card">
          <article className="stacked-item quiet-card">
            <div>
              <strong>No references published yet</strong>
              <p>Formal letters and reference documents can be added here later. The resume now has its own page.</p>
              <small>This section remains intentionally compact and secondary to the main work record.</small>
            </div>
            <Link href="/resume/">Resume</Link>
          </article>
        </EditableRegion>
      )}
    </div>
  )
}
