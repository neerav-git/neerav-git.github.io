// Renders the design boards (remotion/designed/Boards.tsx) to plans/boards/<id>.png and a
// contact sheet of them all. Usage: node scripts/render-boards.mjs [id-prefix]
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";
import { browserExecutable } from "./lib/browser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prefix = process.argv[2] ?? "";
const outDir = path.join(root, "plans", "boards");
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "remotion", "index.ts"), publicDir: path.join(root, "public"), symlinkPublicDir: true });
const common = { serveUrl, browserExecutable: browserExecutable(), timeoutInMilliseconds: 120000, logLevel: "warn" };
const comps = (await getCompositions(serveUrl, common)).filter((c) => c.id.startsWith(`board-${prefix}`));
const files = [];
for (const composition of comps) {
  const output = path.join(outDir, `${composition.id.slice("board-".length)}.png`);
  await renderStill({ ...common, composition, output, frame: 0, imageFormat: "png" });
  files.push(output);
  console.log(path.relative(root, output));
}

// Contact sheet: two boards per row at half size.
if (files.length) {
  const cols = 2;
  const rows = Math.ceil(files.length / cols);
  const inputs = files.flatMap((f) => ["-i", f]);
  const pad = files.length % cols ? `;color=c=black:s=960x540[blank]` : "";
  const cells = files.map((_, i) => `[${i}:v]scale=960:540[c${i}]`).join(";");
  const labels = [...files.map((_, i) => `[c${i}]`), ...(pad ? ["[blank]"] : [])];
  const layout = labels.map((_, i) => `${(i % cols) * 960}_${Math.floor(i / cols) * 540}`).join("|");
  const sheet = path.join(outDir, `${prefix || "all"}-sheet.png`);
  const graph = `${cells}${pad};${labels.join("")}xstack=inputs=${labels.length}:layout=${layout}`;
  const r = spawnSync(ffmpegPath, ["-v", "error", "-y", ...inputs, "-filter_complex", graph, "-frames:v", "1", sheet], { stdio: "inherit" });
  if (r.status === 0) console.log(path.relative(root, sheet), `(${rows} rows)`);
}
