import { createState, getConfig, handleOptions, requireAllowedOrigin } from './_shared.js'

function renderHandshakePage({ authorizeUrl, origin, provider }) {
  return `<!doctype html>
<html>
  <body>
    <script>
      (function () {
        var provider = ${JSON.stringify(provider)};
        var targetOrigin = ${JSON.stringify(origin || '*')};
        var authorizeUrl = ${JSON.stringify(authorizeUrl)};
        var message = 'authorizing:' + provider;

        function handleMessage(event) {
          if (event.origin !== targetOrigin) {
            return;
          }

          if (event.data === message) {
            window.removeEventListener('message', handleMessage, false);
            window.location.assign(authorizeUrl);
          }
        }

        window.addEventListener('message', handleMessage, false);

        if (window.opener) {
          window.opener.postMessage(message, targetOrigin);
        }
      })();
    </script>
  </body>
</html>`
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    handleOptions(req, res)
    return
  }

  try {
    const config = getConfig()
    const callbackBase = process.env.PROXY_BASE_URL || `https://${req.headers.host}`
    const provider = typeof req.query.provider === 'string' ? req.query.provider : 'github'
    const origin = requireAllowedOrigin(req.query.origin || req.headers.origin || '', config.originAllowlist, config.siteUrl)
    const state = createState({
      origin,
    })

    const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
    authorizeUrl.searchParams.set('client_id', config.clientId)
    authorizeUrl.searchParams.set('redirect_uri', `${callbackBase}/api/callback`)
    authorizeUrl.searchParams.set('scope', config.githubScope)
    authorizeUrl.searchParams.set('state', state)
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(
      renderHandshakePage({
        authorizeUrl: authorizeUrl.toString(),
        origin,
        provider,
      }),
    )
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(error instanceof Error ? error.message : 'Unexpected auth error')
  }
}
