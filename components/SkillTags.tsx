type SkillTagsProps = {
  compact?: boolean
  label?: string
  skills?: string[]
}

export function SkillTags({ compact = false, label = 'Skills applied', skills = [] }: SkillTagsProps) {
  const visible = skills.filter(Boolean).slice(0, compact ? 4 : 7)
  if (!visible.length) return null

  return (
    <div className={`skill-tags${compact ? ' skill-tags--compact' : ''}`}>
      <span className="skill-tags-label">{label}</span>
      <ul aria-label={label}>
        {visible.map((skill) => <li key={skill}>{skill}</li>)}
      </ul>
    </div>
  )
}
