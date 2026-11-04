// One film end to end from an existing capture take and narration:
// plan → mix → render → QA. Usage: node scripts/film.mjs <slug>
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
for (const step of ["plan-film", "mix-audio", "render-film", "qa-film"]) {
  console.log(`\n▶ ${step} ${slug}`);
  const r = spawnSync("node", [path.join(root, "scripts", `${step}.mjs`), slug], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
