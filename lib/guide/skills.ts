type DetectableSkill = { label: string; pattern: RegExp; questionPattern?: RegExp }

const detectableSkills: DetectableSkill[] = [
  { label: 'Agentic Workflows', pattern: /\b(?:agentic workflows?|AI agents?|voice AI agent)\b/i, questionPattern: /\b(?:agent|agentic|workflow|tool calling)\b/i },
  { label: 'Harness Engineering', pattern: /\b(?:harness engineering|evaluation harness(?:es)?|evaluations? (?:are|is|were|was|completed|measured))\b/i, questionPattern: /\b(?:evaluation|quality|testing|reliability)\b/i },
  { label: 'Stakeholder Collaboration', pattern: /\b(?:stakeholders?|customers?|clients?|founders?|department leadership|department leaders)\b/i, questionPattern: /\b(?:customers?|clients?|stakeholders?|founders?|direct customer work)\b/i },
  { label: 'AWS', pattern: /\baws\b/i, questionPattern: /\b(?:aws|cloud|deployment|kubernetes)\b/i },
  { label: 'Docker', pattern: /\bdocker\b|\bcontainers?\b/i, questionPattern: /\b(?:docker|containers?|cloud|deployment|kubernetes)\b/i },
  { label: 'Kubernetes', pattern: /\bkubernetes\b/i },
  { label: 'Python', pattern: /\bpython\b/i },
  { label: 'PyTorch', pattern: /\bpytorch\b/i },
  { label: 'LangChain', pattern: /\blangchain\b/i },
  { label: 'Hugging Face', pattern: /\bhugging face\b/i },
  { label: 'TypeScript', pattern: /\btypescript\b/i },
  { label: 'RAG', pattern: /\bRAG\b|retrieval-augmented generation/i, questionPattern: /\bRAG\b|retrieval-augmented generation/i },
  { label: 'FastAPI', pattern: /\bfastapi\b/i },
  { label: 'TensorFlow', pattern: /\btensorflow\b/i },
  { label: 'Keras', pattern: /\bkeras\b/i },
  { label: 'OpenCV', pattern: /\bopencv\b/i },
  { label: 'MCP', pattern: /\bMCP\b|model context protocol/i },
  { label: 'Playwright', pattern: /\bplaywright\b/i },
  { label: 'Deepgram', pattern: /\bdeepgram\b/i },
  { label: 'React Three Fiber', pattern: /\breact three fiber\b/i },
  { label: 'Colyseus', pattern: /\bcolyseus\b/i },
]

const negativeEvidence = /\b(?:clear gap|a gap|doesn't|does not|isn't|is not|not shown|not in|no evidence|has no|without)\b/i

function isPositivelySupported(text: string, skill: DetectableSkill) {
  return text
    .split(/(?<=[.!?;,])\s+|\s+\bbut\b\s+/i)
    .some((clause) => skill.pattern.test(clause) && !negativeEvidence.test(clause))
}

/** Compact, deterministic response metadata. These labels are UI-only and are never spoken by the guide. */
export function guideFooterSkills(text: string, contextual: string[] = [], question = '', limit = 4) {
  const supported = detectableSkills.filter((skill) => isPositivelySupported(text, skill))
  const questionRelevant = question
    ? supported
        .map((skill, order) => ({ skill, order, at: skill.questionPattern ? question.search(skill.questionPattern) : -1 }))
        .filter(({ at }) => at >= 0)
        .sort((a, b) => a.at - b.at || a.order - b.order)
        .map(({ skill }) => skill.label)
    : []
  const mentioned = supported.map(({ label }) => label)
  return [...new Set([...questionRelevant, ...contextual, ...mentioned])].slice(0, limit)
}
