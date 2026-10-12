import type { ProjectRecord } from '@/lib/types'

type ProjectMethodologyProps = {
  project: Pick<ProjectRecord, 'approach' | 'methodology' | 'output'>
}

export function ProjectMethodology({ project }: ProjectMethodologyProps) {
  const items = [
    { label: 'Method', value: project.approach },
    { label: 'Validation', value: project.methodology?.evaluation },
    { label: 'Result', value: project.output },
    { label: 'Current limit', value: project.methodology?.boundary },
  ].filter((item) => item.value)

  if (!items.length) {
    return null
  }

  return (
    <section className="project-methodology" id="methodology">
      <header className="project-methodology-header">
        <div>
          <div className="panel-eyebrow">Methodology at a glance</div>
          <h2>How the work was built and judged</h2>
        </div>
        {project.methodology?.standards?.length ? (
          <ul aria-label="Methods and engineering controls" className="method-standard-list">
            {project.methodology.standards.map((standard) => <li key={standard}>{standard}</li>)}
          </ul>
        ) : null}
      </header>
      <div className="project-methodology-grid">
        {items.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <p>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
