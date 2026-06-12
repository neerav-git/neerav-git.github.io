# Portfolio Rebuild Plan

## 1. Goal

Rebuild the current static portfolio into a dark, editorial, research-first website with:

- an admin-only editing interface inside the site,
- structured sections for projects, writing, research artifacts, and recommendations,
- upload support in every major content area,
- GitHub-driven project import for selected repositories,
- a visual tone that feels thoughtful, meticulous, typewriter-like, and not job-seeking.

This should read as a presentation of work, thinking, and record rather than a resume site.

## 2. Current State

The existing site is a static prototype:

- `index.html` contains the entire homepage structure and styling.
- `article.html` renders article detail pages client-side.
- `articles.js` stores writing content in a hardcoded JavaScript array.

Current limitations:

- No CMS or admin UI.
- No authentication.
- No uploads or asset management.
- No structured content types.
- No GitHub sync.
- No reusable section architecture.
- Homepage tone still leans partially toward a personal/resume site.

Conclusion:

Do not extend the current 3-file architecture. Replace it with an app-based system.

## 3. Product Principles

- The site should foreground work, research, and writing, not availability for jobs.
- Every major section should support attachments, not only plain text.
- Uploads should be first-class, not ad hoc.
- Anything visible on the public site that may need changing later should live in the CMS, not in code.
- As the site owner, you should be able to click into any editable region while logged in and update it without touching source files.
- GitHub import should prefill content but never overwrite curated copy without approval.
- The authoring experience should be good enough that updating the site is easier than avoiding it.
- Public pages should feel calm, serious, and archival.
- Admin workflows should remain simple because this is a single-author system.

## 4. Recommended Architecture

### Application stack

- Frontend and app shell: `Next.js`
- CMS/admin panel: `Payload CMS`
- Database: `PostgreSQL`
- File storage: `S3-compatible storage` or `Supabase Storage`
- Deployment: `Vercel`
- GitHub sync: server-side sync jobs using GitHub API

### Why this stack

- `Payload CMS` gives a real admin UI within the same website.
- It supports authentication, rich content, uploads, relationships, drafts, and versioning.
- `Next.js` gives flexible public routing and strong editorial page rendering.
- This setup is much better aligned with "only I can edit from within the website" than GitHub Pages.

### Access model

- Public site: readable by everyone.
- Admin area: protected route such as `/admin`.
- Authentication: restricted to your account only, ideally via allowlisted login.
- Recommended auth approach: GitHub OAuth restricted to your GitHub identity, with optional backup email login.

### Editability model

- Logged-out users see a clean public site with no editing controls.
- Logged-in admin users can enter an `Edit mode`.
- In `Edit mode`, visible editable regions get hover outlines or edit handles.
- Clicking a heading, description, link block, project card, section label, or footer text should open the correct CMS document or field panel.
- Reordering homepage sections or featured items should be possible through drag-and-drop in the admin UI.

This is important:

Do not treat section headings, intro copy, nav labels, button labels, or footer text as hardcoded theme text. Model them as editable content records.

## 5. Information Architecture

### Public site sections

- `Home`
- `Projects`
- `Writing`
- `Research Archive`
- `About`
- `Recommendations`

### Route structure

- `/`
- `/projects`
- `/projects/[slug]`
- `/writing`
- `/writing/[slug]`
- `/archive`
- `/archive/[slug]`
- `/recommendations`
- `/about`
- `/admin`

### Tone and hierarchy

- `Home` should introduce your thesis and featured work, not pitch you as a candidate.
- `Projects` should behave like case-study entries.
- `Writing` should hold essays, notes, and long-form reflections.
- `Research Archive` should hold supporting artifacts that do not belong in the main writing flow.
- `Recommendations` should stay modest, likely near the bottom navigation or under `About` or `Archive`.

### Global editable site chrome

The following should be editable from the admin and should not be hardcoded:

- site title,
- homepage intro line,
- top navigation labels,
- section names,
- section subheadings,
- footer text,
- external profile links,
- recommendation section label,
- default button text,
- home page ordering of sections,
- featured content selection.

Recommended implementation:

- one `Site Settings` global document,
- one `Navigation` global document or nav fields inside site settings,
- one `Home Page` document with modular sections,
- per-section content references rather than fixed hardcoded labels.

## 6. Section-by-Section Content Model

Every major section should support:

- title,
- summary,
- rich description,
- images,
- links,
- downloadable files,
- related content,
- optional featured status,
- optional ordering and visibility controls.

Every major section should also support:

- editable section label,
- editable subheading,
- editable intro copy,
- editable links and link labels,
- visibility toggle,
- order control within the page.

### A. Home

Purpose:

- Set tone.
- Explain what the site is.
- Surface the most important work.

Editable regions:

