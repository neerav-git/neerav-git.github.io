# Portfolio films: next session

Continue the portfolio films in `portfolio-video-production/` on branch `feature/portfolio-guide`.

Read these first:
1. `portfolio-video-production/HANDOFF.md`, especially **"Relay draft-2 notes (from the user, 2026-10-30) and the plan"**.
2. `portfolio-video-production/edit/films/relay.mjs` and `scripts/mix-audio.mjs`.
3. The reference draft: `projects/relay/reference/relay-v3-draft2-2026-10-30.mp4` and its contact sheet.

## What to do

1. **Make Relay snappier (draft 3).** Draft 2 is "a perfect base". Apply my notes:
   - **Cut the dialogue.** Trim the slow exchanges between Maya and Relay: shorten the tool waits (marked with "⏩ n s cut" chips), close the gaps between sentences, and shorten the meeting reply.
   - **Calm the tool banners.** Stop them overlapping and crowding the screen: one plain-language status at a time, kept clear of the captions.
   - **Narrator a little faster and warmer.** Send me a short A/B sample (speeds 1.0 / 1.06 / 1.1, with and without warm EQ) before re-synthesizing.
   - **Relay Guide as loud as the narrator.** The greeting and replies measured 1–3.5 dB under. Match each utterance's loudness to the narrator's.
2. **Pitch the visual-meaning ideas.** Show me the ranked list in HANDOFF section 5 with a still or two each:
   - push-ins on what matters;
   - the portals merging into Relay;
   - the payoff answering the new hire's three questions;
   - voice-to-action links;
   - diagram thumbnails;
   - concrete security;
   - a day-one recap.

   Build the ones I pick.
3. **Show me draft 3.** Render it at full 1920×1080 (chunked), save it as a reference and show me. On my approval: QA, deliver, commit.
4. **Then the other five scripts.** Ask me once for sign-off on revision 3 (`plans/film-scripts-v3.md`), and produce one film at a time to the Relay standard.

## Hold to these

- **Re-timing.** Only re-time what my notes cover. Leave the problem schematic, the diagrams, the script and the scene order as they are.
- **Evidence:**
  - Real evidence only; never invent numbers or UI.
  - Schematic and illustrative labels on designed visuals.
  - Source chips on external facts.
  - Visible markers on time cuts.
- **Cost:**
  - No paid infrastructure.
  - No new Deepgram sessions without asking. Replay live-01/02/03.
- **Narration:** Kokoro `af_heart`. Speed and warmth change only after I pick from the A/B.
- **Copy:** no "X, not Y" contrasts, no meta talk, no jargon on screen. They/them for Maya and Alex.
- **Rendering:**
  - Chunked renders on this 8 GB Mac. Check `pgrep -fl render-film` first.
  - Delete `renders/relay/parts` before a new master.
  - Show drafts at full resolution.
- **Working style:**
  - Commit with the Co-Authored-By trailer.
  - Keep HANDOFF.md current.
  - Leave site files outside `portfolio-video-production/` alone.
