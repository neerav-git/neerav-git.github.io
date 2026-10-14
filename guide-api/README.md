# Portfolio guide API

A Cloudflare Worker behind the "Ask the guide" panel on the portfolio. It holds the Anthropic key, answers with Claude Haiku 5.5 from the portfolio's own content, and lets the page move only to registered targets.

- **Knowledge**: `npm run guide:knowledge` (run automatically by the site build) writes `public/guide/knowledge.json` and `public/guide/targets.json` from `content/`, `docs/work-records/`, and the resume PDF. The Worker reads the published copy, so a site deploy updates what the guide knows.
- **Navigation**: the model can only call `show_on_page`, `start_tour`, and `offer_links` with ids from the registry. Unknown ids return the closest candidates; one page per answer; tours are 2–4 steps.
- **Cost controls**: origin allowlist, 20 turns per visitor per 10 minutes, and a daily spend cap (`DAILY_BUDGET_USD`, default $1) tracked from the API's own usage numbers. Expect about $0.01 for a visitor's first question (cache write) and well under $0.001 for each follow-up.
- **Voice**: none of it touches this API. Speech input uses the browser's recognizer and speech output runs Kokoro in the visitor's browser (`public/guide/tts-worker.js`).

## Local development

```sh
cd guide-api && npm install
cp .dev.vars.example .dev.vars        # GUIDE_MOCK=1 gives scripted replies, no key needed
npm run dev                           # http://127.0.0.1:8787
# in the repo root
echo 'NEXT_PUBLIC_GUIDE_API_URL=http://127.0.0.1:8787' > .env.local
npm run dev                           # http://localhost:3000
```

To use the real model locally, set `ANTHROPIC_API_KEY` in `.dev.vars` and remove `GUIDE_MOCK`.

## Checks

```sh
npm test                 # registry rules: valid targets, candidates, one page per answer, tours, links
npm run typecheck
node eval/run.mjs        # 12 scripted conversations against a running Worker (~$0.03 per run on the real model)
```

## Going live

1. **Anthropic**: create an API key at console.anthropic.com, add billing, and set a monthly spend limit (for example $10) as a backstop to the Worker's daily cap.
2. **Cloudflare**: create a free account, then `npx wrangler login`.
3. **Deploy**:
   ```sh
   npx wrangler secret put ANTHROPIC_API_KEY
   npm run deploy        # prints https://portfolio-guide-api.<your-subdomain>.workers.dev
   ```
4. **Turn the panel on**: in GitHub → repository Settings → Secrets and variables → Actions → Variables, add `GUIDE_API_URL` with the Worker URL, then re-run the Pages workflow. Without that variable the site builds exactly as before, with no guide.
5. Run `node eval/run.mjs https://portfolio-guide-api.<your-subdomain>.workers.dev https://neerav-git.github.io` and check the answers.

Spend so far today shows up in `npx wrangler tail` as one `turn` log line per question, including `costUsd`.
