const projectStatus = {
  'evaluated-candidate': {
    definition: 'Core workflows have recorded task, voice, tool, safety, groundedness, recovery, and held-out evaluations.',
    label: 'Evaluated product system',
  },
  ongoing: {
    definition: 'The core workflow is implemented; research, product refinement, and validation continue.',
    label: 'Active build',
  },
  'tested-prototype': {
    definition: 'Patient, care-team, agent-routing, approval, and failure-recovery journeys have recorded deterministic test evidence.',
    label: 'Tested product system',
  },
  'active-development': {
    definition: 'The lounge, shared activities, Dream, realtime protocols, and creative-review system are implemented and continue through visual and deployment refinement.',
    label: 'Playable social world',
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
    definition: 'The repository implements the complete classification and ensemble workflow; linked experiment records supply the reported held-out result.',
    label: 'Notebook research study',
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
