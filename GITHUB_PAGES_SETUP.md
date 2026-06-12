# GitHub Pages Portfolio Setup

## What this version does

- Runs entirely as a static GitHub Pages site.
- Stores editable content in `content/**/*.json`.
- Uses `/admin/` as a browser CMS for editing text, links, images, PDFs, and section structure.
- Publishes uploads under `public/uploads/`.
- Refreshes README-based project content during the GitHub Actions build.

## Editing model

- Public pages stay static and fast.
- Add `?edit=1` to any page URL to reveal edit chips.
- Click a chip to jump into the matching CMS entry.
- Actual writes still require GitHub CMS login.

Example:

- `https://neerav-git.github.io/projects/?edit=1`
- `https://neerav-git.github.io/about/?edit=1`

## GitHub Pages settings

1. Push this code to the `main` branch of `neerav-git.github.io`.
2. In GitHub:
   - open `Settings`
   - open `Pages`
   - set `Source` to `GitHub Actions`
3. The workflow in `.github/workflows/pages.yml` will build and deploy automatically.

## CMS login setup

The site already includes Decap CMS at `/admin/`, but GitHub login requires an OAuth proxy.

This repo now includes a ready-to-deploy proxy in `cms-auth-proxy/`.

You still need:

1. A GitHub OAuth app.
2. A Vercel deployment for `cms-auth-proxy/`.
3. The real OAuth values added in Vercel.

Then update `public/admin/config.yml` with:

- `base_url`
- `auth_endpoint: /api/auth`

## GitHub sync

Project repo data is refreshed by `scripts/sync-github.mjs`.

Current target projects:

- `content/projects/refract-ai.json`
- `content/projects/alzheimers-disease-research.json`

During each Pages build, the workflow:

1. reads those project files
2. fetches repo metadata and README content
3. writes `content/generated/github-cache.json`
4. builds the site with the refreshed cache

If a sync fails, the last cache stays in place.

## Uploads

Uploads are repo-backed by default.

- images: `public/uploads/...`
- PDFs/files: `public/uploads/...`

That means GitHub Pages serves them directly after publish.

S3 is not required for this setup.

## Notes on limitations

- The site is static, so there is no server-side admin session on the public pages.
- Edit chips are a convenience layer, not an auth layer.
- The real protection is the CMS GitHub login and repo permissions.
