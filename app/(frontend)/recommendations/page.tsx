import { EditableRegion } from '@/components/EditableRegion'
import { getUploadUrl } from '@/lib/assets'
import { adminLinks } from '@/lib/admin'
import { getRecommendations, getSiteSettings } from '@/lib/content'

export default async function RecommendationsPage() {
  const [settings, letters] = await Promise.all([getSiteSettings(), getRecommendations()])
  const pageIntro = settings?.pageIntros?.recommendations || {}

  return (
    <div className="page-flow">
      <EditableRegion editHref={adminLinks.lettersPage} editLabel="letters page intro">
        <section className="section-heading subdued-heading page-mast">
          <div>
            <div className="panel-eyebrow">{pageIntro.label || '06'}</div>
            <h1>{pageIntro.title || 'Recommendations'}</h1>
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
              <strong>No letters published</strong>
              <p>Formal letters and reference documents will appear here when they are included.</p>
              <small>The section remains intentionally compact and secondary to the main project and writing records.</small>
            </div>
            <span>References</span>
          </article>
        </EditableRegion>
      )}
    </div>
  )
}
