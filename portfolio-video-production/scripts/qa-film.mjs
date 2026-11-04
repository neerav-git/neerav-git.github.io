// Runs the strict QA pass on a rendered film: node scripts/qa-film.mjs <slug> [video]
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [slug, video] = process.argv.slice(2);
const r = spawnSync("python3", ["-I", path.join(root, "qa", "tools", "qa_film.py"), root, slug, ...(video ? [video] : [])], { stdio: "inherit" });
process.exit(r.status ?? 1);
