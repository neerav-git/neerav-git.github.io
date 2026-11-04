// Records a real command's stdout with per-line timing for the Terminal scene.
// Usage: node scripts/capture-terminal.mjs <slug> <name> <cwd> <command...>
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const [slug, name, cwd, ...command] = process.argv.slice(2);
const started = performance.now();
const lines = [];
let buffer = "";
const child = spawn(command[0], command.slice(1), { cwd, env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" } });
child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  let i;
  while ((i = buffer.indexOf("\n")) >= 0) {
    lines.push({ text: buffer.slice(0, i), ms: Math.round(performance.now() - started) });
    buffer = buffer.slice(i + 1);
  }
});
const code = await new Promise((resolve) => child.on("close", resolve));
if (buffer) lines.push({ text: buffer, ms: Math.round(performance.now() - started) });
const dir = path.join(root, "projects", slug, "captures", "terminal");
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, `${name}.json`), `${JSON.stringify({ command: command.join(" "), cwd: path.basename(cwd), exitCode: code, recordedAt: new Date().toISOString(), lines }, null, 2)}\n`);
console.log(`${name}: exit ${code}, ${lines.length} lines in ${lines.at(-1)?.ms} ms`);
