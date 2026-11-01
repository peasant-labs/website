import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { loadLandingFixture } from "./landing-fixture";

type Tutorials = {
  version: 1;
  quickstart: { prompt: string; command: string };
  nextSteps: { primary: { label: string; href: string }; peers: string[] };
  guides: Array<{ label: string; path: string; heading: string }>;
};
const fixture = parse(readFileSync(resolve("testdata/docs/tutorials.yaml"), "utf8")) as Tutorials;

test("quick setup comes before the detailed reference and copies the exact opening prompt", async ({ page }) => {
  await page.goto("/docs");
  const quickstart = page.locator("#quickstart");
  await expect(quickstart).toContainText(fixture.quickstart.command);
  const onboarding = loadLandingFixture().install;
  await expect(quickstart.locator('[role="tabpanel"]:not([hidden]) .gs-agents li')).toHaveText(onboarding.agents);
  await expect(quickstart.locator(".gs-n")).toHaveCount(0);
  const styles = await quickstart.locator('[role="tabpanel"]:not([hidden]) .gs-lines').evaluate(list => ({ list: getComputedStyle(list).listStyleType, size: getComputedStyle(list.querySelector(".gs-action")!).fontSize }));
  expect(styles).toEqual({ list: "none", size: "16px" });
  await quickstart.getByRole("tab", { name: onboarding.platforms[1]!.label }).click();
  await expect(quickstart.locator(".gs-note")).toHaveText(onboarding.platforms[1]!.note);
  await quickstart.locator('[role="tabpanel"]:not([hidden]) .cli-copy').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(onboarding.platforms[1]!.command);
  const order = await page.locator("main section[id]").evaluateAll((sections) => sections.map((section) => section.id));
  expect(order.indexOf("quickstart")).toBeLessThan(order.indexOf("install"));
  expect(order.indexOf("install")).toBeLessThan(order.indexOf("kickstart"));
  await quickstart.getByRole("button", { name: "copy prompt for your coding agent", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(fixture.quickstart.prompt);
  for (const width of onboarding.phoneWidths) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await quickstart.evaluate(section => ({
      list: getComputedStyle(section.querySelector(".gs-lines")!).listStyleType,
      prompt: getComputedStyle(section.querySelector(".gs-agent-prompt p")!).fontSize,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    expect(layout).toEqual({ list: "none", prompt: "16px", overflow: false });
  }

});

test("use-case guides open from the mounted sidebar and are searchable", async ({ page, request }) => {
  const index = await (await request.get("/docs/search-index.json")).json() as { docs: Array<{ href: string }> };
  await page.goto("/docs");
  const nextSteps = page.locator("#guides");
  await expect(nextSteps.getByRole("link", { name: fixture.nextSteps.primary.label, exact: true })).toHaveAttribute("href", fixture.nextSteps.primary.href);
  expect(await nextSteps.locator(".dx-guides a").evaluateAll(links => links.map(link => link.getAttribute("href")))).toEqual(fixture.nextSteps.peers);
  for (const guide of fixture.guides) {
    const sidebar = page.getByRole("complementary", { name: "docs" });
    await sidebar.getByRole("link", { name: guide.label, exact: true }).click();
    await expect(page).toHaveURL(guide.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.heading);
    await expect(sidebar.getByRole("link", { name: guide.label, exact: true })).toHaveAttribute("aria-current", "page");
    expect(index.docs.some((entry) => entry.href === guide.path)).toBe(true);
  }
});
