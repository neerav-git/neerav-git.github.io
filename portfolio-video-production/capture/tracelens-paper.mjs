// Still of the open-access Nature Medicine article (Ramaswamy et al. 2026, CC BY 4.0) from the
// masthead through the abstract, for TraceLens beat 1. The cookie banner is declined and the
// advertisement slot hidden; the article itself is untouched. Also records where the abstract's
// under-triage clause ("undertriaged 52% of cases … to 24–48 h evaluation") sits, so the edit can highlight it.
// Usage: node capture/tracelens-paper.mjs
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const URL = "https://www.nature.com/articles/s41591-026-04297-7";
const SENTENCE = "Among gold-standard emergencies, the system undertriaged 52% of cases";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" });
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(3000);
const reject = page.getByRole("button", { name: "Reject optional cookies" });
if (await reject.count()) await reject.click();
await page.addStyleTag({ content: ".c-ad, .c-ad--728x90, [data-component='ad'], div[class*='ad-banner'] { display: none !important; }" });
await page.waitForTimeout(1500);
const geo = await page.evaluate((sentence) => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const i = node.textContent.indexOf(sentence.slice(0, 40));
    if (i < 0) continue;
    const range = document.createRange();
    range.setStart(node, i);
    // The highlight runs to the end of the clause, "…to 24–48 h evaluation".
    const end = node.textContent.indexOf("evaluation", i);
    range.setEnd(node, end > 0 ? end + "evaluation".length : i + sentence.length);
    const rects = [...range.getClientRects()].map((r) => ({ x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }));
    const abstract = document.querySelector("#Abs1-content, section[aria-labelledby='Abs1']");
    const a = abstract?.getBoundingClientRect();
    return { rects, abstractTop: a ? a.y + scrollY : null, abstractBottom: a ? a.bottom + scrollY : null };
  }
  return null;
}, SENTENCE);
if (!geo) throw new Error("Under-triage sentence not found on the page");
const last = geo.rects.at(-1);
const height = Math.ceil(Math.max(geo.abstractBottom ?? 0, last.y + last.height) + 260);
await page.screenshot({ path: "public/tracelens/paper.png", fullPage: true, clip: { x: 0, y: 0, width: 1920, height } });
await writeFile("projects/tracelens/captures/paper/paper.json", `${JSON.stringify({ url: URL, capturedAt: new Date().toISOString(), scale: 2, height, sentence: SENTENCE, ...geo }, null, 2)}\n`);
console.log(JSON.stringify({ height, ...geo }));
await browser.close();
