import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const repo = path.resolve(root, "..");
const production = JSON.parse(await readFile(path.join(root, "production.json"), "utf8"));

const sources = {
  relay: {
    base: "/Users/neeravch/Documents/ChatGPT/DeepGram Project/docs/assets/readme/relay/screenshots",
    files: [
      "01-relay-workspace-and-guide.png",
      "02-whats-next-grounded-answer.png",
      "03-conversation-opens-record.png",
      "04-vpn-action-prepared.png",
      "05-vpn-case-confirmed.png",
      "06-meeting-or-calendar-workflow.png",
      "07-workflow-evidence-trace.png"
    ]
  },
  "refract-ai": {
    base: "/private/tmp/portfolio-video-sources/refract/docs/readme-assets",
    files: [
      "workflow-overview.png",
      "reader-workspace.png",
      "index-workspace.png",
      "compare-workspace.png",
      "stats-workspace.png",
      "system-architecture.png"
    ]
  },
  homeward: {
    base: "/private/tmp/portfolio-video-sources/homeward/docs/assets/journey",
    files: [
      "01-recovery.png",
      "02-source.png",
      "03-source-search.png",
      "04-help-review.png",
      "05-approval.png",
      "06-safe-retry.png",
      "07-import-review.png",
      "08-activity.png",
      "09-provenance.png",
      "10-mobile.png",
      "failure.png"
    ]
  },
  "birb-hangout": {
    base: "/Users/neeravch/Documents/birb-hangout/docs/thesis/site/media/activities/clips",
    files: [
      "records.mp4",
      "reading.mp4",
      "watching.mp4",
      "trivia.mp4",
      "hug.mp4",
      "nap.mp4",
      "dream-entry.mp4",
      "flight.mp4",
      "islands.mp4",
      "exploration.mp4"
    ]
  },
  tracelens: {
    base: path.join(repo, "public/uploads/tracelens"),
    files: [
      "architecture.png",
      "care-trajectory.png",
      "decision-model.png",
      "detectors.png",
      "evaluation-dashboard-showcase.png",
      "evaluation-dashboard.png",
      "safeguards.png",
      "support-loop.png"
    ]
  },
  "brain-atrophy-computer-vision": {
    base: repo,
    files: [
      ["tmp/pdfs/brain-atrophy/page-1.png", "paper-page-1.png"],
      ["tmp/pdfs/brain-atrophy/page-2.png", "paper-page-2.png"],
      ["tmp/pdfs/brain-atrophy/page-3.png", "paper-page-3.png"],
      ["tmp/pdfs/brain-atrophy/page-4.png", "paper-page-4.png"],
      ["public/uploads/alzheimers/brain-atrophy-publication.svg", "brain-atrophy-publication.svg"]
    ]
  },
  "alzheimers-disease-research": {
    base: path.join(repo, "public/uploads/alzheimers"),
    files: [
      "notebook-output-1.png",
      "notebook-output-2.png",
      "notebook-output-3.png",
      "notebook-output-4.png"
    ]
  }
};

const sourceMap = [];

for (const project of production.projects) {
  const projectDir = path.join(root, "projects", project.slug);
  const captureDir = path.join(projectDir, "captures", "repository");
  await mkdir(captureDir, { recursive: true });
  await mkdir(path.join(projectDir, "captures", "portfolio"), { recursive: true });
  await mkdir(path.join(projectDir, "narration"), { recursive: true });
  await mkdir(path.join(projectDir, "scenes"), { recursive: true });

  const script = `# ${project.title}\n\n## Narration\n\n${project.narration}\n\n## Delivery\n\n- Target: 40-60 seconds\n- Voice: Kokoro ${production.format.voice}\n- Arc: problem → workflow → method → evaluation → defining contribution\n`;
  await writeFile(path.join(projectDir, "script.md"), script);
  await writeFile(
    path.join(projectDir, "storyboard.json"),
    `${JSON.stringify({ title: project.title, subtitle: project.subtitle, scenes: project.scenes }, null, 2)}\n`
  );

  const source = sources[project.slug];
  if (!source) continue;
  for (const entry of source.files) {
    const [relativeSource, outputName] = Array.isArray(entry) ? entry : [entry, entry];
    const from = path.resolve(source.base, relativeSource);
    const to = path.join(captureDir, outputName);
    try {
      await copyFile(from, to);
      sourceMap.push({ project: project.slug, output: path.relative(root, to), source: from });
    } catch (error) {
      throw new Error(`Missing source asset for ${project.slug}: ${from}\n${error.message}`);
    }
  }
}

await writeFile(path.join(root, "source-map.json"), `${JSON.stringify(sourceMap, null, 2)}\n`);
console.log(`Collected ${sourceMap.length} repository assets across ${production.projects.length} projects.`);
