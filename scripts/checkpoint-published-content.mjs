#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const baseUrl = new URL(process.argv[2] ?? "https://neerav-git.github.io/");
const outputDirectory = path.resolve(
  process.argv[3] ??
    path.join("content", "checkpoints", `published-site-${new Date().toISOString().slice(0, 10)}`),
);
const additionalSeeds = process.argv.slice(4);
const pageLimit = 200;
const ignoredExtensions = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|png|svg|webm|webp|woff2?|xml)$/i;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeUrl(value) {
  const url = new URL(value, baseUrl);
  if (url.origin !== baseUrl.origin) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) return null;
  if (ignoredExtensions.test(url.pathname)) return null;

  url.hash = "";
  url.search = "";
  url.pathname = url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "");
  return url.href;
}

function routeFilename(urlValue) {
  const url = new URL(urlValue);
  const route = decodeURIComponent(url.pathname)
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
  return route || "index";
}

function markdownForPage({ url, title, description, mainText, bodyText }) {
  const content = mainText.trim() || bodyText.trim();
  const lines = [
    `# ${title || new URL(url).pathname || "Published page"}`,
    "",
    `Source: ${url}`,
  ];
  if (description) lines.push(`Description: ${description}`);
  lines.push("", content, "");
  return lines.join("\n");
}

await fs.mkdir(path.join(outputDirectory, "source-html"), { recursive: true });
await fs.mkdir(path.join(outputDirectory, "rendered-html"), { recursive: true });
await fs.mkdir(path.join(outputDirectory, "text"), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const queue = [baseUrl.href, ...additionalSeeds]
  .map(normalizeUrl)
  .filter(Boolean);
const queued = new Set(queue);
const visited = new Set();
const pages = [];
const failures = [];

while (queue.length && visited.size < pageLimit) {
  const requestedUrl = queue.shift();
  if (!requestedUrl || visited.has(requestedUrl)) continue;
  visited.add(requestedUrl);

  try {
    const response = await page.goto(requestedUrl, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const status = response?.status() ?? 0;
    const finalUrl = normalizeUrl(page.url()) ?? requestedUrl;
    if (status >= 400 || status === 0) {
      failures.push({ url: requestedUrl, final_url: finalUrl, status });
      continue;
    }

    const sourceHtml = response ? await response.text() : "";
    const renderedHtml = await page.content();
    const pageData = await page.evaluate(() => ({
      title: document.title.trim(),
      description:
        document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "",
      mainText: document.querySelector("main")?.innerText ?? "",
      bodyText: document.body?.innerText ?? "",
      links: Array.from(document.querySelectorAll("a[href]"), (link) => link.href),
    }));
    const text = markdownForPage({
      url: finalUrl,
      title: pageData.title,
      description: pageData.description,
      mainText: pageData.mainText,
      bodyText: pageData.bodyText,
    });
    const filename = routeFilename(finalUrl);
    const sourceFile = `source-html/${filename}.html`;
    const renderedFile = `rendered-html/${filename}.html`;
    const textFile = `text/${filename}.md`;

    await Promise.all([
      fs.writeFile(path.join(outputDirectory, sourceFile), sourceHtml),
      fs.writeFile(path.join(outputDirectory, renderedFile), renderedHtml),
      fs.writeFile(path.join(outputDirectory, textFile), text),
    ]);

    pages.push({
      url: finalUrl,
      requested_url: requestedUrl,
      status,
      title: pageData.title,
      description: pageData.description,
      files: {
        source_html: sourceFile,
        rendered_html: renderedFile,
        text: textFile,
      },
      sha256: {
        source_html: sha256(sourceHtml),
        rendered_html: sha256(renderedHtml),
        text: sha256(text),
      },
      characters: {
        main_text: pageData.mainText.length,
        body_text: pageData.bodyText.length,
      },
    });

    for (const href of pageData.links) {
      const normalized = normalizeUrl(href);
      if (normalized && !queued.has(normalized) && !visited.has(normalized)) {
        queued.add(normalized);
        queue.push(normalized);
      }
    }
  } catch (error) {
    failures.push({ url: requestedUrl, error: error instanceof Error ? error.message : String(error) });
  }
}

await browser.close();

pages.sort((a, b) => a.url.localeCompare(b.url));
failures.sort((a, b) => a.url.localeCompare(b.url));
const capturedAt = new Date().toISOString();
const manifest = {
  checkpoint_version: 1,
  captured_at: capturedAt,
  base_url: baseUrl.href,
  capture_method: "Rendered same-origin crawl with Playwright",
  page_count: pages.length,
  failure_count: failures.length,
  pages,
  failures,
};
const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
await fs.writeFile(path.join(outputDirectory, "manifest.json"), manifestJson);

const readme = `# Published website content checkpoint\n\n` +
  `Captured: ${capturedAt}\n\n` +
  `Source: ${baseUrl.href}\n\n` +
  `Pages captured: ${pages.length}\n\n` +
  `Failed pages: ${failures.length}\n\n` +
  `This directory is a read-only reference copy of the public website at the time above. ` +
  `For each page, \`source-html/\` preserves the server response, \`rendered-html/\` preserves the rendered DOM, ` +
  `and \`text/\` contains readable copy extracted from the page's main content. ` +
  `\`manifest.json\` records source URLs and SHA-256 checksums.\n`;
await fs.writeFile(path.join(outputDirectory, "README.md"), readme);

process.stdout.write(
  `${JSON.stringify({ output_directory: outputDirectory, page_count: pages.length, failure_count: failures.length }, null, 2)}\n`,
);
