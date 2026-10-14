import type { GuideEvent } from './agent.ts'
import type { Knowledge } from './knowledge.ts'
import { candidatesFor } from './tools.ts'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function say(emit: (event: GuideEvent) => void, text: string) {
  for (const word of text.split(/(?<= )/)) {
    emit({ t: 'text', d: word })
    await sleep(25)
  }
}

/** Scripted replies for local development without an API key. They exercise every action the real guide can emit. */
export async function runMockTurn(knowledge: Knowledge, question: string, emit: (event: GuideEvent) => void) {
  const lower = question.toLowerCase()

  if (/\b(hir|role|job|position|fit|recruit)/.test(lower)) {
    const projects = knowledge.targets.filter((target) => /^project\.[^.]+$/.test(target.id)).slice(0, 3)
    await say(emit, 'This is a scripted test reply. Here is a short tour of the most relevant work.')
    emit({
      t: 'action',
      action: { type: 'tour', steps: projects.map((target) => ({ target: target.id, narration: `Step: ${target.label}. In the live guide, this narration explains how the project matches the role.` })) },
    })
    return
  }

  if (/\b(resume|contact|email|github|linkedin|reach)/.test(lower)) {
    const links = knowledge.links.filter((link) => link.id.startsWith('link.contact.') || link.id.startsWith('link.resume.')).map((link) => link.id).slice(0, 4)
    await say(emit, "This is a scripted test reply. I've added the resume and contact links below.")
    emit({ t: 'action', action: { type: 'show', target: 'resume.pdf' } })
    emit({ t: 'action', action: { type: 'links', links } })
    return
  }

  const best = candidatesFor(knowledge.targets, question)[0]
  if (!best) {
    await say(emit, "This is a scripted test reply. I couldn't match that to a section, so try asking about a project by name.")
    return
  }
  await say(emit, `This is a scripted test reply. The closest section is ${best.label}. I've highlighted it on the page.`)
  emit({ t: 'action', action: { type: 'show', target: best.id } })
}
