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
    definition: 'The primary journey and failure states have deterministic test evidence; clinical deployment remains outside the prototype scope.',
    label: 'Tested prototype',
  },
  'active-development': {
    definition: 'The playable system is under ongoing interaction, visual, multiplayer, and deployment review.',
    label: 'Active development',
  },
  'published-work': {
    definition: 'The linked notebooks document the completed experiment and its reported evaluation.',
    label: 'Research study',
  },
  'peer-reviewed-publication': {
    definition: 'The research method and findings were published in peer-reviewed conference proceedings.',
    label: 'Peer-reviewed paper',
  },
  'research-prototype': {
    definition: 'The repository implements the experiment; linked research records supply the reported evaluation result.',
    label: 'Research prototype',
  },
} as const

export function getProjectStatus(status?: string) {
  if (status && status in projectStatus) {
    return projectStatus[status as keyof typeof projectStatus]
  }

  return {
    definition: 'The case study identifies its implementation, evidence, result, and current limit.',
    label: status?.replace(/-/g, ' ') || 'Case study',
  }
}
