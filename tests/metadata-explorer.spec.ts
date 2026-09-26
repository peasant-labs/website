import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  HARNESS_IDS,
  loadHarnessSamples,
  validateHarnessSamples,
} from "../lib/metadata-explorer";

/**
 * The metadata explorer is a data surface: it reads six authored fixtures and
 * wires raw native records to the unified turns they produced. These tests
 * verify the fixtures are a complete independent oracle, that the section
 * mounts, that selection and keyboard interaction work, and that the whole
 * section passes axe in both themes.
 */

const THEMES = ["dark", "light"] as const;
type Theme = (typeof THEMES)[number];

const samples = loadHarnessSamples();

function sampleById(id: string) {
  const sample = samples.find((candidate) => candidate.id === id);
  if (!sample) {
    throw new Error(`test expected a ${id} sample; run pnpm validate from the repo root`);
  }
  return sample;
}

async function chooseTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("peasant-labs-theme", selectedTheme);
  }, theme);
}

test("the fixtures are a complete independent oracle", () => {
  expect(samples.map((sample) => sample.id)).toEqual([...HARNESS_IDS]);

  for (const sample of samples) {
    expect(
      sample.records.some((record) => record.outcome === "opaque"),
      `${sample.id} retains an opaque record`,
    ).toBe(true);
    expect(
      sample.records.some((record) => record.mapsTo.length === 0),
      `${sample.id} has a record that writes no turn`,
    ).toBe(true);
    expect(sample.unified.turns?.length ?? 0).toBeGreaterThan(0);
  }
});

test("validation rejects an out-of-range lowering and a missing harness", () => {
  const mutated = structuredClone(samples);
  mutated[0].records[0].mapsTo = [99];
  expect(() => validateHarnessSamples(mutated)).toThrow(/mapsTo/);

  expect(() => validateHarnessSamples(samples.slice(1))).toThrow(/six|6/);
});

test("the section mounts with six tabs and the first sample active", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  await expect(root).toHaveCount(1);
  await expect(root.getByRole("tab")).toHaveCount(HARNESS_IDS.length);
  await expect(root.locator(`[data-harness="${samples[0].id}"]`)).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("selecting a harness switches the native path and resets the record", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const second = samples[1];

  await root.locator(`[data-harness="${second.id}"]`).click();

  await expect(root.locator("[data-native-path]")).toHaveText(second.native.path);
  await expect(
    root.locator(`[data-record-id="${second.records[0].id}"]`),
  ).toHaveAttribute("aria-pressed", "true");
});

test("selecting a record marks its turns and the annotation follows", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const sample = sampleById("claude-code");

  const mapped = sample.records.find((record) => record.mapsTo.length > 0);
  if (!mapped) {
    throw new Error("expected a record that lowers to a turn");
  }
  const turnIndex = mapped.mapsTo[0];

  await root.locator(`[data-record-id="${mapped.id}"]`).click();
  await expect(root.locator(`[data-record-id="${mapped.id}"]`)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(root.locator(`[data-turn-index="${turnIndex}"]`)).toHaveAttribute(
    "data-highlighted",
    "true",
  );
  await expect(root.locator("[data-mx-annotation]")).toContainText(`unified turn ${turnIndex}`);

  const noTurn = sample.records.find((record) => record.mapsTo.length === 0);
  if (!noTurn) {
    throw new Error("expected a record that writes no turn");
  }

  await root.locator(`[data-record-id="${noTurn.id}"]`).click();
  await expect(root.locator('[data-highlighted="true"]')).toHaveCount(0);
  await expect(root.locator("[data-mx-annotation]")).toContainText("no unified turn");
});

test("arrow keys move the active tab", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const first = root.locator(`[data-harness="${samples[0].id}"]`);
  const second = root.locator(`[data-harness="${samples[1].id}"]`);

  await first.focus();
  await page.keyboard.press("ArrowRight");

  await expect(second).toHaveAttribute("aria-selected", "true");
  await expect(second).toBeFocused();
});

for (const theme of THEMES) {
  test(`the metadata explorer passes axe in the ${theme} theme`, async ({ page }) => {
    await chooseTheme(page, theme);
    await page.goto("/projects");
    await expect(page.locator("[data-metadata-explorer]")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include("[data-metadata-explorer]")
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
