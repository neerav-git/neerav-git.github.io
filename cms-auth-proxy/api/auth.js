import { createState, getConfig, handleOptions, requireAllowedOrigin } from './_shared.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    handleOptions(req, res)
    return
  }

  try {
    const config = getConfig()
    const callbackBase = process.env.PROXY_BASE_URL || `https://${req.headers.host}`
    const origin = requireAllowedOrigin(req.query.origin || req.headers.origin || '', config.originAllowlist, config.siteUrl)
    const state = createState({
      origin,
    })

    const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
    authorizeUrl.searchParams.set('client_id', config.clientId)
    authorizeUrl.searchParams.set('redirect_uri', `${callbackBase}/api/callback`)
    authorizeUrl.searchParams.set('scope', config.githubScope)
    authorizeUrl.searchParams.set('state', state)

    res.writeHead(302, {
      Location: authorizeUrl.toString(),
    })
    res.end()
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(error instanceof Error ? error.message : 'Unexpected auth error')
  }
}
