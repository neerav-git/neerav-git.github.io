const SYSTEM_PROMPT = `You are a senior editor rewriting technical portfolio content for a serious public-facing site.

Your job is to produce prose that is:
- specific, concrete, and technically credible
- calm, professional, and sincere
- varied in rhythm and sentence length
- free of filler, startup language, and empty abstractions
- free of meta commentary about "the site", "the portfolio", or "this write-up"
- not list-like unless a list is genuinely necessary

Writing rules:
- avoid repetitive paragraph shapes
- avoid generic thesis-sentence openings in every section
- avoid phrases like "this project", "this work", "this section", "the artifact here", unless genuinely needed
- do not explain what the content is trying to do; simply do it
- use evidence from the provided materials
- preserve factual constraints from the source packet
- when an image is suggested, explain what visual role it should play instead of repeating the same diagram everywhere

Return valid JSON only. No markdown fences.`

const SCHEMA_GUIDES = {
  projects: {
    outputShape: {
      overview: '1 paragraph on what changed and why',
      fields: {
        summary: '35-55 word card/detail summary',
        role: '1-2 sentence role line',
      },
      sections: [
        {
          blockType: 'proseSection or callout',
          eyebrow: 'short label',
          title: 'section title',
          description: 'optional short standfirst',
          markdown: '2-4 paragraphs of finished prose',
          context: 'optional closing context line',
          imageSuggestion: 'what kind of image should appear here and why',
        },
      ],
      imagePlan: ['3-6 concise notes on how visuals should be distributed across the entry'],
    },
    instruction: `Rewrite this project entry as a polished technical project narrative.

Requirements:
- the summary must read strongly on cards and at the top of the detail page
- the role line should sound specific and earned
- produce 4 to 6 sections
- use mostly proseSection blocks and at most one callout block
- sections should mix problem framing, implementation detail, and interpretation
- keep project writing concrete and grounded in the supplied material
- vary how sections open; do not make every section a miniature thesis statement
- do not emit figure blocks in the JSON; keep visual guidance in imageSuggestion and imagePlan so the editor can choose images manually`,
  },
  writing: {
    outputShape: {
      overview: '1 paragraph on the editorial approach',
      fields: {
        excerpt: '30-50 word strong excerpt that invites reading',
      },
      sections: [
        {
          blockType: 'proseSection or callout',
          eyebrow: 'short label',
          title: 'section title',
          description: 'optional short standfirst',
          markdown: '2-4 paragraphs of finished prose',
          context: 'optional closing context line',
          imageSuggestion: 'optional image role for this section',
        },
      ],
      imagePlan: ['2-5 concise notes on where images help and where they should not be forced'],
    },
    instruction: `Rewrite this article as an authored essay or note rather than a structured memo.

Requirements:
- the excerpt must sound like the opening tension or core claim, not a generic summary
- produce 4 to 6 sections
- use mostly proseSection blocks and at most one callout block
- avoid metrics unless the source clearly demands them
- use more texture, examples, and argumentative movement
- the writing should feel like it was written by someone who knows the work firsthand
- do not emit figure blocks in the JSON; keep visual guidance in imageSuggestion and imagePlan so the editor can choose images manually`,
  },
  archive: {
    outputShape: {
      overview: '1 paragraph on the record type and emphasis',
      fields: {
        summary: '25-45 word archive summary',
      },
      sections: [
        {
          blockType: 'proseSection or callout',
          eyebrow: 'short label',
          title: 'section title',
          description: 'optional short standfirst',
          markdown: '1-3 paragraphs of documentary prose',
          context: 'optional closing context line',
          imageSuggestion: 'visual role for the archive record',
        },
      ],
      imagePlan: ['2-4 concise notes on documentary/supporting image use'],
    },
    instruction: `Rewrite this archive entry as a supporting technical record.

Requirements:
- keep the tone factual, documentary, and concise
- produce 2 to 4 sections
- use proseSection by default and callout only when a compressed note is useful
- emphasize what this record preserves, clarifies, or documents
- avoid turning the archive entry into a full essay`,
  },
}

function stringifySourcePacket(payload) {
  return JSON.stringify(payload, null, 2)
}

export function buildWritingPrompt(payload) {
  const guide = SCHEMA_GUIDES[payload.collection]

  if (!guide) {
    throw new Error(`Unsupported collection for draft generation: ${payload.collection}`)
  }

  return [
    SYSTEM_PROMPT,
    '',
    guide.instruction,
    '',
    'Return a JSON object with this shape:',
    stringifySourcePacket(guide.outputShape),
    '',
    'Source packet:',
    stringifySourcePacket(payload),
  ].join('\n')
}

function extractTextFromResponse(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  if (Array.isArray(payload?.output)) {
    const parts = []

    payload.output.forEach((item) => {
      if (!Array.isArray(item?.content)) return
      item.content.forEach((content) => {
        if (typeof content?.text === 'string') {
          parts.push(content.text)
        }
      })
    })

    if (parts.length) {
      return parts.join('\n').trim()
    }
  }

  throw new Error('OpenAI response did not include text output')
}

function stripFence(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

export async function generateDraft({ apiKey, model, payload }) {
  const prompt = buildWritingPrompt(payload)
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: 3500,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText} ${errorText}`)
  }

  const json = await response.json()
  const rawText = stripFence(extractTextFromResponse(json))
  const parsed = JSON.parse(rawText)

  return {
    model,
    rawText,
    parsed,
  }
}
