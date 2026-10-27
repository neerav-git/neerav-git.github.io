const detectableSkills: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Agentic Workflows', pattern: /\bagentic workflows?\b/i },
  { label: 'Harness Engineering', pattern: /\b(?:harness engineering|evaluation harness(?:es)?)\b/i },
  { label: 'Python', pattern: /\bpython\b/i },
  { label: 'PyTorch', pattern: /\bpytorch\b/i },
  { label: 'LangChain', pattern: /\blangchain\b/i },
  { label: 'Hugging Face', pattern: /\bhugging face\b/i },
  { label: 'TypeScript', pattern: /\btypescript\b/i },
  { label: 'RAG', pattern: /\bRAG\b|retrieval-augmented generation/i },
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

/** Compact, deterministic response metadata. These labels are UI-only and are never spoken by the guide. */
export function guideFooterSkills(text: string, contextual: string[] = [], limit = 4) {
  const mentioned = detectableSkills.filter(({ pattern }) => pattern.test(text)).map(({ label }) => label)
  return [...new Set([...contextual, ...mentioned])].slice(0, limit)
}