- Intro statement
- Secondary description
- Featured projects list
- Featured writing list
- Featured archive items list
- Small trust strip or quiet note about recommendations, if desired
- Editable section name
- Editable section subheading
- Editable featured block labels
- Editable menu labels if home uses local anchor navigation

Uploads allowed:

- hero background texture or image,
- featured section images,
- supporting graphics.

### B. Projects

Purpose:

- Present projects as serious records of work, not as thumbnail portfolio cards only.

Project fields:

- title
- slug
- status
- date or date range
- short summary
- long description
- role
- problem statement
- why it mattered
- methods or technical architecture
- outcomes or findings
- GitHub repo relation
- external links
- tags
- cover image
- image gallery
- downloadable files
- related writing
- related archive entries
- pinned or featured flag
- custom section label if needed on listing pages
- card eyebrow text
- external link label overrides
- visibility and ordering controls

Project subsections on the page:

- Overview
- Context
- Build / Method
- Evidence / Results
- Artifacts
- Related Writing

Each subsection should have:

- editable title,
- optional short intro,
- optional hide/show toggle,
- reorder support if modularized.

Uploads allowed:

- cover image,
- inline images,
- diagrams,
- PDFs,
- slides,
- posters,
- datasets or sample assets if needed,
- external links,
- embedded repo links.

### C. Writing

Purpose:

- Publish essays, research notes, project writeups, and reflective pieces.

Article fields:

- title
- slug
- excerpt
- category
- publish date
- draft/published status
- cover image
- rich body
- tags
- related projects
- related archive entries
- downloadable PDF version if desired
- editable listing label or category display name
- visibility and ordering controls where pinned content is used

Writing subsections:

- Essays
- Project writeups
- Research notes
- Reading notes

These subsection names should be admin-editable taxonomy labels, not hardcoded frontend text.

Uploads allowed:

- hero image,
- inline images,
- figure sets,
- PDF attachments,
- external links,
- citation links,
- downloadable supporting files.

Editor requirements during writing:

- slash-menu style insertions,
- image upload,
- gallery insertion,
- quote block,
- code block,
- citation/reference block,
- repo link card,
- downloadable file block,
- callout block,
- metrics block,
- side note / marginal note block,
- figure with caption.

### D. Research Archive

Purpose:

- Hold supporting materials that are important but not primary homepage content.

Archive item types:

- paper summary,
- poster,
- talk,
- dataset note,
- experimental artifact,
- presentation,
- scanned material,
- media documentation.

Archive fields:

- title
- slug
- type
- summary
- body
- date
- related project
- related writing
- attachments
- links
- preview image
- editable display label
- visibility and ordering controls

Uploads allowed:

- PDFs,
- posters,
- presentation files,
- images,
- screenshots,
- videos if later supported,
- external resources.

### E. Recommendations

Purpose:

- Quietly provide recommendations and supporting trust signals without making them the focus.

Recommendation fields:

- title
- recommender name
- recommender role
- context
- short excerpt
- PDF file
- optional thumbnail
- visibility mode
- section placement priority
- display label override

Display strategy:

- small section,
- subdued styling,
- no hero placement,
- no oversized testimonials treatment.

Uploads allowed:

- PDF letters,
- preview image if desired.

### F. About

Purpose:

- Provide background and framing without turning into a resume page.

Editable regions:

- long-form bio,
- research interests,
- current focus,
- timeline highlights,
- selected affiliations,
- external links.
- section heading,
- section subheading,
- modular content blocks,
- visibility and ordering controls.

Uploads allowed:

- portrait if you want one,
- small personal or contextual images,
- attached documents if needed.

## 7. Shared Block System

To avoid hardcoding each section differently, the site should use reusable content blocks across projects, writing, and archive entries.

Core reusable blocks:

- Rich text block
- Image block
- Gallery block
- PDF/document embed block
- External link card
- GitHub repo card
- Quote block
- Callout block
- Metrics/result block
- Timeline block
- Two-column media/text block
- Citation/reference list block
- Download block
- Related content block

This is the key architectural rule:

Every content type can have its own metadata, but the body content should be assembled from shared blocks so the system stays extensible.

Additional rule:

Page sections themselves should also be modular. That means the homepage, about page, and other editorial pages should be built from configurable modules instead of fixed templates with only text swaps.

Recommended page modules:

- intro module
- featured content module
- text + media module
- project rail module
- writing rail module
- archive rail module
- recommendations teaser module
- quote module
- timeline module
- link list module
- attachments module

## 8. Upload and Asset Architecture

Upload support should be designed as a platform feature, not a per-page hack.

### Central media library

Create a shared media collection with:

- file upload,
- alt text,
- caption,
- credit,
- file type,
- thumbnail/preview,
- tags,
- focal point,
- related content references.

