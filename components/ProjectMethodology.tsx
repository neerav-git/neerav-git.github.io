import type { ProjectRecord } from '@/lib/types'

type ProjectMethodologyProps = {
  project: Pick<ProjectRecord, 'approach' | 'methodology' | 'output'>
}

export function ProjectMethodology({ project }: ProjectMethodologyProps) {
  const items = [
    { label: 'Build', value: project.approach },
    { label: 'Evidence', value: project.methodology?.evaluation },
    { label: 'Delivered', value: project.output },
    { label: 'Scope', value: project.methodology?.boundary },
  ].filter((item) => item.value)

  if (!items.length) {
    return null
  }

  return (
    <details className="project-methodology" id="methodology">
      <summary>Build, evidence, and scope</summary>
      <div className="project-methodology-body">
        {project.methodology?.standards?.length ? (
          <ul aria-label="Methods and engineering controls" className="method-standard-list">
            {project.methodology.standards.map((standard) => <li key={standard}>{standard}</li>)}
          </ul>
        ) : null}
        <div className="project-methodology-grid">
          {items.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </details>
  )
}
