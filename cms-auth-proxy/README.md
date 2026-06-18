# CMS Auth Proxy

This is a small Vercel-ready OAuth proxy for the portfolio CMS.

It exists because the public site is deployed on GitHub Pages, while Decap CMS with the GitHub backend still needs a server-side OAuth exchange.

## Deploy target

Deploy this folder as a separate Vercel project.

Recommended Vercel settings:

- Framework preset: `Other`
- Root directory: `cms-auth-proxy`
- No custom build command needed

## Required environment variables

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `PROXY_BASE_URL`
- `SITE_URL`
- `ALLOWED_ORIGINS`
- `OPENAI_API_KEY`

Suggested values:

- `PROXY_BASE_URL=https://YOUR-PROJECT.vercel.app`
- `SITE_URL=https://neerav-git.github.io`
- `ALLOWED_ORIGINS=https://neerav-git.github.io`

Optional:

- `GITHUB_REPO=neerav-git/neerav-git.github.io`
- `OPENAI_WRITING_MODEL=gpt-5.5`

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

## Draft Lab

The `/api/write` endpoint powers the admin-side Draft Lab inside Decap CMS.

- It uses the GitHub login token already present in the CMS session.
- It verifies that the signed-in user can access `GITHUB_REPO` before generating text.
- It supports `projects`, `writing`, and `archive` entries.
- It returns draft text only. Nothing is committed, saved, or published automatically.
