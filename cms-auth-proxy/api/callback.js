import { getConfig, parseState } from './_shared.js'

async function exchangeCodeForToken({ clientId, clientSecret, code, redirectUri }) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'portfolio-cms-auth-proxy',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()

  if (!payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'GitHub did not return an access token')
  }

  return payload.access_token
}

function renderClosePage({ origin, token, error }) {
  const message = error
    ? `authorization:github:error:${JSON.stringify({ error })}`
    : `authorization:github:success:${JSON.stringify({ token, provider: 'github' })}`

  const targetOrigin = JSON.stringify(origin || '*')
  const payload = JSON.stringify(message)

  return `<!doctype html>
<html>
  <body>
    <script>
      (function () {
        var targetOrigin = ${targetOrigin};
        var message = ${payload};

        function finish() {
          if (window.opener) {
            window.opener.postMessage(message, targetOrigin);
          }
          window.close();
        }

        finish();
        setTimeout(finish, 200);
      })();
    </script>
  </body>
</html>`
}

export default async function handler(req, res) {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : ''
    const state = typeof req.query.state === 'string' ? req.query.state : ''

    if (!code || !state) {
      throw new Error('Missing OAuth code or state')
    }

    const config = getConfig()
    const callbackBase = process.env.PROXY_BASE_URL || `https://${req.headers.host}`
    const statePayload = parseState(state)
    const token = await exchangeCodeForToken({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      redirectUri: `${callbackBase}/api/callback`,
    })

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(renderClosePage({ origin: statePayload.origin, token }))
  } catch (error) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(
      renderClosePage({
        error: error instanceof Error ? error.message : 'Unexpected callback error',
        origin: process.env.SITE_URL || '*',
      }),
    )
  }
}
