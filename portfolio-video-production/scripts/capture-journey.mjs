// Records one take of a product journey: node scripts/capture-journey.mjs <slug> [--take N] [--only chapter]
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch, Recorder } from "../capture/director.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const slug = process.argv[2];
const flag = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const take = Number(flag("take", 1));
const only = flag("only", null)?.split(",");

const journey = (await import(`../capture/journeys/${slug}.mjs`)).default;
const outDir = path.join(root, "projects", slug, "captures", "journey", `take-${String(take).padStart(2, "0")}`);
console.log(`Capturing ${slug} take ${take} → ${path.relative(root, outDir)}`);

const session = await launch({ url: journey.url, seed: take * 7919, reset: journey.reset?.bind(journey), hideText: journey.hideText });
const recorder = new Recorder(session, outDir, { start: journey.start });
const summary = [];
try {
  for (const chapter of journey.chapters) {
    if (only && !only.includes(chapter.name)) continue;
    summary.push(await recorder.chapter(chapter.name, (rec) => chapter.run(rec, session.page)));
  }
} finally {
  await session.browser.close();
}
await writeFile(path.join(outDir, "take.json"), `${JSON.stringify({
  slug, take, capturedAt: new Date().toISOString(), url: journey.url,
  chapters: summary.map(({ chapter, frames, seconds, captureWallSeconds }) => ({ chapter, frames, seconds, captureWallSeconds })),
}, null, 2)}\n`);
