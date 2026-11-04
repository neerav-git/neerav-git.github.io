# Homeward — film script

**Runtime target:** 75–80 s · **Voice:** Kokoro `af_heart`, approved tuning, one sentence per synthesis
**Journey:** Alex Morgan, a fictional patient in Homeward's seeded demo, from discharge note to a saved, approved reminder.
**Shot list:** `edit/shots.md` (generated with exact in/out times from `scripts/plan-film.mjs`).

## Evidence used

| On screen | Source |
|---|---|
| Every app shot | Homeward at HEAD `5b05a6a`, seeded demo, reset via `POST /api/demo/reset` before each take; recorded by `capture/journeys/homeward.mjs` |
| Discharge note text | `server/fixtures.js` (Alex Morgan's four sections, quoted verbatim) |
| `npm run eval` terminal | `captures/terminal/eval.json`: real stdout with real timings, 32/32 checks |
| "59 backend tests", "4 interface journeys" | `captures/terminal/test.json`: `npm test` run on the same HEAD |
| Architecture diagram | Homeward README and server code: React UI → Express API → role router → four specialists → server validation → SQLite |

Not claimed: clinician involvement (the care team is a local demo operator) or live-agent runs.

## Structure

| Beat | Time | Picture | Narration |
|---|---|---|---|
| Cold open | 0–3.5 s | A cited answer's chip is clicked; the exact source passage opens in place | — |
| Sting | ~2 s | HeartPulse mark, "homeward." wordmark, tagline | — |
| Problem | ~7 s | Alex's real discharge note; the lab section is highlighted, "No test named" / "No date given" | 0 |
| Journey (Plan → Source → Ask → Help → Approve → Record) | ~37 s | Overview, View source, source search, Need help, care-team reply, approval gate, lost response and safe retry, agent activity | 1–8 |
| Under the hood | ~15 s | Agent team panel → animated request path with server validation checks → `npm run eval` → the same report in the app | 9–10 |
| Result | ~5 s | Alex's plan: reminder saved once, question still open, every step linked to its source | 11 |
| End card | 3.7 s | Homeward · impact line · Neerav Chaudhary · neerav-git.github.io/projects/homeward | — |

## Narration

0. Discharge instructions arrive when patients are exhausted, and one unclear line can stall recovery.
1. Homeward turns the saved record into a plan Alex can follow.
2. View source opens the exact sentence behind each step.
3. Alex asks what paperwork to bring, and source search answers with the cited passage.
4. The lab instruction names no test or date, so Alex asks for help.
5. The care team replies, and the task stays open until the details are confirmed.
6. A reminder waits for Alex's approval.
7. When the response is lost, Retry safely returns the original receipt, so no second reminder appears.
8. The agent activity log records every step.
9. Four role-scoped specialists select references, and the server validates patient, record version, and approval.
10. All 32 guardrail checks pass, alongside 59 backend tests and four interface journeys.
11. Uncertainty stays visible, and every instruction keeps its source.

## Sync points (action lands on the word, ±150 ms)

View source → "opens" · Send → "bring" · cited answer → "answers" · Need help → "asks" · response saved → "stays" · approval dialog → "waits" · timeout → "lost" · Retry safely → "Retry" · receipt → "original" · Agent activity → "activity" · validation checks → "patient", "version", "approval" · final eval line → "pass".
