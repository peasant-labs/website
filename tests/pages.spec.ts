import { expect, test } from "@playwright/test";
import { PHONE } from "./landing-fixture";

/*
 * The project, about and contact pages, checked on what a reader sees. (The
 * project pages' own suite waits on its evidence ledger; these hold the layout
 * meanwhile.)
 */

for (const path of ["/projects/peasant", "/projects/village"]) {
  test(`${path}: the get-started wizard's footer sits under its command, and its step names stay inside it`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    const wizard = page.locator(".swz").first();
    // scrolled so the command is just at the bottom of the screen: a footer stuck to the screen would cover it
    await wizard.evaluate((box) => {
      const command = box.querySelector(".cli-cmd")!.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + command.bottom - window.innerHeight + 4, behavior: "instant" });
    });
    const layout = await wizard.evaluate((box) => {
      const command = box.querySelector(".cli-cmd")!.getBoundingClientRect();
      const foot = box.querySelector(".swz-foot")!.getBoundingClientRect();
      const edge = box.getBoundingClientRect();
      const labels = [...box.querySelectorAll(".swz-label")].map((label) => label.getBoundingClientRect());
      return {
        commandAboveFoot: command.bottom <= foot.top + 1,
        labelsInside: labels.every((label) => label.left >= edge.left && label.right <= edge.right),
      };
    });
    expect(layout.commandAboveFoot, "the footer covers the command").toBe(true);
    expect(layout.labelsInside, "a step name overhangs the wizard").toBe(true);
  });
}

test("on a phone the wizard shows its rail, the whole command and its copy button", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/projects/peasant");
  const wizard = page.locator(".swz").first();
  await wizard.scrollIntoViewIfNeeded();
  const layout = await wizard.evaluate((box) => {
    const edge = box.getBoundingClientRect();
    const rail = box.querySelector(".swz-head")!.getBoundingClientRect();
    const foot = box.querySelector(".swz-foot")!.getBoundingClientRect();
    const line = box.querySelector<HTMLElement>(".cli-cmd-line")!;
    const copy = box.querySelector(".cli-copy")!.getBoundingClientRect();
    return {
      railAboveFoot: rail.bottom <= foot.top + 1,
      commandWhole: line.scrollWidth <= line.clientWidth + 1,
      copyInside: copy.left >= edge.left && copy.right <= edge.right,
      copyHeight: copy.height,
    };
  });
  expect(layout.railAboveFoot, "the footer covers the rail").toBe(true);
  expect(layout.commandWhole, "the command runs out of its box").toBe(true);
  expect(layout.copyInside, "copy is outside the wizard").toBe(true);
  expect(layout.copyHeight).toBeGreaterThanOrEqual(44);
  await context.close();
});

test("on a phone the contact form's field and button are full-size tap targets", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/contact");
  for (const control of [page.getByRole("textbox", { name: /email/ }), page.locator(".pj-contact-form button")]) {
    const box = (await control.first().boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await context.close();
});

test("/about says who we are, not that it will later, in sentence-case prose", async ({ page }) => {
  await page.goto("/about");
  const main = page.locator("main");
  await expect(main).not.toContainText("will carry");
  // prose is written in sentence case; only the interface's own labels are lowercase
  for (const paragraph of await main.locator("p").allTextContents()) {
    expect(paragraph.trim()[0], paragraph).toMatch(/[A-Z]/);
  }
  await expect(main.getByRole("link", { name: "the essay on the blog" })).toHaveAttribute(
    "href",
    "/blog/reclaiming-data-autonomy-as-a-peasant",
  );
});
