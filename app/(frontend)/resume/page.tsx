import Link from 'next/link'

import { EditableRegion } from '@/components/EditableRegion'
import { getUploadUrl } from '@/lib/assets'
import { adminLinks } from '@/lib/admin'
import { getRecommendations, getSiteSettings } from '@/lib/content'

function isResumeRecord(record: { recommenderRole?: string; title?: string }) {
  const value = `${record.title || ''} ${record.recommenderRole || ''}`.toLowerCase()
  return value.includes('resume') || value.includes('cv') || value.includes('professional record')
}

export default async function ResumePage() {
  const [settings, records] = await Promise.all([getSiteSettings(), getRecommendations()])
  const pageIntro = settings?.pageIntros?.resume || {}
  const resumeRecords = records.filter(isResumeRecord)
  const referenceRecords = records.filter((record) => !isResumeRecord(record))
  const primaryResume = resumeRecords[0] || null
  const resumeUrl = primaryResume ? getUploadUrl(primaryResume.pdfLetter) : null

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.resumePage} editLabel="resume page intro">
        <section className="section-heading section-heading-wide page-mast resume-mast">
          <div>
            <div className="panel-eyebrow">{pageIntro.label || '05'}</div>
            <h1>{pageIntro.title || 'Resume'}</h1>
          </div>
          <div className="mast-side">
            {pageIntro.intro ? <p className="section-summary">{pageIntro.intro}</p> : null}
            {resumeUrl ? (
              <a className="primary-button" href={resumeUrl} rel="noreferrer" target="_blank">
                Open PDF
              </a>
            ) : null}
          </div>
        </section>
      </EditableRegion>

      <div className="resume-grid">
        <EditableRegion editHref={primaryResume ? adminLinks.recommendations(primaryResume.slug) : adminLinks.resumePage} editLabel="resume record">
          <section className="content-section resume-card">
            <div className="panel-eyebrow">Professional record</div>
            <h2>Resume PDF</h2>
            <p className="section-summary">
              {primaryResume?.excerpt ||
                'A concise PDF summary of selected projects, research systems work, applied machine-learning studies, and technical writing.'}
            </p>
            {primaryResume?.context ? <p>{primaryResume.context}</p> : null}
            <div className="spotlight-actions">
              {resumeUrl ? (
                <a className="primary-button" href={resumeUrl} rel="noreferrer" target="_blank">
                  View resume
                </a>
              ) : null}
              <Link className="secondary-button" href="/projects/">
                View work
              </Link>
            </div>
          </section>
        </EditableRegion>

        <aside className="resume-side-panel">
          <section className="entry-rail-panel">
            <div className="panel-eyebrow">What this covers</div>
            <div className="resume-signal-list">
              <p>Voice agents, structured function calling, and controlled agentic workflows.</p>
              <p>RAG, predictive modeling, computer vision, evaluation, and error analysis.</p>
              <p>Product design, People Operations automation, and creative systems engineering.</p>
            </div>
          </section>

          <section className="entry-rail-panel">
            <div className="panel-eyebrow">Related pages</div>
            <div className="resource-list">
              <Link className="resource-item" href="/projects/">
                Projects
              </Link>
              <Link className="resource-item" href="/writing/">
                Methods
              </Link>
              <Link className="resource-item" href="/about/">
                About
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <EditableRegion editHref="/admin/#/collections/recommendations" editLabel="reference materials">
        <section className="content-section reference-section">
          <div className="section-heading">
            <div className="panel-eyebrow">References</div>
            <h2>References</h2>
            <p className="section-summary">
              Published recommendation letters and professional reference documents appear here.
            </p>
          </div>

          {referenceRecords.length ? (
            <div className="stacked-list recommendation-list">
              {referenceRecords.map((record) => {
                const pdfUrl = getUploadUrl(record.pdfLetter)

                return (
                  <article className="stacked-item quiet-card" key={record.slug}>
                    <div>
                      <strong>{record.title}</strong>
                      <p>{record.excerpt || record.context}</p>
                      <small>
                        {record.recommenderName}
                        {record.recommenderRole ? ` · ${record.recommenderRole}` : ''}
                      </small>
                    </div>
                    {pdfUrl ? (
                      <a href={pdfUrl} rel="noreferrer" target="_blank">
                        Open PDF
                      </a>
                    ) : (
                      <span>Reference note</span>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <article className="stacked-item quiet-card">
              <div>
                <strong>Reference letters are available on request</strong>
                <p>Contact Neerav for the appropriate professional reference.</p>
              </div>
              <span>Optional</span>
            </article>
          )}
        </section>
      </EditableRegion>
    </div>
  )
}
