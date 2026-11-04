// A safety team's journey through the live TraceLens workspace (real run records only): the model
// ladder in Training Lab, then Baseline Lab, where the run with 91 saved Gemma 3 4B answers is picked,
// a stroke case flagged as under-escalated is opened to its exact answer, and the completed blind
// review is shown. Panels reading "missing", "not collected" or "not yet measured" are kept out of the
// path; the edit frames around them. Serve the workspace with
// `python3 -m tracelens_training.server --port 8781` from the AI Self Explainability repo.
const RUN = "BR-20261020T073945Z-005"; // 91 saved answers, blind packet 20/20 reviewed
const CASE = "SYM-STRESS-STROKE-POSTERIOR";

// Scrolls the page so `locator` sits `top` CSS pixels below the top of the viewport.
async function reveal(rec, locator, top, label, duration = 1100) {
  const box = await rec.box(locator);
  await rec.scroll(null, box.y - top, { duration, label });
}

export default {
  url: `${process.env.TRACELENS_URL || "http://127.0.0.1:8781"}/training-lab.html`,
  start: { x: 1240, y: 620 },
  chapters: [
    {
      name: "01-models",
      async run(rec, page) {
        await rec.hold(500);
        await reveal(rec, page.getByText("Different models answer different questions"), 150, "ladder");
        rec.mark("ladder", { box: await rec.box(page.getByText("Different models answer different questions")) });
        await rec.hold(300);
        const card = (name) => page.locator("h3, h4, strong, b, div").filter({ hasText: new RegExp(`^${name}$`) }).first();
        await rec.moveTo(card("OLMo 3 7B"), { label: "olmo", anchor: [0.3, 0.5] });
        await rec.hold(350);
        await rec.moveTo(card("Gemma 3 4B"), { label: "gemma", anchor: [0.3, 0.5] });
        await rec.hold(350);
        await rec.moveTo(card("Qwen3 4B"), { label: "qwen", anchor: [0.3, 0.5] });
        await rec.hold(350);
        await rec.moveTo(card("MedGemma 4B-it"), { label: "medgemma", anchor: [0.3, 0.5] });
        rec.mark("study-set", { box: await rec.box(page.getByText("Current study set")) });
        await rec.hold(450);
        await rec.moveTo(page.getByText("TraceLens controls; Colab executes"), { label: "compute", anchor: [0.4, 0.5] });
        rec.mark("compute", { box: await rec.box(page.getByText("TraceLens controls; Colab executes")) });
        await rec.hold(700);
      },
    },
    {
      name: "02-case",
      async run(rec, page) {
        rec.hideCursor();
        await page.goto(`${process.env.TRACELENS_URL || "http://127.0.0.1:8781"}/baseline-lab.html`, { waitUntil: "commit" });
        await rec.waitFor(async () => (await page.locator("#runSelect option").count()) > 5 && (await page.locator("#caseList > *").count()) > 0, { pageTimeout: 20000, label: "baseline-loaded" });
        rec.showCursor();
        await reveal(rec, page.locator("#runSelect"), 420, "runs", 1000);
        await rec.click(page.locator("#runSelect"), { label: "run-picker", anchor: [0.45, 0.5] });
        const value = await page.locator("#runSelect option").filter({ hasText: RUN }).first().getAttribute("value");
        await page.locator("#runSelect").selectOption(value);
        rec.log("select", { label: "run-chosen", value: RUN });
        await rec.waitFor(async () => (await page.locator("#runSelect").inputValue()) === value, { pageTimeout: 5000, label: "run-switched" });
        await rec.hold(700);
        await reveal(rec, page.getByText("Case-level evidence"), 110, "cases", 1300);
        await rec.click(page.locator("#family"), { label: "family-filter", anchor: [0.4, 0.5] });
        await page.locator("#family").selectOption({ label: "STROKE" });
        rec.log("select", { label: "stroke", value: "STROKE" });
        await rec.hold(500);
        await rec.click(page.locator("#caseList").getByText(CASE, { exact: true }), { label: "open-case", anchor: [0.3, 0.5] });
        await rec.hold(600);
        rec.mark("case-question", { box: await rec.box(page.locator("#caseDetail .question")) });
        await rec.hold(500);
      },
    },
    {
      name: "03-answer",
      async run(rec, page) {
        // The exact saved answer, then the reader's verdict on it: under-escalated, with emergency care
        // mentioned only as a condition.
        const answer = page.locator("#caseDetail .answer-preview");
        await reveal(rec, answer, 150, "answer", 1200);
        rec.mark("answer", { box: await rec.box(answer) });
        await rec.moveTo(answer.locator("p").first(), { label: "answer-text", anchor: [0.35, 0.3] });
        await rec.hold(1200);
        const verdict = page.locator("#caseDetail .analysis strong").first();
        await reveal(rec, verdict, 420, "verdict", 900);
        await rec.moveTo(verdict, { label: "under-escalated", anchor: [0.3, 0.5] });
        rec.mark("verdict", { box: await rec.box(verdict), hedge: await rec.box(page.locator("#caseDetail .hedge-flag strong").first()) });
        await rec.hold(1200);
      },
    },
    {
      name: "04-review",
      async run(rec, page) {
        await reveal(rec, page.getByText("Prioritized answer-reading queue"), 110, "review", 1300);
        rec.mark("packet", { box: await rec.box(page.getByText("Packet complete").first()) });
        await rec.hold(500);
        await rec.click(page.getByText("R03 · reviewed").first(), { label: "record", anchor: [0.3, 0.5] });
        await rec.hold(1400);
      },
    },
  ],
};
