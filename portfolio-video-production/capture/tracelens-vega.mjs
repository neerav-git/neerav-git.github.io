// Still of the live Vega experiment page in the TraceLens workspace (vega-lab.html: real training
// record, out-of-fold scores and held-out results from /api/vega), for TraceLens beat 12b. The page
// is shot at a 1280 px window, settled after its entrance, with the boxes of its main blocks recorded
// so the edit can pan between them. Serve the workspace with
// `python3 -m tracelens_training.server --port 8781` from the AI Self Explainability repo.
// Usage: node capture/tracelens-vega.mjs
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const URL = `${process.env.TRACELENS_URL || "http://127.0.0.1:8781"}/vega-lab.html`;
const WIDTH = 1280;
const SCALE = 2;
const IDS = ["vega-flow", "vega-training-plot", "vega-training-stats", "vega-heldout", "vega-sources"];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: SCALE });
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForFunction(() => document.querySelectorAll("#vega-training-plot circle").length >= 146, null, { timeout: 20000 });
await page.waitForTimeout(3000);
const geo = await page.evaluate((ids) => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; };
  const out = Object.fromEntries(ids.map((id) => [id, box(document.getElementById(id))]));
  out.title = box(document.querySelector("h1"));
  out.height = document.documentElement.scrollHeight;
  return out;
}, IDS);
await page.screenshot({ path: "public/tracelens/vega-lab.png", fullPage: true });
await writeFile("projects/tracelens/captures/vega/vega.json", `${JSON.stringify({ url: "/vega-lab.html", capturedAt: new Date().toISOString(), width: WIDTH, scale: SCALE, ...geo }, null, 2)}\n`);
console.log(JSON.stringify(geo));
await browser.close();
