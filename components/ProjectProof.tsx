import type { ProjectRecord } from '@/lib/types'

type ProjectProofProps = {
  className?: string
  compact?: boolean
  project: Pick<ProjectRecord, 'problem' | 'approach' | 'output'>
}

export function ProjectProof({ className, compact = false, project }: ProjectProofProps) {
  const items = [
    { label: 'Problem', value: project.problem },
    { label: 'Approach', value: project.approach },
    { label: 'Output', value: project.output },
  ].filter((item) => typeof item.value === 'string' && item.value.trim())

  if (!items.length) {
    return null
  }

  return (
    <div className={['project-proof-grid', compact ? 'is-compact' : '', className || ''].join(' ').trim()}>
      {items.map((item) => (
        <div className="project-proof-item" key={item.label}>
          <span>{item.label}</span>
          <p>{item.value}</p>
        </div>
      ))}
    </div>
  )
}
