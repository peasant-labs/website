import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

type Tutorials = {
  version: 1;
  quickstart: { prompt: string; command: string };
  guides: Array<{ label: string; path: string; heading: string }>;
};
const fixture = parse(readFileSync(resolve("testdata/docs/tutorials.yaml"), "utf8")) as Tutorials;

test("quick setup comes before the detailed reference and copies the exact opening prompt", async ({ page }) => {
  await page.goto("/docs");
  const quickstart = page.locator("#quickstart");
  await expect(quickstart).toContainText(fixture.quickstart.command);
  await expect(quickstart).toContainText("peasant kickstart");
  const order = await page.locator("main section[id]").evaluateAll((sections) => sections.map((section) => section.id));
  expect(order.indexOf("quickstart")).toBeLessThan(order.indexOf("install"));
  expect(order.indexOf("install")).toBeLessThan(order.indexOf("kickstart"));
  await quickstart.getByRole("button", { name: `copy ask your agent: ${fixture.quickstart.prompt}`, exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(fixture.quickstart.prompt);
});

test("use-case guides open from the mounted sidebar and are searchable", async ({ page, request }) => {
  const index = await (await request.get("/docs/search-index.json")).json() as { docs: Array<{ href: string }> };
  await page.goto("/docs");
  for (const guide of fixture.guides) {
    const sidebar = page.getByRole("complementary", { name: "docs" });
    await sidebar.getByRole("link", { name: guide.label, exact: true }).click();
    await expect(page).toHaveURL(guide.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.heading);
    await expect(sidebar.getByRole("link", { name: guide.label, exact: true })).toHaveAttribute("aria-current", "page");
    expect(index.docs.some((entry) => entry.href === guide.path)).toBe(true);
  }
});
