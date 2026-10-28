import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const production = JSON.parse(await readFile(path.join(root, "production.json"), "utf8"));
const baseUrl = process.env.PORTFOLIO_URL || "http://127.0.0.1:3000";

const targets = {
  relay: ["Relay turns an employee", "A grounded answer", "A VPN issue becomes", "The evaluation program"],
  "refract-ai": ["One research session", "Read the paper", "A review attempt", "Battery analysis"],
  homeward: ["Homeward turns discharge", "The patient sees", "The workflow carries", "The integrated evidence"],
  "birb-hangout": ["A shared digital place", "Activities are visible", "Rest by the fire", "Subjective 3D quality"],
  tracelens: ["A self-built workspace", "Two independent readers", "Results, led by", "Vega caught"],
  "brain-atrophy-computer-vision": ["An anatomical hypothesis", "Seven stages", "Three visible image", "Anatomical focus"],
  "alzheimers-disease-research": ["A complete four-class", "Every stage", "The architecture rendering", "Probability ensembling"]
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  reducedMotion: "reduce"
});

for (const project of production.projects) {
  const outputDir = path.join(root, "projects", project.slug, "captures", "portfolio");
  await mkdir(outputDir, { recursive: true });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/projects/${project.slug}/`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; } * { animation: none !important; transition: none !important; }" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(outputDir, "01-hero.png") });

  const fragments = targets[project.slug] || [];
  const fallbackFractions = [0.18, 0.38, 0.62, 0.82];
  for (let index = 0; index < 4; index += 1) {
    const fragment = fragments[index];
    let found = false;
    if (fragment) {
      const headings = page.locator("h2, h3").filter({ hasText: fragment });
      if (await headings.count()) {
        const box = await headings.first().boundingBox();
        if (box) {
          await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, box.y - 180));
          found = true;
        }
      }
    }
    if (!found) {
      await page.evaluate((fraction) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, max * fraction);
      }, fallbackFractions[index]);
    }
    const names = ["02-problem.png", "03-workflow.png", "04-evaluation.png", "05-results.png"];
    await page.screenshot({ path: path.join(outputDir, names[index]) });
  }
  await page.close();
  console.log(`Captured portfolio route for ${project.slug}`);
}

await browser.close();
