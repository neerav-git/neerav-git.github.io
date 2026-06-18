import { generateDraft } from './_writer.js'
import {
  allowCors,
  getConfig,
  handleOptions,
  readJsonBody,
  requireAllowedOrigin,
  verifyGithubRepoAccess,
} from './_shared.js'

function getBearerToken(headerValue) {
  if (!headerValue) {
    throw new Error('Missing Authorization header')
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : headerValue.trim()
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    handleOptions(req, res)
    return
  }

  const config = getConfig()
  const origin = requireAllowedOrigin(req.headers.origin || '', config.originAllowlist, config.siteUrl)
  allowCors(res, origin)

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    if (!config.openAIKey) {
      throw new Error('Missing required environment variable: OPENAI_API_KEY')
    }

    const token = getBearerToken(req.headers.authorization || '')
    await verifyGithubRepoAccess(token, config.githubRepo)

    const body = await readJsonBody(req)

    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body')
    }

    const collection = typeof body.collection === 'string' ? body.collection : ''

    if (!['projects', 'writing', 'archive'].includes(collection)) {
      throw new Error('Draft generation currently supports projects, writing, and archive entries only')
    }

    const payload = {
      brief: typeof body.brief === 'string' ? body.brief : '',
      collection,
      entry: typeof body.entry === 'string' ? body.entry : '',
      fields: body.fields && typeof body.fields === 'object' ? body.fields : {},
      route: body.route && typeof body.route === 'object' ? body.route : {},
      sourceNotes: typeof body.sourceNotes === 'string' ? body.sourceNotes : '',
      visibleAssets: Array.isArray(body.visibleAssets) ? body.visibleAssets : [],
    }

    const draft = await generateDraft({
      apiKey: config.openAIKey,
      model: config.openAIWritingModel,
      payload,
    })

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(
      JSON.stringify({
        draft: draft.parsed,
        model: draft.model,
      })
    )
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected writing endpoint error',
      })
    )
  }
}
