const projectStatus = {
  'evaluated-candidate': {
    definition: 'Core workflows have recorded task, voice, tool, safety, groundedness, and recovery evaluations.',
    label: 'Evaluated prototype',
  },
  ongoing: {
    definition: 'The core workflow is implemented; research, product refinement, and validation continue.',
    label: 'Active build',
  },
  'tested-prototype': {
    definition: 'The primary journey and failure states have deterministic test evidence; the product is not deployed in care.',
    label: 'Tested prototype',
  },
  'active-development': {
    definition: 'The playable system is under ongoing interaction, visual, multiplayer, and deployment review.',
    label: 'Active development',
  },
  'published-work': {
    definition: 'The repository and notebook preserve the completed experiment; it is not a clinical system.',
    label: 'Completed study',
  },
} as const

export function getProjectStatus(status?: string) {
  if (status && status in projectStatus) {
    return projectStatus[status as keyof typeof projectStatus]
  }

  return {
    definition: 'The case study states its current evidence and implementation boundary.',
    label: status?.replace(/-/g, ' ') || 'Case study',
  }
}
