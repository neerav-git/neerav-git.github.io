/** Validates the conversation history the browser sends with each visitor turn. */
export type IncomingMessage = { role: 'user' | 'assistant'; content: string }

const MAX_HISTORY = 12
// These match what the browser client sends (components/PortfolioGuide.tsx): 8,000 for visitor text, 2,000 for guide turns.
const MAX_USER_CHARS = 8000 // room for a pasted job description
const MAX_ASSISTANT_CHARS = 2000
const MAX_TOTAL_CHARS = 24000

export function parseMessages(raw: unknown): IncomingMessage[] | null {
  if (!Array.isArray(raw) || !raw.length) return null
  const messages: IncomingMessage[] = []
  for (const item of raw.slice(-MAX_HISTORY)) {
    const role = item?.role
    const content = typeof item?.content === 'string' ? item.content.trim() : ''
    if ((role !== 'user' && role !== 'assistant') || !content) return null
    if (role === 'user' && content.length > MAX_USER_CHARS) return null
    // Earlier guide answers (with tour narration) are the guide's own words; trim them rather than fail the follow-up.
    messages.push({ role, content: role === 'assistant' ? content.slice(0, MAX_ASSISTANT_CHARS) : content })
  }
  const size = () => messages.reduce((total, message) => total + message.content.length, 0)
  // Drop the oldest turns until the conversation fits, always keeping the visitor's latest message.
  while (messages.length > 1 && size() > MAX_TOTAL_CHARS) messages.shift()
  while (messages[0]?.role === 'assistant') messages.shift()
  return messages.length && messages.at(-1)!.role === 'user' ? messages : null
}
