import type { PortfolioKeyword } from '@/lib/types'

type ProjectKeywordsProps = {
  keywords?: PortfolioKeyword[]
}

const keywordKindLabel: Record<PortfolioKeyword['kind'], string> = {
  industry: 'Industry',
  system: 'System',
  evaluation: 'Evaluation',
  stack: 'Stack',
}

export function ProjectKeywords({ keywords = [] }: ProjectKeywordsProps) {
  if (!keywords.length) return null

  return (
    <ul className="project-keywords" aria-label="Industry, system, evaluation, and technology keywords">
      {keywords.slice(0, 6).map((keyword) => (
        <li data-kind={keyword.kind} key={`${keyword.kind}-${keyword.label}`}>
          <span>{keywordKindLabel[keyword.kind]}</span>
          <strong>{keyword.label}</strong>
        </li>
      ))}
    </ul>
  )
}
