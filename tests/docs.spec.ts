import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

type AnchorsFixture = { version: 1; pages: Array<{ path: string; ids: string[] }> };

const anchors = parse(readFileSync(resolve("testdata/docs/anchors.yaml"), "utf8")) as AnchorsFixture;

test("every docs address the apps link to still lands on its section", async ({ page }) => {
  for (const { path, ids } of anchors.pages) {
    await page.goto(path);
    for (const id of ids) {
      await expect(page.locator(`[id="${id}"]`), `${path}#${id} is gone`).toHaveCount(1);
    }
  }
});
