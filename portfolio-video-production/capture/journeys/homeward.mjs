// Alex Morgan's recovery journey through Homeward's seeded synthetic demo, start to finish.
const MAIN = 'main[aria-label="Care dashboard"]';

async function scrollToReveal(rec, locator, top, label) {
  const box = await rec.box(locator);
  await rec.scroll(MAIN, box.y - top, { duration: 950, label });
}

const dialog = (page, name) => page.getByRole("dialog", { name });
const closeDialog = (page) => page.getByRole("button", { name: "Close dialog" });
const nav = (page, name) => page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name, exact: true });

export default {
  url: process.env.HOMEWARD_URL || "http://127.0.0.1:5173",
  hideText: ["localhost"],
  start: { x: 1260, y: 760 },
  async reset(context) {
    const response = await context.request.post(`${this.url}/api/demo/reset`);
    if (!response.ok()) throw new Error(`Homeward reset failed: ${response.status()}`);
  },
  chapters: [
    {
      name: "01-overview",
      async run(rec, page) {
        await rec.hold(700);
        await rec.moveTo(page.getByLabel("Next-step guidance").getByRole("heading", { name: "Complete your recovery check-in" }), { label: "next-task", anchor: [0.35, 0.6] });
        await rec.hold(1100);
        await rec.moveTo(page.getByText("Sep 26", { exact: true }).first(), { label: "follow-up-date" });
        await rec.hold(800);
        await rec.moveTo(page.locator("article.task").getByRole("heading", { name: "Arrange your follow-up visit" }), { label: "follow-up-task", anchor: [0.3, 0.5] });
        await rec.hold(600);
      },
    },
    {
      name: "02-source",
      async run(rec, page) {
        await rec.hold(200);
        await rec.click(page.getByRole("button", { name: "View source", exact: true }).first(), { label: "view-source" });
        await rec.waitFor(() => dialog(page, "Discharge summary").isVisible(), { label: "source-dialog" });
        rec.mark("source-open", { box: await rec.box(page.locator(".modal")), passage: await rec.box(page.locator(".source-passage.highlight")) });
        await rec.hold(2600);
        await rec.click(closeDialog(page), { label: "close" });
        await rec.hold(350);
      },
    },
    {
      name: "03-ask",
      async run(rec, page) {
        await rec.hold(200);
        await rec.click(page.locator("#chat-input"), { label: "composer", anchor: [0.3, 0.45] });
        await rec.hold(250);
        await rec.type("What paperwork should I bring?", { label: "question" });
        await rec.hold(300);
        await rec.click(page.getByRole("button", { name: "Send question" }), { label: "send" });
        await rec.waitFor(() => page.locator(".citation-chip").first().isVisible(), { label: "answer" });
        rec.mark("answer", { box: await rec.box(page.locator(".source-answer").last()) });
        await rec.hold(2000);
        await rec.click(page.locator(".citation-chip").first(), { label: "citation" });
        await rec.waitFor(() => page.getByRole("dialog").isVisible(), { label: "citation-dialog" });
        rec.mark("citation-open", { box: await rec.box(page.locator(".modal")), passage: await rec.box(page.locator(".source-passage.highlight")) });
        await rec.hold(2200);
        await rec.click(closeDialog(page), { label: "close" });
        await rec.hold(350);
      },
    },
    {
      name: "04-help",
      async run(rec, page) {
        const lab = page.locator("article.task", { hasText: "Clarify the laboratory instructions" });
        await rec.hold(200);
        await scrollToReveal(rec, lab, 330, "lab-task");
        await rec.moveTo(lab.getByRole("heading"), { label: "lab-task", anchor: [0.4, 0.5] });
        await rec.hold(900);
        await rec.click(lab.getByRole("button", { name: "Need help" }), { label: "need-help" });
        await rec.waitFor(() => lab.getByText("Help requested", { exact: true }).isVisible(), { label: "help-flag" });
        rec.mark("help-requested", { box: await rec.box(lab) });
        await rec.hold(1500);
        await rec.click(nav(page, "Care team"), { label: "care-team" });
        await rec.waitFor(() => page.getByRole("button", { name: /^Review task: Clarify the laboratory instructions for Alex Morgan/ }).isVisible(), { label: "queue" });
        await rec.hold(500);
        await rec.click(page.getByRole("button", { name: /^Review task: Clarify the laboratory instructions for Alex Morgan/ }), { label: "review-task" });
        await rec.waitFor(() => dialog(page, "Review & respond").isVisible(), { label: "review-dialog" });
        rec.mark("review-open", { box: await rec.box(page.locator(".modal")), status: await rec.box(page.getByText(/^Status:/).first()) });
        await rec.hold(700);
        await rec.click(page.getByLabel("Care-team response"), { label: "response", anchor: [0.3, 0.4] });
        await rec.type("Confirming the test and date with Dr. Chen.", { label: "response" });
        await rec.hold(300);
        await rec.click(page.getByRole("button", { name: "Save help response" }), { label: "save-response" });
        await rec.waitFor(() => page.locator(".review-notice").isVisible(), { label: "saved" });
        rec.mark("response-saved", { box: await rec.box(page.locator(".review-notice")), status: await rec.box(page.getByText(/^Status:/).first()) });
        await rec.hold(2200);
        await rec.click(closeDialog(page), { label: "close" });
        await rec.hold(350);
      },
    },
    {
      name: "05-reminder",
      async run(rec, page) {
        await rec.hold(200);
        await rec.click(nav(page, "My recovery"), { label: "my-recovery" });
        await rec.waitFor(() => page.getByRole("heading", { name: "Your recovery, organized." }).isVisible(), { label: "recovery" });
        await rec.hold(300);
        // The dashboard keeps its scroll position from the help request; bring the follow-up task back into view.
        const followUp = page.locator("article.task", { hasText: "Arrange your follow-up visit" });
        if ((await rec.box(followUp)).y < 120) await scrollToReveal(rec, followUp, 200, "follow-up");
        await rec.hold(250);
        const bell = page.getByRole("button", { name: "Set reminder for Arrange your follow-up visit" });
        await rec.click(bell, { label: "bell" });
        await rec.waitFor(() => dialog(page, "You decide the next step").isVisible(), { label: "approval-dialog" });
        rec.mark("proposal", { box: await rec.box(page.locator(".modal")) });
        await rec.hold(1500);
        await rec.click(page.getByRole("button", { name: "Approve reminder" }), { label: "approve" });
        await rec.waitFor(() => page.getByRole("button", { name: "Create local reminder" }).isVisible(), { label: "approved" });
        await rec.hold(700);
        await rec.click(page.getByText("Demo: simulate a timeout after saving"), { label: "simulate", anchor: [0.08, 0.5] });
        await rec.hold(450);
        await rec.click(page.getByRole("button", { name: "Create local reminder" }), { label: "create" });
        await rec.waitFor(() => page.getByRole("button", { name: "Retry safely" }).isVisible(), { label: "timeout" });
        rec.mark("timeout", { box: await rec.box(page.locator(".inline-error")) });
        await rec.hold(1800);
        await rec.click(page.getByRole("button", { name: "Retry safely" }), { label: "retry" });
        await rec.waitFor(() => page.getByText(/^Receipt:/).isVisible(), { label: "receipt" });
        rec.mark("receipt", { box: await rec.box(page.locator(".approval-details")), receipt: await rec.box(page.getByText(/^Receipt:/)) });
        await rec.hold(2400);
        await rec.click(closeDialog(page), { label: "close" });
        await rec.hold(350);
      },
    },
    {
      name: "06-activity",
      async run(rec, page) {
        await rec.hold(200);
        await rec.click(page.getByRole("complementary", { name: "Application menu" }).getByRole("button", { name: "Agent activity", exact: true }), { label: "agent-activity" });
        await rec.waitFor(() => page.getByRole("heading", { name: "Execution timeline" }).isVisible(), { label: "timeline" });
        rec.mark("timeline", { box: await rec.box(page.getByRole("heading", { name: "Execution timeline" })) });
        await rec.hold(1800);
        await scrollToReveal(rec, page.getByRole("heading", { name: "Guardrail checks" }), 150, "guardrails");
        rec.mark("guardrails", { box: await rec.box(page.locator("section", { has: page.getByRole("heading", { name: "Guardrail checks" }) }).last()) });
        await rec.moveTo(page.getByText("/ 32 passed"), { label: "score", anchor: [0.2, 0.5] });
        await rec.hold(2000);
        await rec.click(page.getByText("Your Homeward agent team"), { label: "agent-team", anchor: [0.3, 0.5] });
        await rec.hold(150);
        rec.mark("agent-team", { box: await rec.box(page.getByText("Care-plan coordinator").locator("xpath=ancestor::*[self::details or self::section][1]")) });
        await rec.hold(2600);
      },
    },
    {
      // The plan after the journey: reminder saved, laboratory question still open.
      name: "07-outro",
      async run(rec, page) {
        await rec.hold(200);
        await rec.click(nav(page, "My recovery"), { label: "my-recovery" });
        await rec.waitFor(() => page.getByRole("heading", { name: "Your recovery, organized." }).isVisible(), { label: "recovery" });
        await rec.moveTo({ x: 1150, y: 700 }, { label: "rest" });
        await rec.hold(500);
        const follow = page.locator("article.task", { hasText: "Arrange your follow-up visit" });
        await scrollToReveal(rec, follow, 250, "tasks");
        const lab = page.locator("article.task", { hasText: "Clarify the laboratory instructions" });
        rec.mark("tasks", {
          box: await rec.box(page.locator(".task-list")),
          followUp: await rec.box(follow),
          source: await rec.box(follow.getByRole("button", { name: "View source", exact: true })),
          reminder: await rec.box(follow.locator(".saved-reminder")),
          lab: await rec.box(lab),
          help: await rec.box(lab.getByText("Help requested", { exact: true })),
        });
        await rec.hold(3200);
      },
    },
  ],
};