### File categories to support

- image
- PDF
- presentation
- document
- downloadable asset
- external link preview

### Usage rules

- Any project, article, archive item, or recommendation can attach media from the shared library.
- Rich text blocks should also allow direct inline media insertion.
- Attachments should be usable in two ways: inline within content and as a separate artifacts/downloads section.
- Global site settings and page modules should also be able to reference media and attachments where appropriate.

## 9. GitHub Integration Plan

### Initial scope

Support only the two selected repositories first:

- the Alzheimer’s disease repository,
- Refract.

Exact repo slugs can be wired once confirmed.

### What to import

- repo name,
- description,
- README markdown,
- repo homepage link,
- repository URL,
- topics,
- primary language,
- selected README images,
- last updated timestamp.

### Import behavior

- Admin presses `Sync from GitHub` on a project entry, or a scheduled sync runs.
- Imported GitHub content is stored as source material.
- The public page shows curated override fields first.
- README text can prefill sections like `summary`, `overview`, or `artifacts`, but should not replace your edited writing automatically.

### Why this matters

README files are useful raw material, but portfolio pages need curation. The system should assist authorship, not outsource it.

## 10. Authoring Workflow

Recommended workflow:

- Create project or article in admin.
- Upload cover image and attachments.
- Write using the rich block editor.
- Insert project references, citations, media, and downloads from the slash menu.
- Save as draft.
- Preview the public page.
- Publish when ready.

For site-wide editing:

- Log into admin.
- Enter visual `Edit mode` on the public page.
- Click the section name, subheading, description, link list, or card you want to change.
- Update the mapped CMS fields.
- Save and preview changes.
- Publish when ready.

Publishing features to support:

- draft mode,
- publish/unpublish,
- manual ordering,
- featured toggle,
- version history,
- optional scheduled publishing later if useful.

## 11. Visual Direction

### Design mood

- dark,
- monastic,
- archival,
- precise,
- literary,
- typewriter-adjacent,
- restrained rather than flashy.

### Visual system

- background: near-black charcoal, not pure black,
- text: warm white,
- accent: muted steel, parchment, or faded green rather than bright neon,
- navigation: monospaced,
- long-form reading: serif,
- labels and metadata: mono,
- dividers: thin editorial rules,
- texture: subtle grain or paper noise,
- motion: understated page transitions and reveal effects only.

### What to avoid

- startup landing page tropes,
- recruiter CTA language,
- oversized social proof blocks,
- loud gradient blobs,
- generic portfolio grids,
- resume-first navigation.

## 12. Migration Plan

### Phase 1: Architecture and schema

- Create new app scaffold.
- Set up CMS/admin.
- Define collections and media library.
- Define reusable content blocks.
- Define global site settings and modular page-builder schema.
- Create authentication and protected admin access.
- Create admin visual edit mapping for clickable page regions.

### Phase 2: Visual system and core pages

- Build the dark editorial design system.
- Build public routes for home, projects, writing, archive, about, recommendations.
- Build reusable section templates.

### Phase 3: Content migration

- Move current homepage copy into structured settings/content entries.
- Move `articles.js` posts into article entries.
- Replace generic repo links with structured project records.

### Phase 4: GitHub sync

- Add GitHub credentials securely.
- Implement repo sync for the two allowed repositories.
- Parse README content and images.
- Map imported content into project drafts or source snapshots.

### Phase 5: Editorial polish

- Tune page hierarchy.
- Add attachment panels and download presentation.
- Adjust recommendation placement.
- Improve typography, spacing, and editorial detail.

### Phase 6: Deployment and maintenance

- Deploy to Vercel.
- Connect storage and database.
- Test admin auth and upload flows.
- Verify content editing from the live site.

## 13. Non-Negotiable Requirements

- Every major content type supports uploads and attachments.
- Every major content type supports links and rich descriptions.
- Writing supports inline media and structured inserts from a menu.
- Section names, subheadings, descriptions, links, labels, and featured content are editable through the admin.
- Public-facing text should not be trapped in code unless it is truly permanent UI infrastructure.
- The site should support modular page composition rather than only fixed templates.
- Public-facing content is curated and research-first.
- Recommendations exist but remain visually secondary.
- GitHub import is selective and editorially controlled.
- The site is easy to update without touching source code.

## 14. Recommended Next Build Step

Implement the rebuild in this order:

1. Replace the static site with a `Next.js + Payload CMS` app.
2. Stand up the media library and content schemas first.
3. Build the admin experience before styling every public page.
4. Import current writing and create the first two GitHub-synced project entries.
5. Then polish the design once the content architecture is real.

This order matters because the content model and upload system are the foundation. If those are wrong, the design layer will have to be rebuilt later.
