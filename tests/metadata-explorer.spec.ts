import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  HARNESS_IDS,
  UNIFIED_GROUPS,
  collectNodePaths,
  loadHarnessSamples,
  matchSelector,
  validateHarnessSamples,
} from "../lib/metadata-explorer";
import { buildJsonLines } from "../lib/json-lines";

/**
 * The schema explorer is a data surface: it reads six authored fixtures and
 * shows each harness's native metadata file beside the unified wire session it
 * lowers into. These tests verify the fixtures are a complete independent
 * oracle, that a section mounts, that the region-to-section linking and keyboard
 * interaction work, and that the whole section passes axe in both themes.
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
    for (const view of [sample.native, sample.unified]) {
      expect(
        view.groups.length,
        `${sample.id} ${view.id} carries field groups`,
      ).toBeGreaterThan(0);
      const paths = collectNodePaths(view.document);
      for (const group of view.groups) {
        expect(
          group.selectors.length,
          `${sample.id} ${view.id} ${group.id} has selectors`,
        ).toBeGreaterThan(0);
        for (const selector of group.selectors) {
          expect(
            paths.some((path) => matchSelector(selector, path)),
            `${sample.id} ${view.id} ${group.id} selector ${selector} matches a node`,
          ).toBe(true);
        }
      }
      expect(
        buildJsonLines(view.document).text,
        `${sample.id} ${view.id} renders as canonical json`,
      ).toBe(JSON.stringify(view.document, null, 2));
    }
    expect(sample.unified.document).toMatchObject({ harness: sample.id });
  }

  // The unified document still validates exactly as before.
  expect(() => validateHarnessSamples(structuredClone(samples))).not.toThrow();
});

test("both views render the same unified categories", () => {
  const canonical = UNIFIED_GROUPS.map((group) => group.id);
  for (const sample of samples) {
    expect(sample.native.groups.map((group) => group.id), `${sample.id} native`).toEqual(
      canonical,
    );
    expect(sample.unified.groups.map((group) => group.id), `${sample.id} unified`).toEqual(
      canonical,
    );
  }
});

test("the example session launches a subagent", () => {
  for (const sample of samples) {
    const turns = (
      sample.unified.document as {
        turns: Array<{ agentName?: string; toolCalls?: Array<{ name: string }> }>;
      }
    ).turns;
    expect(
      turns.some((turn) => turn.agentName === "test-writer"),
      `${sample.id} carries a subagent turn`,
    ).toBe(true);
    expect(
      turns.some((turn) => (turn.toolCalls ?? []).some((call) => call.name === "Task")),
      `${sample.id} carries a subagent launch`,
    ).toBe(true);
  }
});

test("the turn subcategories nest under turns", () => {
  const parentOf = new Map(UNIFIED_GROUPS.map((group) => [group.id, group.parent]));
  expect(parentOf.get("tool-calls")).toBe("turns");
  expect(parentOf.get("turn-identity")).toBe("turns");
  expect(parentOf.get("turn-usage")).toBe("turns");
  for (const sample of samples) {
    for (const view of [sample.native, sample.unified]) {
      const nested = view.groups.filter((group) => group.parent === "turns").map((g) => g.id);
      expect(nested, `${sample.id} ${view.id}`).toEqual([
        "tool-calls",
        "turn-identity",
        "turn-usage",
      ]);
    }
  }
});

test("validation rejects an out-of-range turn index and a selector that matches nothing", () => {
  const badTurn = structuredClone(samples);
  (badTurn[0].unified.document as { turns: Array<{ index: number }> }).turns[0].index = 99;
  expect(() => validateHarnessSamples(badTurn)).toThrow(/index/);

  const badSelector = structuredClone(samples);
  badSelector[0].native.groups[0].selectors = ["notAKey.deep[*]"];
  expect(() => validateHarnessSamples(badSelector)).toThrow(/matches no node|selector/);

  expect(() => validateHarnessSamples(samples.slice(1))).toThrow(/six|6/);
});

test("the section mounts with six harness tabs and the native file first", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  await expect(root).toHaveCount(1);
  await expect(root.locator('[role="tab"][data-harness]')).toHaveCount(HARNESS_IDS.length);
  await expect(root.locator(`[data-harness="${samples[0].id}"]`)).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(root.locator('[data-view="native"]')).toHaveAttribute("aria-pressed", "true");
  await expect(root.locator("[data-schema-filename]")).toHaveText(samples[0].native.filename);
});

test("the segmented control switches to the unified document and resets the active group", async ({
  page,
}) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const firstUnified = samples[0].unified.groups[0];

  await root.locator('[data-view="unified"]').click();

  await expect(root.locator('[data-view="unified"]')).toHaveAttribute("aria-pressed", "true");
  await expect(root.locator("[data-schema-filename]")).toHaveText(samples[0].unified.filename);
  await expect(root.locator(`[data-section="${firstUnified.id}"]`)).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(
    root.locator(`[data-line][data-groups~="${firstUnified.id}"][data-active="true"]`).first(),
  ).toBeAttached();
});

test("the first region is active on load and a section header activates its region", async ({
  page,
}) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const firstGroup = samples[0].native.groups[0];
  const target = samples[0].native.groups[1];

  await expect(root.locator(`[data-section="${firstGroup.id}"]`)).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(
    root.locator(`[data-line][data-groups~="${firstGroup.id}"][data-active="true"]`).first(),
  ).toBeAttached();

  await root.locator(`[data-section="${target.id}"] button`).click();

  await expect(root.locator(`[data-section="${target.id}"]`)).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(
    root.locator(`[data-line][data-groups~="${target.id}"][data-active="true"]`).first(),
  ).toBeAttached();
  await expect(root.locator(`[data-section="${firstGroup.id}"]`)).not.toHaveAttribute(
    "data-active",
    "true",
  );
});

test("a JSON region selects its section on click, not on hover", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const toolCalls = sampleById("claude-code").native.groups.find(
    (group) => group.id === "tool-calls",
  );
  if (!toolCalls) {
    throw new Error("expected a tool-calls group on the claude-code native view");
  }
  const firstGroup = samples[0].native.groups[0];
  const region = root.locator(`[data-line][data-groups~="${toolCalls.id}"]`).first();

  await region.hover();
  await expect(root.locator(`[data-section="${toolCalls.id}"]`)).not.toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(root.locator(`[data-section="${firstGroup.id}"]`)).toHaveAttribute(
    "data-active",
    "true",
  );

  await region.click();
  await expect(root.locator(`[data-section="${toolCalls.id}"]`)).toHaveAttribute(
    "data-active",
    "true",
  );
});

test("a nested category renders indented under turns", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const turns = root.locator('[data-section="turns"]');
  const nested = root.locator('[data-section="turn-usage"]');

  await expect(nested).toHaveAttribute("data-nested", "true");
  const turnsBox = await turns.boundingBox();
  const nestedBox = await nested.boundingBox();
  expect(nestedBox?.x ?? 0).toBeGreaterThan(turnsBox?.x ?? 0);

  await root.locator('[data-line][data-groups~="turn-usage"]').first().click();
  await expect(nested).toHaveAttribute("data-active", "true");
  await expect(turns).not.toHaveAttribute("data-active", "true");
});

test("the active region is tinted with the active section's accent", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const firstGroup = samples[0].native.groups[0];

  await expect(root.locator("[data-json-pane]")).toHaveAttribute(
    "data-accent",
    firstGroup.accent,
  );

  const tint = await page.evaluate(() => {
    const pane = document.querySelector("[data-json-pane]");
    const line = document.querySelector('.mx-json-line[data-active="true"]');
    const section = document.querySelector('.mx-section[data-active="true"]');
    if (!pane || !line || !section) {
      return null;
    }
    const accent = getComputedStyle(section).getPropertyValue("--mx-accent").trim();
    const probe = document.createElement("span");
    probe.style.color = accent;
    document.body.appendChild(probe);
    const accentColor = getComputedStyle(probe).color;
    probe.remove();
    const firstColor = (value: string) => value.match(/rgba?\([^)]*\)/)?.[0] ?? "";
    return {
      paneAccent: pane.getAttribute("data-accent"),
      lineColor: firstColor(getComputedStyle(line).boxShadow),
      accentColor,
    };
  });

  expect(tint?.paneAccent).toBe(firstGroup.accent);
  expect(tint?.lineColor).toBe(tint?.accentColor);
});

test("arrow keys move the active harness tab", async ({ page }) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const first = root.locator(`[data-harness="${samples[0].id}"]`);
  const second = root.locator(`[data-harness="${samples[1].id}"]`);

  await first.focus();
  await page.keyboard.press("ArrowRight");

  await expect(second).toHaveAttribute("aria-selected", "true");
  await expect(second).toBeFocused();
  await expect(root.locator("[data-schema-filename]")).toHaveText(samples[1].native.filename);
});

test("section headers are keyboard operable and only the active one expands", async ({
  page,
}) => {
  await page.goto("/projects");
  const root = page.locator("[data-metadata-explorer]");
  const first = samples[0].native.groups[0];
  const target = samples[0].native.groups[2];
  const header = root.locator(`[data-section="${target.id}"] button`);

  await header.focus();
  await expect(root.locator(`[data-section="${target.id}"]`)).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(header).toHaveAttribute("aria-expanded", "true");
  await expect(root.locator(`[data-section="${first.id}"] button`)).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

for (const theme of THEMES) {
  test(`the schema explorer passes axe in the ${theme} theme`, async ({ page }) => {
    await chooseTheme(page, theme);
    await page.goto("/projects");
    await expect(page.locator("[data-metadata-explorer]")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include("[data-metadata-explorer]")
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
