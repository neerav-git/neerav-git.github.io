import http from 'node:http'
import { Readable } from 'node:stream'

const host = '127.0.0.1'
const port = 8788
const publishedOrigin = 'https://neerav-git.github.io'
const guideApi = 'https://portfolio-guide-api.neerav-portfolio.workers.dev'
const allowedLocalOrigins = new Set(['http://localhost:3000', 'http://127.0.0.1:3000'])
const allowedPaths = new Set(['/chat', '/telemetry'])

function corsHeaders(origin) {
  if (!allowedLocalOrigins.has(origin || '')) return {}
  return {
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-origin': origin,
    vary: 'origin',
  }
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin
  const cors = corsHeaders(origin)
  const pathname = new URL(request.url || '/', `http://${host}:${port}`).pathname

  if (!cors['access-control-allow-origin']) {
    response.writeHead(403, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'origin_not_allowed' }))
    return
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, cors)
    response.end()
    return
  }

  if (request.method !== 'POST' || !allowedPaths.has(pathname)) {
    response.writeHead(404, { ...cors, 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'not_found' }))
    return
  }

  try {
    const upstream = await fetch(`${guideApi}${pathname}`, {
      body: request,
      duplex: 'half',
      headers: {
        'content-type': request.headers['content-type'] || 'application/json',
        origin: publishedOrigin,
      },
      method: 'POST',
    })

    const headers = { ...cors }
    for (const name of ['content-type', 'retry-after', 'x-guide-request-id']) {
      const value = upstream.headers.get(name)
      if (value) headers[name] = value
    }
    response.writeHead(upstream.status, headers)
    if (upstream.body) Readable.fromWeb(upstream.body).pipe(response)
    else response.end()
  } catch {
    response.writeHead(502, { ...cors, 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'guide_proxy_unavailable' }))
  }
})

server.listen(port, host, () => {
  console.log(`Local portfolio guide bridge: http://${host}:${port}`)
})
