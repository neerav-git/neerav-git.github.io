function readEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getConfig() {
  return {
    clientId: readEnv('GITHUB_CLIENT_ID'),
    clientSecret: readEnv('GITHUB_CLIENT_SECRET'),
    githubScope: process.env.GITHUB_SCOPE || 'repo',
    originAllowlist: (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    siteUrl: process.env.SITE_URL || '',
  }
}

export function allowCors(res, requestOrigin = '*') {
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Origin', requestOrigin)
}

export function handleOptions(req, res) {
  allowCors(res, req.headers.origin || '*')
  res.statusCode = 204
  res.end()
  return true
}

export function requireAllowedOrigin(origin, allowlist, siteUrl) {
  if (!origin) {
    return siteUrl || ''
  }

  if (!allowlist.length) {
    return origin
  }

  if (allowlist.includes(origin)) {
    return origin
  }

  throw new Error(`Origin not allowed: ${origin}`)
}

export function createState(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

export function parseState(state) {
  const raw = Buffer.from(state, 'base64url').toString('utf8')
  return JSON.parse(raw)
}
