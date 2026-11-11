/* eslint-disable @next/next/no-img-element */
import { EditableRegion } from '@/components/EditableRegion'
import { PortfolioDeskTabs } from '@/components/PortfolioDeskTabs'
import { adminLinks } from '@/lib/admin'
import { getUploadUrl } from '@/lib/assets'
import { getHomePageData, getRecommendations } from '@/lib/content'

function isResumeRecord(record: { recommenderRole?: string; title?: string }) {
  const value = `${record.title || ''} ${record.recommenderRole || ''}`.toLowerCase()
  return value.includes('resume') || value.includes('cv') || value.includes('professional record')
}

export default async function HomePage() {
  const [{ home, productProjects, studyProjects }, records] = await Promise.all([getHomePageData(), getRecommendations()])
  const resume = records.find(isResumeRecord) || null
  const resumeUrl = resume ? getUploadUrl(resume.pdfLetter) : null

  return (
    <div className="page-flow product-home">
      <EditableRegion editHref={adminLinks.home} editLabel="home page hero">
        <section className="home-intro" id="glance">
          <div className="home-intro-copy">
            <p>{home?.heroBody}</p>
            {resumeUrl ? (
              <div className="home-intro-actions" id="resume-pdf">
                <a className="home-resume-link" href={resumeUrl} rel="noreferrer" target="_blank">
                  Résumé PDF <span aria-hidden="true">↗</span>
                </a>
              </div>
            ) : null}
          </div>
        </section>
      </EditableRegion>

      <EditableRegion editHref={adminLinks.home} editLabel="portfolio sections">
        <div id="products-and-systems">
          <span aria-hidden="true" id="ml-ai-studies" />
          <PortfolioDeskTabs productProjects={productProjects} studyProjects={studyProjects} />
        </div>
      </EditableRegion>
    </div>
  )
}
