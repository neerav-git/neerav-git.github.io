import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// Remotion's bundled chrome-headless-shell stalls on macOS 14 before the root component
// loads; Playwright's headless shell (already installed for capture) renders correctly.
export function browserExecutable() {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const cache = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  if (!existsSync(cache)) return undefined;
  const dirs = readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const d of dirs) {
    for (const rel of ["chrome-mac/headless_shell", "chrome-headless-shell-mac-arm64/chrome-headless-shell"]) {
      const file = path.join(cache, d, rel);
      if (existsSync(file)) return file;
    }
  }
  return undefined;
}
