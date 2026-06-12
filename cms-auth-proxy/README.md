# CMS Auth Proxy

This is a small Vercel-ready OAuth proxy for the portfolio CMS.

It exists because the public site is deployed on GitHub Pages, while Decap CMS with the GitHub backend still needs a server-side OAuth exchange.

## Deploy target

Deploy this folder as a separate Vercel project.

Recommended Vercel settings:

- Framework preset: `Other`
- Root directory: `cms-auth-proxy`

## Required environment variables

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `PROXY_BASE_URL`
- `SITE_URL`
- `ALLOWED_ORIGINS`

Suggested values:

- `PROXY_BASE_URL=https://YOUR-PROJECT.vercel.app`
- `SITE_URL=https://neerav-git.github.io`
- `ALLOWED_ORIGINS=https://neerav-git.github.io`

## GitHub OAuth App

Create a GitHub OAuth app with:

- Homepage URL: `https://neerav-git.github.io`
- Authorization callback URL: `https://YOUR-PROJECT.vercel.app/api/callback`

## Then update the site CMS config

In `public/admin/config.yml`, set:

```yml
base_url: https://YOUR-PROJECT.vercel.app
auth_endpoint: /api/auth
```
