import { spawnSync } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const requested = process.argv[2] || "relay";
const onlyScene = process.argv[3] || null;

async function glide(page, distance, steps = 24, pause = 40) {
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, distance / steps);
    await page.waitForTimeout(pause);
  }
}

const products = {
  relay: {
    url: process.env.RELAY_URL || "http://127.0.0.1:5173",
    scenes: [
      {
        name: "workspace-overview",
        run: async (page) => {
          await page.waitForTimeout(1700);
          await page.getByRole("button", { name: "2 open support cases" }).hover();
          await page.waitForTimeout(1300);
        },
      },
      {
        name: "document-grounding",
        run: async (page) => {
          await page.waitForTimeout(800);
          await page.getByRole("button", { name: "Documents", exact: true }).click();
          await page.waitForTimeout(1500);
          await page.getByRole("button", { name: /Federal and California withholding forms/ }).first().hover();
          await page.waitForTimeout(1800);
        },
      },
      {
        name: "support-review",
        run: async (page) => {
          await page.waitForTimeout(700);
          await page.getByRole("button", { name: "Help & Support", exact: true }).click();
          await page.waitForTimeout(1400);
          await page.getByRole("button", { name: /Unable to sign in to corporate account/ }).click();
          await page.waitForTimeout(900);
          await page.getByRole("button", { name: "Review reply" }).hover();
          await page.waitForTimeout(1500);
        },
      },
      {
        name: "operations-trace",
        run: async (page) => {
          await page.waitForTimeout(700);
          await page.getByRole("button", { name: "IT Operations", exact: true }).click();
          await page.waitForTimeout(1400);
          await page.getByText("Workflow chronology", { exact: true }).scrollIntoViewIfNeeded();
          await page.waitForTimeout(1800);
        },
      },
      {
        name: "evaluation-dashboard",
        run: async (page) => {
          await page.waitForTimeout(700);
          await page.getByRole("button", { name: "Agent evaluation", exact: true }).click();
          await page.waitForTimeout(1300);
          await page.getByRole("heading", { name: "Tool-call accuracy", exact: true }).scrollIntoViewIfNeeded();
          await page.waitForTimeout(1200);
          await page.getByText("Changes the evaluation drove", { exact: true }).scrollIntoViewIfNeeded();
          await page.waitForTimeout(1400);
        },
      },
    ],
  },
  homeward: {
    url: process.env.HOMEWARD_URL || "http://127.0.0.1:5173",
    resetPath: "/api/demo/reset",
    scenes: [
      {
        name: "recovery-overview",
        run: async (page) => {
          await page.mouse.move(700, 420);
          await page.waitForTimeout(2200);
          await glide(page, 420, 36, 45);
          await page.waitForTimeout(1600);
          await page.getByText("Arrange your follow-up visit", { exact: true }).first().hover();
          await page.waitForTimeout(2200);
          await glide(page, -420, 36, 45);
          await page.waitForTimeout(1400);
        },
      },
      {
        name: "source-linking",
        run: async (page) => {
          await page.waitForTimeout(1600);
          await page.getByRole("button", { name: "View source", exact: true }).first().click();
          await page.waitForTimeout(4200);
        },
      },
      {
        name: "source-search",
        run: async (page) => {
          await page.waitForTimeout(1200);
          await page.getByRole("button", { name: "What paperwork should I bring?", exact: true }).click();
          await page.waitForTimeout(5200);
        },
      },
      {
        name: "review-workflow",
        run: async (page) => {
          await page.waitForTimeout(800);
          await page.getByRole("button", { name: /Review instruction/ }).first().click();
          await page.getByRole("dialog").waitFor();
          await page.waitForTimeout(2300);
        },
      },
      {
        name: "agent-activity",
        run: async (page) => {
          await page.waitForTimeout(700);
          await page.getByRole("button", { name: "Agent activity", exact: true }).click();
          await page.waitForTimeout(1200);
          await page.waitForTimeout(1400);
          await page.getByRole("heading", { name: "Guardrail checks", exact: true }).scrollIntoViewIfNeeded();
          await page.waitForTimeout(1200);
          await glide(page, 360, 30, 50);
          await page.waitForTimeout(2600);
        },
      },
    ],
  },
};

const product = products[requested];
if (!product) throw new Error(`Unknown product ${requested}. Available: ${Object.keys(products).join(", ")}`);

const outputDir = path.join(root, "projects", requested, "captures", "motion");
const rawDir = path.join(outputDir, ".raw");
await mkdir(rawDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
for (const scene of product.scenes) {
  if (onlyScene && scene.name !== onlyScene) continue;
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    recordVideo: { dir: rawDir, size: { width: 1920, height: 1080 } },
  });
  if (product.resetPath) {
    const reset = await context.request.post(new URL(product.resetPath, product.url).toString());
    if (!reset.ok()) throw new Error(`Could not reset ${requested}: ${reset.status()}`);
  }
  const page = await context.newPage();
  const recordingStarted = Date.now();
  await page.goto(product.url, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: `
      html { scroll-behavior: smooth !important; }
      * { cursor: default !important; }
      [data-capture-focus] { outline: 3px solid rgba(101, 214, 197, .72) !important; outline-offset: 4px; }
    `,
  });
  const video = page.video();
  await page.waitForTimeout(300);
  // The recording begins with the blank page load; start the clip once the app is painted.
  const lead = (Date.now() - recordingStarted) / 1000;
  await scene.run(page);
  await page.waitForTimeout(500);
  await context.close();
  const recorded = await video.path();
  const raw = path.join(rawDir, `${scene.name}.webm`);
  await rename(recorded, raw);
  const output = path.join(outputDir, `${scene.name}.mp4`);
  const result = spawnSync(ffmpegPath, [
    "-y", "-ss", lead.toFixed(2), "-i", raw,
    "-vf", "fps=24,format=yuv420p",
    "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-movflags", "+faststart", output,
  ], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Could not encode ${scene.name}`);
  console.log(`Captured ${requested}/${scene.name}`);
}
await browser.close();
await rm(rawDir, { recursive: true, force: true });

