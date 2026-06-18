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
    githubRepo: process.env.GITHUB_REPO || 'neerav-git/neerav-git.github.io',
    openAIKey: process.env.OPENAI_API_KEY || '',
    openAIWritingModel: process.env.OPENAI_WRITING_MODEL || 'gpt-5.5',
    originAllowlist: (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    siteUrl: process.env.SITE_URL || '',
  }
}

export function allowCors(res, requestOrigin = '*') {
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
  res.setHeader('Access-Control-Allow-Origin', requestOrigin)
}

export function handleOptions(req, res) {
  allowCors(res, req.headers.origin || '*')
  res.statusCode = 204
  res.end()
  return true
}

export function requireAllowedOrigin(origin, allowlist, siteUrl) {
  if (origin === 'null') {
    return 'null'
  }

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

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body
  }

  const chunks = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export async function verifyGithubRepoAccess(token, repoFullName) {
  const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'portfolio-cms-auth-proxy',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub verification failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
