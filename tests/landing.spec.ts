import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SAMPLE_CARD, SAMPLE_SESSION } from "../lib/sample-session";
import { shareCardAlt, shareCardFromPayload } from "@peasant-labs/fairtrade/share";
import { SESSION } from "../lib/landing";
import { loadLandingFixture, PHONE } from "./landing-fixture";

const fixture = loadLandingFixture();

for (const graph of fixture.graphs) {
  test(`the sample graph renders transcript nodes and returns to reading: ${graph.name}`, async ({ page }) => {
    await page.setViewportSize({ width: graph.width, height: 1000 });
    await page.emulateMedia({ colorScheme: graph.theme, reducedMotion: "reduce" });
    await page.addInitScript((theme) => localStorage.setItem("peasant-labs-theme", theme), graph.theme);
    await page.goto(graph.path);
    const viewer = page.locator(graph.selector);
    await viewer.scrollIntoViewIfNeeded();
    await expect(viewer.locator(".txn-app")).toBeVisible();
    await expect(viewer.locator(".txn-app")).toHaveAttribute("data-theme", graph.theme);
    await viewer.getByRole("tab", { name: /full trace/ }).click();
    await viewer.getByRole("button", { name: "graph", exact: true }).click();
    await expect(viewer.locator(".tb-graph .react-flow")).toBeVisible();
    await expect.poll(() => viewer.locator(".react-flow__node-turn").count()).toBeGreaterThan(0);
    await expect(viewer).not.toContainText("no graph engine");
    await expect(viewer).not.toContainText("graphSlot");
    await viewer.getByRole("button", { name: "list", exact: true }).click();
    await viewer.getByRole("tab", { name: /full trace/ }).click();
    await expect(viewer.locator(".txn-turn").first()).toBeVisible();
  });
}

test("the landing reads in order and carries none of the removed sections", async ({ page }) => {
  const response = await page.goto("/");
  const html = (await response!.text()).toLowerCase();

  await expect(page.locator("h1")).toHaveText(fixture.hero.title);
  await expect(page.locator(".lp-lede")).toHaveText(fixture.hero.lede);
  await expect(page.locator(".lp-pillars li")).toHaveText(fixture.hero.pillars);
  // each tag leads with a drawn icon that the words already explain
  await expect(page.locator('.lp-pillars li > svg[aria-hidden="true"]')).toHaveCount(fixture.hero.pillars.length);

  const order = await page
    .locator("main > section[id]")
    .evaluateAll((sections) => sections.map((section) => section.id));
  expect(order).toEqual(fixture.sections.map((section) => section.id));
  for (const section of fixture.sections) {
    await expect(page.locator(`#${section.id} h2`).first()).toHaveText(section.heading);
  }

  await expect(page.locator("#vision-line")).toHaveText(fixture.vision.line);
  const about = page.getByRole("link", { name: fixture.vision.cta.label, exact: true });
  await expect(about).toHaveAttribute("href", fixture.vision.cta.href);

  for (const phrase of fixture.removed) {
    expect(html, `the landing still says ${JSON.stringify(phrase)}`).not.toContain(phrase);
  }
});

test("the hero's tags sit in one row, two and two, or one column, and its lede ends on a full line", async ({ page }) => {
  for (const { width, rows } of fixture.hero.tagRows) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const layout = await page.evaluate(() => {
      const tags = [...document.querySelectorAll(".lp-pillars li")].map((tag) => tag.getBoundingClientRect());
      const lines = new Map<number, number[]>();
      for (const tag of tags) lines.set(Math.round(tag.top), [...(lines.get(Math.round(tag.top)) ?? []), tag.left]);
      // the lede's lines, by where each of its characters sits
      const lede = document.querySelector(".lp-lede")!;
      const range = document.createRange();
      const widths = new Map<number, [number, number]>();
      const text = lede.firstChild as Text;
      for (let index = 0; index < text.length; index += 1) {
        range.setStart(text, index);
        range.setEnd(text, index + 1);
        const box = range.getBoundingClientRect();
        const top = Math.round(box.top);
        const [left, right] = widths.get(top) ?? [Infinity, -Infinity];
        widths.set(top, [Math.min(left, box.left), Math.max(right, box.right)]);
      }
      const spans = [...widths.values()].map(([left, right]) => right - left);
      return {
        rows: [...lines.values()].map((lefts) => lefts.length),
        // stacked tags share one left edge, so their icons stand in a line
        column: [...lines.values()].every((lefts) => lefts.length === 1) ? new Set([...lines.values()].map(([left]) => Math.round(left!))).size : 1,
        lastShare: spans.at(-1)! / Math.max(...spans),
      };
    });
    expect(layout.rows, `the tags at ${width}`).toEqual(rows);
    expect(layout.column, `the stacked tags do not share an edge at ${width}`).toBe(1);
    expect(layout.lastShare, `the lede ends on a short line at ${width}`).toBeGreaterThan(0.5);
  }
});

test("header and footer carry exactly the fixture destinations", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "site" }).getByRole("link");
  expect(
    await nav.evaluateAll((links) =>
      links.map((link) => ({ label: link.textContent?.trim(), href: link.getAttribute("href") })),
    ),
  ).toEqual(fixture.header.nav);

  const login = page.locator("header").getByRole("link", { name: fixture.header.login.label });
  await expect(login).toHaveAttribute("href", fixture.header.login.href);

  const footer = page.getByRole("navigation", { name: "footer" }).getByRole("link");
  expect(
    await footer.evaluateAll((links) =>
      links.map((link) => ({ label: link.textContent?.trim(), href: link.getAttribute("href") })),
    ),
  ).toEqual(fixture.footer.nav);
});

test("on a phone the footer's links sit on one line", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/about"]) {
    await page.goto(path);
    const tops = await page
      .locator("footer .site-foot-nav a")
      .evaluateAll((links) => new Set(links.map((link) => Math.round(link.getBoundingClientRect().top))).size);
    expect(tops, `the footer's links wrap on ${path}`).toBe(1);
  }
});

test("every page ends with the footer's call to action", async ({ page }) => {
  const { cta } = fixture.footer;
  for (const [path, installHref] of [
    ["/", cta.primary.landingHref],
    ["/about", cta.primary.href],
    ["/projects", cta.primary.href],
  ] as const) {
    await page.goto(path);
    const band = page.locator("footer [data-footer-cta]");
    await expect(band).toContainText(cta.line);
    await expect(band.getByRole("link", { name: cta.primary.label, exact: true })).toHaveAttribute(
      "href",
      installHref,
    );
    await expect(band.getByRole("link", { name: cta.secondary.label, exact: true })).toHaveAttribute(
      "href",
      cta.secondary.href,
    );
    // whitespace, not rules, sets it apart from the page above and the footer's links below
    const rules = await page.evaluate(() => {
      const row = document.querySelector("footer [data-footer-cta]")!;
      return [row.closest("footer")!, row].flatMap((element) => {
        const style = getComputedStyle(element);
        return [style.borderTopWidth, style.borderBottomWidth];
      });
    });
    expect(rules, `a rule runs around the footer's call to action on ${path}`).toEqual(["0px", "0px", "0px", "0px"]);
  }

  // on the landing it is the only call to action after the vision, and install lands on the section
  await page.goto("/");
  await page.locator("footer [data-footer-cta]").getByRole("link", { name: cta.primary.label }).click();
  await expect(page).toHaveURL(/#install$/);
  await expect(page.locator("#install")).toBeInViewport();
});

test("the hero buttons move to their sections, smoothly unless motion is reduced", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("smooth");

  for (const action of [fixture.hero.primary, fixture.hero.secondary]) {
    await page.goto("/");
    await page.locator(".lp-ctas").getByRole("link", { name: action.label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${action.target}$`));
    await expect(page.locator(`#${action.target}`)).toBeInViewport();
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("the install card is fairtrade's tabs and CommandBlocks, one terminal command and one agent prompt", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const shell = page.locator("[data-install-shell]");
    // fairtrade's own parts, as the docs use them: its tablist and its command blocks; nothing of our own
    await expect(shell.locator('[role="tablist"].tabs')).toHaveCount(1);
    await expect(shell.locator(".mac-win, .gs-prompt, .gs-copy")).toHaveCount(0);

    for (const platform of fixture.install.platforms) {
      const tab = shell.getByRole("tab", { name: platform.label });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      const panel = shell.locator('[role="tabpanel"]:not([hidden])');
      const lines = panel.locator(".gs-line");
      await expect(lines).toHaveCount(2);
      // fairtrade draws its muted "$" before each command; the line's characters are the command's, so a selection copies it
      const drawn = await lines.locator(".cli-cmd code").evaluateAll((codes) => codes.map((code) => code.textContent));
      expect(drawn).toEqual(
        [`$ ${platform.command}`],
      );
      await expect(lines.locator(".gs-note")).toHaveText([platform.note, fixture.install.notes[1]!]);
      await expect(lines.locator(".gs-n")).toHaveText(["1", "2"]);

      await expect(lines.last().locator(".gs-agent-prompt p")).toHaveText(fixture.install.prompt);
      await expect(lines.last().locator(".cli-cmd, .cli-cmd-sigil")).toHaveCount(0);
      expect(await lines.last().locator(".gs-agent-prompt").evaluate((prompt) => {
        const box = prompt.getBoundingClientRect();
        const copy = prompt.querySelector("button")!.getBoundingClientRect();
        return Math.abs(box.right - parseFloat(getComputedStyle(prompt).paddingRight) - copy.right) <= 2;
      }), "the prompt copy action aligns with the right edge").toBe(true);
      const rows = await lines.first().evaluateAll((items) =>
        items.map((item) => {
          const block = item.querySelector(".cli-cmd")!.getBoundingClientRect();
          const line = item.querySelector<HTMLElement>(".cli-cmd-line")!;
          const code = item.querySelector(".cli-cmd code")!.getBoundingClientRect();
          const copy = item.querySelector(".cli-copy")!.getBoundingClientRect();
          return {
            // the command's line sits inside its block, never under the copy button; it shows whole, or on a
            // phone scrolls sideways inside its block
            whole:
              line.getBoundingClientRect().right <= copy.left + 1 &&
              code.width > 0 &&
              (code.right <= line.getBoundingClientRect().right + 1 || line.scrollWidth > line.clientWidth),
            // commands read at the 16px floor, as in the docs
            size: getComputedStyle(item.querySelector(".cli-cmd-line")!).fontSize,
            // the copy button is a full tap target at the block's right edge
            target: copy.height >= 44 && copy.width >= 44 && Math.abs(copy.right - block.right) < 2,
            // the block runs across its row, not just around its command
            across: block.width >= item.getBoundingClientRect().width * 0.8,
          };
        }),
      );
      for (const row of rows) {
        expect(row, `a row is off at ${width} on ${platform.label}`).toEqual({
          whole: true,
          size: "16px",
          target: true,
          across: true,
        });
      }
    }

    // the rows stand apart by space: no rule between them
    expect(
      await shell
        .locator('[role="tabpanel"]:not([hidden]) .gs-line')
        .evaluateAll((rows) => rows.filter((row) => getComputedStyle(row).borderTopWidth !== "0px").length),
    ).toBe(0);

    // The prompt copies as plain text for the agent, never an executable terminal action.
    const promptLine = shell.locator('[role="tabpanel"]:not([hidden]) .gs-line').last();
    await promptLine.getByRole("button").click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(fixture.install.prompt);

    // every command copies exactly, and says so
    const command = fixture.install.platforms.at(-1)!.command;
    const first = shell.locator('[role="tabpanel"]:not([hidden]) .gs-line').first();
    await first.getByRole("button", { name: new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    await expect(first.locator(".cli-copy")).toContainText("copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(command);

    // the tabs are fairtrade's tablist: arrow keys move between systems
    await shell.getByRole("tab", { name: fixture.install.platforms[0]!.label }).click();
    await shell.getByRole("tab", { name: fixture.install.platforms[0]!.label }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(shell.getByRole("tab", { name: fixture.install.platforms[1]!.label })).toBeFocused();
  }
});

test("on a wide screen the install card keeps every command whole on its line, with the docs link beside the title", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const section = page.locator("#install");
  const guide = section.getByRole("link", { name: fixture.install.guide.label });
  await expect(guide).toHaveAttribute("href", fixture.install.guide.href);
  await expect(section.getByRole("link", { name: fixture.install.installGuide.label })).toHaveCount(0);
  // nothing scrolls: each command shows whole, on one line
  const lines = await section
    .locator('[role="tabpanel"]:not([hidden]) .cli-cmd-line')
    .evaluateAll((items) => items.map((line) => line.scrollWidth <= line.clientWidth + 1));
  expect(lines).toEqual([true]);
});

test("on a phone each install step is a small step label, its words, then its command on one line that scrolls sideways inside its block", async ({
  browser,
}) => {
  for (const width of fixture.install.phoneWidths) {
    const context = await browser.newContext({
      ...PHONE,
      viewport: { width, height: 844 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    // what the copy button hands the clipboard, read back exactly
    await context.addInitScript(() => {
      const write = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = (text: string) => {
        (window as unknown as { copied: string[] }).copied = [
          ...((window as unknown as { copied?: string[] }).copied ?? []),
          text,
        ];
        return write(text);
      };
    });
    const page = await context.newPage();
    await page.goto("/");
    const section = page.locator("#install");
    const shell = section.locator("[data-install-shell]");
    const at = `at ${width}`;
    // the longest command: the suite's browser says it runs on Windows, so the card opens on that system's tab
    await shell.getByRole("tab", { name: fixture.install.platforms[0]!.label }).click();
    // measured once the panel has finished coming in (the commands' fade runs on their scroll, not on time)
    await expect
      .poll(() =>
        shell.evaluate(
          (element) =>
            element.getAnimations({ subtree: true }).filter((animation) => animation.timeline instanceof DocumentTimeline && animation.playState === "running").length,
        ),
      )
      .toBe(0);
    // the link beside the title gives way to a quiet one under the card, to the install guide
    await expect(section.getByRole("link", { name: fixture.install.guide.label })).toHaveCount(0);
    const guide = section.getByRole("link", { name: fixture.install.installGuide.label });
    await expect(guide).toHaveAttribute("href", fixture.install.installGuide.href);
    const [card, link] = [(await shell.boundingBox())!, (await guide.boundingBox())!];
    expect(link.y, `the install guide link is not under the card ${at}`).toBeGreaterThan(card.y + card.height);
    expect(link.height).toBeGreaterThanOrEqual(44);

    const geometry = await shell.evaluate((element) => {
      const probe = document.createElement("div");
      probe.style.width = "var(--sp-5)";
      element.append(probe);
      const groups = probe.getBoundingClientRect().width;
      probe.style.width = "var(--sp-2)";
      const caption = probe.getBoundingClientRect().width;
      probe.style.width = "var(--sp-1)";
      const label = probe.getBoundingClientRect().width;
      probe.remove();
      const card = element.getBoundingClientRect();
      const edge = document.querySelector("#install-title")!.getBoundingClientRect().left;
      const blocks = [...element.querySelectorAll('[role="tabpanel"]:not([hidden]) :is(.cli-cmd, .gs-agent-prompt)')];
      const rows = [...element.querySelectorAll('[role="tabpanel"]:not([hidden]) .gs-line:first-child')].map((row) => {
        const n = row.querySelector(".gs-n")!.getBoundingClientRect();
        const note = row.querySelector(".gs-note")!.getBoundingClientRect();
        const block = row.querySelector(".cli-cmd")!.getBoundingClientRect();
        const line = row.querySelector<HTMLElement>(".cli-cmd-line")!;
        const code = line.querySelector("code")!;
        const copy = row.querySelector(".cli-copy")!.getBoundingClientRect();
        return {
          // the number leads the words on their first line, and both stand above the command
          // the step's label on its own line, then the words, then the command
          order: n.bottom <= note.top + 1 && note.bottom <= block.top + 1,
          label: `${getComputedStyle(row.querySelector(".gs-n")!, "::before").content}${row.querySelector(".gs-n")!.textContent}`,
          labelGap: Math.round(note.top - n.bottom - label),
          mark: getComputedStyle(row.querySelector(".gs-n")!, "::after").content,
          // the label, the words and the command share the page's one edge, the title's: no hanging indent
          edge: [n.left, note.left, block.left].every((left) => Math.abs(left - edge) < 1),
          captionGap: Math.round(block.top - note.bottom - caption),
          blockTop: block.top,
          blockBottom: block.bottom,
          labelTop: n.top,
          // one line, never wrapped, across the card's whole width
          oneLine: Math.round(code.getBoundingClientRect().height / parseFloat(getComputedStyle(code).lineHeight)) === 1,
          across: Math.abs(block.left - card.left) < 2 && Math.abs(block.right - card.right) < 2,
          scrolls: line.scrollWidth > line.clientWidth,
          fades: getComputedStyle(line).maskImage !== "none",
          lineBeforeCopy: line.getBoundingClientRect().right <= copy.left + 1,
          target: copy.width >= 44 && copy.height >= 44,
        };
      });
      return {
        groups,
        rows,
        // no card on a phone: no frame, and nothing under the last command
        frame: getComputedStyle(element).borderTopWidth,
        band: Math.round(card.bottom - blocks.at(-1)!.getBoundingClientRect().bottom),
      };
    });
    expect(geometry.frame, `the install card keeps its frame ${at}`).toBe("0px");
    expect(geometry.band, `an empty band stands under the last command ${at}`).toBe(0);
    for (const [index, row] of geometry.rows.entries()) {
      const name = `step ${index + 1} ${at}`;
      expect(row.order, `${name}: the label, words and command are out of order`).toBe(true);
      expect(row.label, `${name}: the step's label`).toBe(`"step "${index + 1}`);
      expect(Math.abs(row.labelGap), `${name}: the words do not sit just under the label`).toBeLessThanOrEqual(1);
      expect(["none", "normal"], `${name}: a mark stands beside the step`).toContain(row.mark);
      expect(row.edge, `${name}: the label, words or command are off the page's edge`).toBe(true);
      expect(Math.abs(row.captionGap), `${name}: the words do not sit the docs' caption gap above the command`).toBeLessThanOrEqual(1);
      expect(row.oneLine, `${name}: the command wraps`).toBe(true);
      expect(row.across, `${name}: the command does not run across the card`).toBe(true);
      expect(row.fades, `${name}: the command has no fade at its edge`).toBe(true);
      expect(row.lineBeforeCopy, `${name}: the command runs under its copy button`).toBe(true);
      expect(row.target, `${name}: the copy button is not a full tap target`).toBe(true);
      const next = geometry.rows[index + 1];
      if (next) {
        expect(Math.abs(next.labelTop - row.blockBottom - geometry.groups), `${name}: the steps do not stand the docs' group gap apart`).toBeLessThanOrEqual(2);
      }
    }
    // the long address scrolls inside its block; the page itself never scrolls sideways
    expect(geometry.rows[0]!.scrolls, `the curl line does not scroll ${at}`).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    // scrolled to its end, the line shows the command's last word, unfaded
    const end = await shell.locator('[role="tabpanel"]:not([hidden]) .gs-line').first().locator(".cli-cmd-line").evaluate(async (line) => {
      line.scrollTo({ left: line.scrollWidth, behavior: "instant" });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const code = line.querySelector("code")!;
      const range = document.createRange();
      range.selectNodeContents(code);
      return { last: range.getBoundingClientRect().right <= line.getBoundingClientRect().right + 1 };
    });
    expect(end.last, `the end of the curl line cannot be reached ${at}`).toBe(true);
    // a command that scrolls is a scroll area a keyboard reaches and moves, named as fairtrade names its own
    const curl = shell.locator('[role="tabpanel"]:not([hidden]) .gs-line').first().locator(".cli-cmd-line");
    await expect(curl).toHaveAttribute("tabindex", "0");
    await expect(curl).toHaveAttribute("role", "region");
    await expect(curl).toHaveAttribute("aria-label", `command: ${fixture.install.platforms[0]!.command}`);
    await curl.evaluate((line) => line.scrollTo({ left: 0, behavior: "instant" }));
    await curl.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => curl.evaluate((line) => line.scrollLeft)).toBeGreaterThan(0);
    // The agent's prose wraps rather than pretending to be a terminal scroll area.
    const prompt = shell.locator('[role="tabpanel"]:not([hidden]) .gs-agent-prompt');
    await expect(prompt.locator(".cli-cmd-line, code, pre")).toHaveCount(0);
    expect(await prompt.locator("p").evaluate((text) => text.scrollWidth <= text.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include("#install").withRules(["scrollable-region-focusable"]).analyze();
    expect(axe.violations, `a scrolling command cannot be reached ${at}`).toEqual([]);
    // the copy button gives the exact bytes
    const command = fixture.install.platforms[0]!.command;
    const first = shell.locator('[role="tabpanel"]:not([hidden]) .gs-line').first();
    await first.locator(".cli-copy").click();
    await expect(first.locator(".cli-copy")).toContainText("copied");
    expect(await page.evaluate(() => (window as unknown as { copied?: string[] }).copied)).toEqual([command]);
    await context.close();
  }
});

test("the use cases are one row of all twelve capabilities, each tagged with its audience, then the docs card, all in the served page", async ({
  page,
}) => {
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await expect(row).toHaveAttribute("aria-roledescription", "carousel");
  await expect(row).toHaveAttribute("role", "region");
  await expect(row.getByRole("tab")).toHaveCount(0);
  // no arrows and no counter: the row is the way through
  await expect(row.getByRole("button")).toHaveCount(0);

  const cards = row.locator(".uc-card");
  const { more } = fixture.useCases;
  const all = [
    ...fixture.useCases.slides.flatMap((slide) =>
      slide.capabilities.map((capability, index) => ({
        tag: slide.label,
        capability,
        detail: slide.details[index]!,
        picture: slide.pictures[index]!,
      })),
    ),
    // the last card leads on to the docs, in the same shape
    { tag: more.tag, capability: more.text, detail: more.detail, picture: more.picture },
  ];
  await expect(cards).toHaveCount(all.length);
  for (const [index, { tag, capability, detail, picture }] of all.entries()) {
    const card = cards.nth(index);
    await expect(card.locator("h3")).toHaveText(capability);
    await expect(card.locator(".uc-cap-detail")).toHaveText(detail);
    // a small tag names the audience, with its icon, the card's one icon besides the docs card's arrow
    await expect(card.locator(".uc-tag")).toHaveText(tag);
    await expect(card.locator(".uc-tag svg")).toHaveCount(1);
    await expect(card.locator("h3 svg, .uc-cap-detail svg, figure svg")).toHaveCount(0);
    // each picture's address carries its content hash, so a redrawn picture is fetched fresh
    await expect(card.locator("img").first()).toHaveAttribute(
      "src",
      new RegExp(`^/art/${picture}-(light|dark)\\.png\\?v=[0-9a-f]{8}$`),
    );
  }
  // only the docs card carries an action
  await expect(cards.getByRole("link")).toHaveCount(1);
  await expect(cards.last().getByRole("link", { name: more.cta.label, exact: true })).toHaveAttribute(
    "href",
    more.cta.href,
  );
  // one pass through the cards: none is repeated
  await expect(row.locator(".uc-card")).toHaveCount(all.length);

  // every headline and every description is in the page as served, for search engines and readers without script
  // (read as text: a command in the words is set in its own code element)
  const served = (await (await page.request.get("/")).text())
    .replace(/<[^>]*>/g, "")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
  for (const { capability, detail } of all) {
    expect(served, `the served page is missing ${JSON.stringify(capability)}`).toContain(capability);
    expect(served, `the served page is missing ${JSON.stringify(detail)}`).toContain(detail);
  }

  // once the row shows, every card's picture loads, so none pops in as its card drifts or is swiped into view
  await row.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      cards.locator("img").evaluateAll((images) =>
        images.filter((image) => getComputedStyle(image).display !== "none" && !(image as HTMLImageElement).naturalWidth).length,
      ),
    )
    .toBe(0);

  // with focus the arrow keys move the row, and focus holds its drift
  await row.focus();
  const before = await row.evaluate((element) => element.scrollLeft);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);

  // the whole docs card is its action's target: a tap on its picture opens the docs
  await row.hover();
  await row.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: "instant" }));
  const picture = (await cards.last().locator("figure").boundingBox())!;
  await page.mouse.click(picture.x + picture.width / 2, picture.y + picture.height / 2);
  await expect(page).toHaveURL(new RegExp(`${more.cta.href}$`));
});

test("every picture on the site is addressed by its content hash, so a redrawn picture is never served stale", async ({
  page,
}) => {
  const hashes = new Map<string, string>();
  const folder = resolve("public/art");
  for (const name of readdirSync(folder)) {
    hashes.set(name, createHash("sha256").update(readFileSync(resolve(folder, name))).digest("hex").slice(0, 8));
  }
  for (const path of ["/", "/docs", "/blog", `/blog/${fixture.posts[0]!.slug}`]) {
    await page.goto(path);
    const sources = await page
      .locator('img[src^="/art/"]')
      .evaluateAll((images) => images.map((image) => image.getAttribute("src")!));
    expect(sources.length, `${path} shows no picture`).toBeGreaterThan(0);
    for (const source of sources) {
      const [, name, version] = /^\/art\/([^?]+)\?v=([0-9a-f]{8})$/.exec(source) ?? [];
      expect(name, `${path}: ${source} carries no content hash`).toBeTruthy();
      expect(version, `${path}: ${source} is not addressed by its file's content`).toBe(hashes.get(name!));
    }
  }
});

test("every card has one shape, on the same lines across the row: picture, tag, a one-line headline on a wide screen, three lines of words", async ({
  page,
}) => {
  for (const shape of fixture.useCases.shape) {
    await page.setViewportSize({ width: shape.width, height: 900 });
    await page.goto("/");
    const geometry = await page.evaluate(() => {
      const row = document.querySelector("[data-use-cases]") as HTMLElement;
      const cards = [...row.querySelectorAll<HTMLElement>(".uc-card")];
      const lines = (element: Element) =>
        element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight);
      // unrounded, offset by the card's own left: offsetTop rounds, and the row is moving
      const tops = (selector: string) => {
        const values = cards.map((card) => card.querySelector(selector)!.getBoundingClientRect().top);
        return Math.max(...values) - Math.min(...values);
      };
      const amber = (() => {
        const probe = document.createElement("span");
        probe.style.color = getComputedStyle(document.documentElement).getPropertyValue("--amber").trim();
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      })();
      return {
        widths: cards.map((card) => card.getBoundingClientRect().width),
        sizes: new Set(cards.map((card) => `${card.offsetWidth}x${card.offsetHeight}`)).size,
        figures: new Set(cards.map((card) => `${card.querySelector<HTMLElement>(".uc-figure")!.offsetWidth}x${card.querySelector<HTMLElement>(".uc-figure")!.offsetHeight}`)).size,
        rows: tops(".uc-figure"),
        tags: tops(".uc-tag"),
        headlines: tops(".uc-cap-text"),
        words: tops(".uc-cap-detail"),
        headlineLines: cards.map((card) => {
          const headline = card.querySelector(".uc-cap-text")!;
          // the words themselves, not the room kept for them
          const range = document.createRange();
          range.selectNodeContents(headline);
          return range.getClientRects().length === 0
            ? 0
            : Math.round(range.getBoundingClientRect().height / parseFloat(getComputedStyle(headline).lineHeight));
        }),
        headlineRoom: cards.map((card) => Math.round(lines(card.querySelector(".uc-cap-text")!))),
        // the docs card's words keep only their own room, its action right under them
        wordsRoom: cards.filter((card) => !card.querySelector(".uc-cta")).map((card) => lines(card.querySelector(".uc-cap-detail")!)),
        docsWords: lines(cards.at(-1)!.querySelector(".uc-cap-detail")!),
        wordsClamp: getComputedStyle(cards[0]!.querySelector(".uc-cap-detail")!).webkitLineClamp,
        fades: getComputedStyle(row).maskImage !== "none",
        room: Math.min(
          ...cards.map((card) => {
            const figure = card.querySelector(".uc-figure")!.getBoundingClientRect();
            const art = card.querySelector(".uc-art")!.getBoundingClientRect();
            return Math.min(art.left - figure.left, figure.right - art.right, art.top - figure.top, figure.bottom - art.bottom);
          }),
        ),
        // every picture sits on its own tinted panel, as wide as the card, so the panel's edges are the words' edges
        panels: cards.filter((card) => {
          const figure = card.querySelector(".uc-figure")!;
          const box = figure.getBoundingClientRect();
          const words = card.querySelector(".uc-cap-detail")!.getBoundingClientRect();
          return (
            getComputedStyle(figure).backgroundColor !== getComputedStyle(document.body).backgroundColor &&
            Math.abs(box.left - words.left) < 1 &&
            Math.abs(box.width - card.getBoundingClientRect().width) < 1
          );
        }).length,
        // amber is the picture's alone: the tag's icon and the docs card's action are in ink
        amber: cards.filter((card) =>
          [".uc-ic", ".uc-cta"].some((selector) => {
            const element = card.querySelector(selector);
            return element !== null && getComputedStyle(element).color === amber;
          }),
        ).length,
        count: cards.length,
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    const at = `at ${shape.width}`;
    const [low, high] = shape.card;
    expect(geometry.sizes, `the cards are not one size ${at}`).toBe(1);
    expect(geometry.figures, `the pictures' panels are not one size ${at}`).toBe(1);
    expect(Math.min(...geometry.widths), `card width ${at}`).toBeGreaterThanOrEqual(low);
    expect(Math.max(...geometry.widths), `card width ${at}`).toBeLessThanOrEqual(high);
    for (const [part, spread] of [
      ["pictures", geometry.rows],
      ["tags", geometry.tags],
      ["headlines", geometry.headlines],
      ["words", geometry.words],
    ] as const) {
      expect(spread, `the ${part} do not share one line across the row ${at}`).toBeLessThan(1);
    }
    expect(
      geometry.headlineLines.every((count) => count >= 1 && count <= shape.headline),
      `a headline takes more than ${shape.headline} line(s) ${at}: ${geometry.headlineLines}`,
    ).toBe(true);
    expect(new Set(geometry.headlineRoom), `the headlines keep different room ${at}`).toEqual(new Set([shape.headline]));
    expect(geometry.wordsClamp, `the words are not held to ${fixture.useCases.detailLines} lines ${at}`).toBe(
      String(fixture.useCases.detailLines),
    );
    expect(Math.round(geometry.docsWords), `the docs card's words run past ${fixture.useCases.detailLines} lines ${at}`).toBeLessThanOrEqual(
      fixture.useCases.detailLines,
    );
    for (const room of geometry.wordsRoom) {
      expect(Math.round(room), `a card's words do not keep ${fixture.useCases.detailLines} lines ${at}`).toBe(
        fixture.useCases.detailLines,
      );
    }
    expect(geometry.fades, `the row does not fade at its edges ${at}`).toBe(true);
    expect(geometry.room, `a picture is crowded in its space ${at}`).toBeGreaterThanOrEqual(16);
    expect(geometry.panels, `a picture has no panel across its card ${at}`).toBe(geometry.count);
    expect(geometry.amber, `a card's tag or action is amber ${at}`).toBe(0);
    expect(geometry.pageOverflow, `page overflows ${at}`).toBe(false);
  }
});

test("the row runs from edge to edge of the screen, fading softly at both, from the first card on the title's edge to the docs card on the content's right edge", async ({
  page,
}) => {
  for (const [width, motion] of [
    [1440, "no-preference"],
    [1280, "no-preference"],
    [390, "no-preference"],
    [1440, "reduce"],
    [390, "reduce"],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/");
    const row = page.locator("[data-use-cases]");
    const at = `at ${width}, ${motion}`;
    const edges = () =>
      page.evaluate(() => {
        const row = document.querySelector<HTMLElement>("[data-use-cases]")!;
        const cards = [...row.querySelectorAll<HTMLElement>(".uc-card")];
        const content = document.querySelector("#uses .lp-head")!.getBoundingClientRect();
        const box = row.getBoundingClientRect();
        const mask = getComputedStyle(row).maskImage;
        return {
          rowLeft: box.left,
          rowRight: box.right,
          viewport: document.documentElement.clientWidth,
          contentLeft: content.left,
          contentRight: content.right,
          first: cards[0]!.getBoundingClientRect().left,
          last: cards.at(-1)!.getBoundingClientRect().right,
          // transparent at both screen edges, solid between
          fades: mask.startsWith("linear-gradient(to right, rgba(0, 0, 0, 0)") && mask.endsWith("rgba(0, 0, 0, 0))"),
          clones: row.querySelectorAll('[aria-hidden="true"].uc-card').length,
        };
      });
    // before it moves, the first card stands on the title's edge
    const start = await edges();
    expect(start.rowLeft, `the row does not reach the screen's left edge ${at}`).toBe(0);
    expect(Math.abs(start.rowRight - start.viewport), `the row does not reach the screen's right edge ${at}`).toBeLessThan(1);
    expect(start.fades, `the row does not fade at both edges ${at}`).toBe(true);
    expect(start.clones, `the row repeats its cards ${at}`).toBe(0);
    expect(Math.abs(start.first - start.contentLeft), `the first card is off the title's edge ${at}`).toBeLessThan(2);
    // at the end, the docs card's right edge stands on the content's right edge
    await row.hover();
    await row.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: "instant" }));
    const end = await edges();
    expect(Math.abs(end.last - end.contentRight), `the docs card is off the content's right edge ${at}`).toBeLessThan(2);
  }
});

test("the row drifts slowly and evenly to its end, rests, glides back to the start, rests, and drifts again; hovering holds it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.mouse.move(0, 0);
  await expect(row).toHaveAttribute("data-playing", "true");
  // nothing pulls it onto a card
  expect(await row.evaluate((element) => getComputedStyle(element).scrollSnapType)).toBe("none");
  // a few pixels every few frames, never standing and never jumping: an even drift
  const samples = await row.evaluate(async (element) => {
    const out: number[] = [];
    await new Promise((resolve) => setTimeout(resolve, 800));
    for (let index = 0; index < 12; index += 1) {
      out.push(element.scrollLeft);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return out;
  });
  const steps = samples.slice(1).map((value, index) => value - samples[index]!);
  for (const step of steps) {
    expect(step, `the drift stood or jumped: ${samples}`).toBeGreaterThan(1);
    expect(step, `the drift stood or jumped: ${samples}`).toBeLessThan(20);
  }

  // near the end it drifts on to the end and rests there, then goes back to the start in one eased move,
  // rests, and drifts on; recorded every frame
  const trace = await row.evaluate(async (element) => {
    const end = element.scrollWidth - element.clientWidth;
    element.scrollTo({ left: end - 20, behavior: "instant" });
    const out: { t: number; left: number }[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const frame = (now: number) => {
        out.push({ t: now - start, left: element.scrollLeft });
        if (now - start < 7000) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    return { end, out };
  });
  const { end, out } = trace;
  const atEnd = out.filter((point) => Math.abs(point.left - end) < 1);
  const rest = atEnd.at(-1)!.t - atEnd[0]!.t;
  expect(rest, "the row did not rest at its end for about two seconds").toBeGreaterThan(1700);
  expect(rest).toBeLessThan(2600);
  const back = out.filter((point) => point.t > atEnd.at(-1)!.t && point.left > 1);
  const leftEnd = out.findIndex((point) => point.t > atEnd.at(-1)!.t);
  const home = out.findIndex((point, index) => index > leftEnd && point.left < 1);
  expect(home, "the row did not come back to its start").toBeGreaterThan(0);
  const way = out[home]!.t - out[leftEnd]!.t;
  // one eased move, not a jump: well over a second, through many places, never turning round
  expect(way, "the way back was not one move of a second or so").toBeGreaterThan(1000);
  expect(way).toBeLessThan(1900);
  expect(back.length).toBeGreaterThan(30);
  for (const [index, point] of back.entries()) {
    if (index) expect(point.left, "the way back turned round").toBeLessThanOrEqual(back[index - 1]!.left + 1);
  }
  // it rests at the start for about a second, then drifts on
  const atStart = out.filter((point, index) => index >= home && point.left < 1);
  const pause = atStart.at(-1)!.t - atStart[0]!.t;
  expect(pause, "the row did not rest at its start for about a second").toBeGreaterThan(700);
  expect(pause).toBeLessThan(1600);
  expect(out.at(-1)!.left, "the row did not drift on after its rest").toBeGreaterThan(1);

  // hovering holds it where it is
  await row.hover();
  await expect(row).toHaveAttribute("data-playing", "false");
  const held = await row.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(1500);
  expect(await row.evaluate((element) => element.scrollLeft)).toBe(held);
  // left at its end by a hand, it goes back to the start all the same once the pointer leaves
  await row.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: "instant" }));
  await page.mouse.move(0, 0);
  await expect.poll(() => row.evaluate((element) => element.scrollLeft), { timeout: 6000 }).toBeLessThan(1);
});

test("under reduced motion the row never moves on its own, not even back from its end, and snaps to each card by hand", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.mouse.move(0, 0);
  await expect(row).toHaveAttribute("data-playing", "false");
  expect(await row.evaluate((element) => getComputedStyle(element).scrollSnapType)).toBe("x mandatory");
  await page.waitForTimeout(1500);
  expect(await row.evaluate((element) => element.scrollLeft)).toBe(0);
  const end = await row.evaluate((element) => {
    element.scrollTo({ left: element.scrollWidth, behavior: "instant" });
    return element.scrollWidth - element.clientWidth;
  });
  await page.waitForTimeout(4500);
  expect(Math.abs((await row.evaluate((element) => element.scrollLeft)) - end)).toBeLessThan(1);
});

/* where the row stands, as a share of how far it can scroll, and where the line's mark stands along the room it has */
async function rowAndMark(page: Page) {
  return page.evaluate(() => {
    const row = document.querySelector<HTMLElement>("[data-use-cases]")!;
    const line = document.querySelector(".uc-progress")!.getBoundingClientRect();
    const mark = document.querySelector(".uc-progress-mark")!.getBoundingClientRect();
    const end = row.scrollWidth - row.clientWidth;
    return {
      left: row.scrollLeft,
      end,
      at: row.scrollLeft / end,
      mark: (mark.left - line.left) / (line.width - mark.width),
      first: row.querySelector(".uc-card")!.getBoundingClientRect().left,
      last: row.querySelector(".uc-card:last-child")!.getBoundingClientRect().right,
      selected: String(window.getSelection()),
      dragging: row.hasAttribute("data-dragging"),
    };
  });
}

/* press, move the mouse by dx in even steps, and hold still before letting go unless it is a flick */
async function dragBy(page: Page, x: number, y: number, dx: number, { flick = false } = {}) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  const steps = flick ? 5 : 15;
  for (let index = 1; index <= steps; index += 1) {
    await page.mouse.move(x + (dx * index) / steps, y);
    if (!flick) await page.waitForTimeout(16);
  }
  // a flick lets go while still moving; read only after, so the release lands inside the flick
  if (flick) {
    await page.mouse.up();
    return rowAndMark(page);
  }
  const during = await rowAndMark(page);
  await page.waitForTimeout(200);
  await page.mouse.up();
  return during;
}

test("a mouse drags the row one to one from a picture or the words, and the line moves with it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  const card = row.locator(".uc-card").nth(1);
  for (const part of [".uc-figure", ".uc-cap-detail"]) {
    const box = (await card.locator(part).boundingBox())!;
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    await page.mouse.move(x, y);
    await expect(row).toHaveAttribute("data-playing", "false");
    const before = await rowAndMark(page);
    const during = await dragBy(page, x, y, -300);
    expect(Math.abs(during.left - before.left - 300), `a drag from ${part} did not move the row with the hand`).toBeLessThan(4);
    expect(during.dragging).toBe(true);
    expect(during.mark - before.mark, `the line did not follow a drag from ${part}`).toBeGreaterThan(0.03);
    expect(Math.abs(during.mark - during.at), `the line does not show where the row is after a drag from ${part}`).toBeLessThan(0.01);
    await page.waitForTimeout(400);
    const after = await rowAndMark(page);
    // a drag that came to rest before letting go stays where the hand left it, with nothing selected
    expect(Math.abs(after.left - during.left)).toBeLessThan(2);
    expect(after.selected).toBe("");
    expect(after.dragging).toBe(false);
  }

  // a flick glides on after letting go, and comes to a stop
  const box = (await card.locator(".uc-figure").boundingBox())!;
  const flung = await dragBy(page, box.x + box.width / 2, box.y + box.height / 2, -200, { flick: true });
  await page.waitForTimeout(1200);
  const glided = await rowAndMark(page);
  expect(glided.left - flung.left, "a flick did not glide on").toBeGreaterThan(20);
  await page.waitForTimeout(400);
  expect((await rowAndMark(page)).left).toBe(glided.left);
});

test("dragged past either end, the cards give way a little and spring back, and the row stays at its end", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  const box = (await row.locator(".uc-card").nth(1).locator(".uc-figure").boundingBox())!;
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(x, y);
  await row.evaluate((element) => element.scrollTo({ left: 0, behavior: "instant" }));
  const start = await rowAndMark(page);
  // past the start: the row stays at 0 and the first card follows the hand only part of the way
  const before = await dragBy(page, x, y, 300);
  expect(before.left).toBe(0);
  expect(before.first - start.first, "the cards did not give way past the start").toBeGreaterThan(20);
  expect(before.first - start.first, "the cards followed the hand past the start").toBeLessThan(150);
  await expect.poll(async () => Math.abs((await rowAndMark(page)).first - start.first)).toBeLessThan(1);

  // past the end, the same the other way
  await row.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: "instant" }));
  const end = await rowAndMark(page);
  const after = await dragBy(page, x, y, -300);
  expect(Math.abs(after.left - end.end)).toBeLessThan(1);
  expect(end.last - after.last, "the cards did not give way past the end").toBeGreaterThan(20);
  expect(end.last - after.last, "the cards followed the hand past the end").toBeLessThan(150);
  expect(after.mark, "the line is not at its end").toBeGreaterThan(0.99);
  await expect.poll(async () => Math.abs((await rowAndMark(page)).last - end.last)).toBeLessThan(1);
});

test("under reduced motion a drag still moves the row, then it stands on the nearest card, with no glide", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  const box = (await row.locator(".uc-card").nth(1).locator(".uc-figure").boundingBox())!;
  const during = await dragBy(page, box.x + box.width / 2, box.y + box.height / 2, -300);
  expect(Math.abs(during.left - 300)).toBeLessThan(4);
  const pitch = await row.evaluate((element) => {
    const cards = element.querySelectorAll<HTMLElement>(".uc-card");
    return cards[1]!.offsetLeft - cards[0]!.offsetLeft;
  });
  await expect.poll(async () => (await rowAndMark(page)).left).toBe(pitch);
  expect(await row.evaluate((element) => getComputedStyle(element).scrollSnapType)).toBe("x mandatory");
});

test("the wheel scrolls the row, and the line moves with it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await row.hover();
  await expect(row).toHaveAttribute("data-playing", "false");
  const before = await rowAndMark(page);
  await page.mouse.wheel(300, 0);
  await expect.poll(async () => (await rowAndMark(page)).left - before.left).toBeGreaterThan(290);
  const after = await rowAndMark(page);
  expect(after.mark - before.mark).toBeGreaterThan(0.03);
  expect(Math.abs(after.mark - after.at)).toBeLessThan(0.01);
});

test("a click that barely moves is still a click: the docs card opens the docs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await row.hover();
  await row.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: "instant" }));
  const link = (await row.locator(".uc-cta").boundingBox())!;
  await page.mouse.move(link.x + 20, link.y + link.height / 2);
  await page.mouse.down();
  await page.mouse.move(link.x + 23, link.y + link.height / 2);
  await page.mouse.up();
  await expect(page).toHaveURL(new RegExp(`${fixture.useCases.more.cta.href}$`));
});

test("on a phone the row drifts too, holds under a finger, and moves on again after it lets go", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.scrollIntoViewIfNeeded();
  expect(await row.evaluate((element) => getComputedStyle(element).scrollSnapType)).toBe("none");
  const start = await row.evaluate((element) => element.scrollLeft);
  await expect.poll(() => row.evaluate((element) => element.scrollLeft), { timeout: 4000 }).toBeGreaterThan(start + 10);
  // a finger on the row holds it
  await row.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true });
  await expect(row).toHaveAttribute("data-playing", "false");
  await row.dispatchEvent("pointerup", { pointerType: "touch", isPrimary: true });
  await expect(row).toHaveAttribute("data-playing", "true", { timeout: 5000 });
  await context.close();
});

test("a quiet line under the row marks where it is, from its start to its end, and is no control", async ({ page }) => {
  for (const motion of ["no-preference", "reduce"] as const) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/");
    const row = page.locator("[data-use-cases]");
    const line = page.locator(".uc-progress");
    // a reading, not a control: hidden from assistive technology, with nothing to press, and one mark
    await expect(line).toHaveAttribute("aria-hidden", "true");
    await expect(line.locator("button, a")).toHaveCount(0);
    await expect(line.locator(".uc-progress-mark")).toHaveCount(1);
    // it sits under the row, on the title's edge
    const edges = await page.evaluate(() => ({
      line: document.querySelector(".uc-progress")!.getBoundingClientRect(),
      row: document.querySelector("[data-use-cases]")!.getBoundingClientRect(),
      title: document.querySelector("#uses-title")!.getBoundingClientRect().left,
    }));
    expect(edges.line.top).toBeGreaterThan(edges.row.bottom - 1);
    expect(Math.abs(edges.line.left - edges.title)).toBeLessThan(2);

    // held still and moved by hand, the mark stands as far along its line as the row is along its way
    await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await row.hover();
    for (const share of [0, 0.25, 0.5, 1]) {
      await row.evaluate((element, share) => {
        element.scrollTo({ left: (element.scrollWidth - element.clientWidth) * share, behavior: "instant" });
      }, share);
      await expect
        .poll(async () => Math.abs((await rowAndMark(page)).mark - share), { message: `${motion} at ${share}` })
        .toBeLessThan(motion === "reduce" ? 0.12 : 0.01);
    }
    // the mark is as long as the share of the row on screen
    const span = await page.evaluate(() => {
      const line = document.querySelector(".uc-progress")!.getBoundingClientRect();
      return document.querySelector(".uc-progress-mark")!.getBoundingClientRect().width / line.width;
    });
    expect(span).toBeGreaterThan(0.1);
    expect(span).toBeLessThan(0.4);
  }
});

test("every section opens on its title alone on a row, in one style at one edge, with room before its content", async ({
  page,
}) => {
  for (const [width, least] of [
    [1440, 48],
    [390, 32],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const heads = await page.evaluate(() =>
      ["uses", "install", "session"].map((id) => {
        const head = document.querySelector(`#${id} .lp-head`) as HTMLElement;
        const title = head.querySelector("h2")!;
        // the content that follows: the head's next sibling, or, when the head sits alone in its wrap, the wrap's
        const content = (head.nextElementSibling ?? head.parentElement!.nextElementSibling) as HTMLElement;
        const style = getComputedStyle(title);
        return {
          id,
          // a title shares its row with one short link at most, never with the section's content
          others: [...head.children].filter((child) => child !== title).map((child) => child.tagName),
          room: content.getBoundingClientRect().top - head.getBoundingClientRect().bottom,
          left: Math.round(title.getBoundingClientRect().left),
          size: style.fontSize,
          family: style.fontFamily,
        };
      }),
    );
    for (const head of heads) {
      expect(head.others.every((tag) => tag === "A"), `#${head.id} shares its title row at ${width}`).toBe(true);
      expect(head.others.length, `#${head.id} crowds its title row at ${width}`).toBeLessThanOrEqual(1);
      expect(head.room, `too little room under #${head.id}'s title at ${width}`).toBeGreaterThanOrEqual(least);
    }
    expect(new Set(heads.map((head) => head.left)).size, `the titles do not share one edge at ${width}`).toBe(1);
    expect(new Set(heads.map((head) => `${head.size} ${head.family}`)).size, `the titles differ at ${width}`).toBe(1);
  }
});

test("the selected landing sections share an open ground and coherent responsive reading order", async ({ page }) => {
  for (const layout of fixture.hero.flow.layouts) {
    const { width, colorScheme, missionBeside, missionArtMax, titleLines } = layout;
    const at = `${width}, ${colorScheme}`;
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const mission = page.locator(".lp-vision-inner");
    await expect(mission.locator("#vision-line")).toHaveText(fixture.vision.line);
    await expect(mission.locator(".lp-vision-story")).toHaveText(fixture.vision.story);
    await expect(page.locator(".lp-lede")).toHaveText(fixture.hero.lede);
    const composition = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON();
      const midpoint = (selector: string) => { const box = rect(selector); return (box.left + box.right) / 2; };
      const lines = (selector: string) => {
        const root = document.querySelector(selector)!;
        const range = document.createRange();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const rows = new Map<number, string>();
        while (walker.nextNode()) {
          const text = walker.currentNode as Text;
          for (let index = 0; index < text.length; index += 1) {
            range.setStart(text, index); range.setEnd(text, index + 1);
            const top = Math.round(range.getBoundingClientRect().top);
            rows.set(top, (rows.get(top) ?? "") + text.data[index]);
          }
        }
        return [...rows.values()].map((row) => row.trim()).filter(Boolean);
      };
      const unframed = (selector: string) => {
        const style = getComputedStyle(document.querySelector(selector)!);
        return style.backgroundColor === "rgba(0, 0, 0, 0)" && style.borderTopWidth === "0px";
      };
      const lead = document.querySelector("#vision-line")!;
      const story = document.querySelector(".lp-vision-story")!;
      const titleStyle = getComputedStyle(document.querySelector("#hero-title")!);
      const closingStyle = getComputedStyle(document.querySelector(".site-foot-close .site-foot-line")!);
      return {
        titleLines: lines("#hero-title"),
        titleLeading: parseFloat(titleStyle.lineHeight) / parseFloat(titleStyle.fontSize),
        closingLines: lines(".site-foot-close .site-foot-line"),
        closingLeading: parseFloat(closingStyle.lineHeight) / parseFloat(closingStyle.fontSize),
        centered: ["#hero-title", ".lp-lede", ".lp-ctas", ".site-foot-close-art", ".site-foot-close-words"].map((selector) => Math.abs(midpoint(selector) - innerWidth / 2)),
        open: [".hf-panel", ".lp-vision-inner", ".site-foot-close-panel"].map(unframed),
        missionWords: rect(".lp-vision-words"), missionArt: rect(".lp-vision-art"),
        closeArt: rect(".site-foot-close-art"), closeWords: rect(".site-foot-close-words"),
        closeButtons: [...document.querySelectorAll(".site-foot-close .site-foot-actions .btn")].map((button) => button.getBoundingClientRect().toJSON()),
        leadFace: getComputedStyle(lead).fontFamily === getComputedStyle(story).fontFamily,
        leadSize: parseFloat(getComputedStyle(lead).fontSize),
        leading: parseFloat(getComputedStyle(lead).lineHeight) / parseFloat(getComputedStyle(lead).fontSize),
        reading: [...document.querySelectorAll(".lp-lede, .lp-vision-story")].map((element) => parseFloat(getComputedStyle(element).fontSize)),
        paragraphEndings: ["#vision-line", ".lp-vision-story:nth-of-type(2)", ".lp-vision-story:nth-of-type(3)"].map((selector) => lines(selector).at(-1)),
        pageOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(composition.titleLines, at).toEqual(titleLines);
    if (composition.titleLines.length > 1) expect(composition.titleLeading, `wrapped hero leading ${at}`).toBeGreaterThanOrEqual(1.4);
    if (composition.closingLines.length > 1) expect(composition.closingLeading, `wrapped closing leading ${at}`).toBeGreaterThanOrEqual(1.4);
    for (const offset of composition.centered) expect(offset, `centered hero and final CTA ${at}`).toBeLessThanOrEqual(1);
    expect(composition.open, `the sections share the page ground ${at}`).toEqual([true, true, true]);
    if (missionBeside) {
      expect(composition.missionWords.right, `mission text leads left ${at}`).toBeLessThan(composition.missionArt.left);
      expect(Math.abs((composition.missionWords.top + composition.missionWords.bottom - composition.missionArt.top - composition.missionArt.bottom) / 2), `mission stays together ${at}`).toBeLessThan(2);
    } else {
      expect(composition.missionWords.bottom, `mission reads before its picture ${at}`).toBeLessThan(composition.missionArt.top);
    }
    expect(composition.missionArt.width, at).toBeLessThanOrEqual(missionArtMax);
    expect(Math.abs(composition.missionArt.width - composition.missionArt.height), at).toBeLessThan(1);
    expect(composition.closeArt.bottom, `house precedes final invitation ${at}`).toBeLessThan(composition.closeWords.top);
    expect(composition.closeArt.width, `quiet closing illustration ${at}`).toBeLessThan(composition.missionArt.width);
    expect(composition.closeButtons).toHaveLength(2);
    expect(Math.abs(composition.closeButtons[0]!.height - composition.closeButtons[1]!.height), at).toBeLessThan(1);
    expect(Math.abs(composition.closeButtons[0]!.top - composition.closeButtons[1]!.top), `compact CTA row ${at}`).toBeLessThan(1);
    expect(composition.leadFace && composition.leadSize <= 28, `readable proportional mission lead ${at}`).toBe(true);
    expect(composition.leading, at).toBeGreaterThanOrEqual(1.5);
    expect(Math.min(...composition.reading), at).toBeGreaterThanOrEqual(16);
    for (const ending of composition.paragraphEndings) expect(ending, `no single-word paragraph endings ${at}`).toContain(" ");
    expect(composition.pageOverflow, at).toBe(0);
  }
  await page.goto("/about");
  await expect(page.locator("footer .site-foot-close-panel")).toHaveCount(0);
});

test("/about carries the owner's statement in full, word for word", async ({ page }) => {
  await page.goto("/about");
  const vision = page.locator(".pj-vision");
  // the lead line is the page's heading, the story its paragraphs
  await expect(vision.locator("h1, p")).toHaveText([fixture.vision.line, ...fixture.vision.story]);
});

test("whitespace, not rules, separates the sections, with generous room between them", async ({ page }) => {
  for (const [width, least] of [
    [1440, 160],
    [390, 96],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const rhythm = await page.evaluate(() => {
      // how it works holds its own screen, so the rhythm is read where two padded sections meet
      const ids = ["install", "session"];
      return ids.map((id) => {
        const section = document.getElementById(id)!;
        const next = section.nextElementSibling as HTMLElement;
        const style = getComputedStyle(section);
        return {
          id,
          border: style.borderBottomWidth,
          room: parseFloat(style.paddingBottom) + parseFloat(getComputedStyle(next).paddingTop),
        };
      });
    });
    for (const { id, border, room } of rhythm) {
      expect(border, `a rule runs under #${id} at ${width}`).toBe("0px");
      expect(room, `too little room after #${id} at ${width}`).toBeGreaterThanOrEqual(least);
    }
  }
});

test("how it works: three steps, each with its scene; choosing one makes it current without moving the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const steps = page.locator(".hw-step");
  await expect(steps.locator(".hw-step-title")).toHaveText(fixture.how.steps.map((step) => step.title));
  // each step is illustrated by its icon
  await expect(steps.locator("svg.hw-ic")).toHaveCount(fixture.how.steps.length);
  // the scene is the screen itself: no window shell, caption or step arrows around it
  await expect(page.locator(".hw-titlebar")).toHaveCount(0);
  await expect(page.locator("#how .hw-count")).toHaveCount(0);
  await expect(page.locator("#how").getByRole("button", { name: /step$/ })).toHaveCount(0);
  await expect(page.locator("#how")).not.toContainText("simplified view");
  // the scenes have no controls of their own: no replay, pause or resume
  await expect(page.locator("#how").getByRole("button", { name: /replay|pause|resume|play/ })).toHaveCount(0);
  // (the buttons drawn inside a scene are part of its picture, which nobody can tab into)
  await expect(page.locator("#how .hw-window button:not(.scn-screen *)")).toHaveCount(0);
  await expect(page.locator(".hw-step-body")).toHaveText(fixture.how.steps.map((step) => step.body));
  // a command named in the copy is code that never breaks across lines
  const command = page.locator(".hw-step-body .lp-nowrap").first();
  await expect(command.locator("code")).toHaveText("/peasant");
  expect(await command.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe("nowrap");
  const list = page.locator(".hw-steps");
  let listHeight: number | null = null;
  await settle(page);
  await scrollToStep(page, 0);
  const scrolled = await page.evaluate(() => window.scrollY);

  for (const [index] of fixture.how.steps.entries()) {
    await handOn(page, steps.nth(index), "press");
    await expect(steps.nth(index)).toHaveAttribute("aria-pressed", "true");
    // the step changes, the page stays where the reader left it
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
    await expect(steps.nth(index)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".hw-steps > li").nth(index)).toHaveAttribute("data-on", "true");
    // only the current step's description is open; the others show their title alone
    await expect
      .poll(() =>
        page
          .locator(".hw-step-more")
          .evaluateAll((parts) => parts.map((part) => part.getBoundingClientRect().height > 1)),
      )
      .toEqual(fixture.how.steps.map((_, at) => at === index));
    // and the list keeps one height whichever step is open, so nothing below it moves
    const height = await list.evaluate((element) => element.getBoundingClientRect().height);
    if (listHeight === null) listHeight = height;
    expect(Math.abs(height - listHeight)).toBeLessThan(1);
    // the section is held while it is read: the window stays on screen
    await expect(page.locator(".hw-window")).toBeInViewport();
    const view = page.locator(".hw-scroll .hw-view");
    await expect(view).toHaveAttribute("role", "img");
    expect((await view.getAttribute("aria-label"))?.length ?? 0).toBeGreaterThan(20);
    // the scene is fairtrade's components on a screen nobody can tab into
    await expect(view.locator(".scn-screen").first()).toHaveAttribute("inert", "");
    // on a Mac: the menu bar, and windows with their three buttons
    const layer = view.locator('.hw-layer[data-on="true"]');
    await expect(layer).toHaveCount(1);
    await expect(layer.locator(".mac-menubar")).toHaveCount(1);
    expect(await layer.locator(".mac-win .mac-lights").count()).toBeGreaterThan(0);
    // the camera carries the screen and the pointer, nothing drawn around a click
    await expect(view.locator(".scn-camera > :not(.scn-screen, .scn-cursor)")).toHaveCount(0);
    // every scene has macOS's pointer, the arrow and the I-beam it turns into over text
    await expect(layer.locator(".scn-cursor .scn-arrow")).toHaveCount(1);
    await expect(layer.locator(".scn-cursor .scn-ibeam")).toHaveCount(1);
  }

  // the publish action in the scene keeps its label on one line, whatever state it shows
  const label = page.locator('.hw-layer[data-scene="publish"] [data-focus="publish"]');
  await expect(label.locator('.scn-swap-item[data-on="true"]')).toHaveText(
    new RegExp(`^(${fixture.how.publishLabel}|publishing)$`),
  );
  expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);

  // the scenes keep to the words their step needs: no addresses, no crumb trail, no session ids
  const scenes = page.locator(".hw-scroll .hw-view");
  expect(await scenes.locator(".mac-address-text").allTextContents()).toEqual(["", "", ""]);
  for (const word of ["localhost", "sess_", "sessions"]) await expect(scenes).not.toContainText(word);

  // the record scene is the terminal and the browser, not a list of other sessions behind
  await handOn(page, steps.nth(0), "press");
  const record = page.locator('.hw-scroll .hw-view[data-scene="record"]');
  await expect(record.locator(".mac-win-terminal")).toHaveCount(1);
  await expect(record.locator(".mac-win-terminal .mac-title")).toHaveText(/^shop — (zsh|claude) — 80×24$/);
  await expect(record.locator("table")).toHaveCount(0);
});

test("on a short phone the held block still fits under the header", async ({ browser }) => {
  const context = await browser.newContext({ ...PHONE, viewport: { width: 375, height: 667 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + 667 * 0.6);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const header = document.querySelector(".site-bar")!.getBoundingClientRect();
        const title = document.querySelector(".hw-scroll h2")!.getBoundingClientRect();
        const steps = document.querySelector(".hw-steps")!.getBoundingClientRect();
        return title.top >= header.bottom && steps.bottom <= window.innerHeight;
      }),
    )
    .toBe(true);
  await context.close();
});

test("held on a wide screen, the block sits centred whether the header is away or back, and reading down never brings it back", async ({
  browser,
}) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1728, height: 1117 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto("/");
    const header = page.locator(".site-bar");
    const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
    const centred = () =>
      page.evaluate(() => {
        const bar = document.querySelector(".site-bar")!.getBoundingClientRect();
        const title = document.querySelector(".hw-scroll h2")!.getBoundingClientRect();
        const scene = document.querySelector(".hw-scroll .hw-view")!.getBoundingClientRect();
        const steps = document.querySelector(".hw-steps")!.getBoundingClientRect();
        const above = title.top - Math.max(0, bar.bottom);
        const below = window.innerHeight - Math.max(scene.bottom, steps.bottom);
        return above > 0 && Math.abs(above - below) < 4;
      });
    // read down into it and through it with the wheel, the way a reader does: the header steps away and stays away
    // (wheel steps of 80px: five carry the reader from just above the section into its first step, three more stay within it)
    await page.evaluate((y) => window.scrollTo({ top: y - 200, behavior: "instant" }), top);
    await page.mouse.move(5, 5);
    for (let step = 0; step < 5; step += 1) {
      await page.mouse.wheel(0, 80);
      await page.waitForTimeout(40);
    }
    // away means out of view, not only marked as away
    const outOfView = () => header.evaluate((bar) => bar.getBoundingClientRect().bottom <= 1);
    await expect(header).toHaveAttribute("data-hidden", "true");
    await expect.poll(outOfView).toBe(true);
    await expect.poll(centred).toBe(true);
    for (let step = 0; step < 3; step += 1) {
      await page.mouse.wheel(0, 80);
      await page.waitForTimeout(40);
      await expect(header).toHaveAttribute("data-hidden", "true");
      await expect.poll(outOfView).toBe(true);
    }
    // a little back up brings the header back, and the block comes down with it, centred under it
    await page.mouse.wheel(0, -80);
    await expect(header).toHaveAttribute("data-hidden", "false");
    await expect.poll(centred).toBe(true);
    await context.close();
  }
});

test("scrolling walks the held section through steps 1, 2 and 3, then lets the page go on", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
  const steps = page.locator(".hw-step");
  // one sign of the scroll: the current step's bar along its rule, and no other progress or cue
  // (the scan bar drawn inside the review scene is part of its picture)
  await expect(page.locator("#how :is([role=progressbar], .rail, .hw-cue):not(.scn-screen *)")).toHaveCount(0);
  const fills = page.locator(".hw-step-fill");
  await expect(fills).toHaveCount(fixture.how.steps.length);
  // the section is held for 1.2 screens, 0.4 of a screen per step: the middle of each step's third, then past it
  for (const [index, offset] of [0.2, 0.6, 1.0].entries()) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + 900 * offset);
    await expect(steps.nth(index)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".hw-window")).toBeInViewport();
    // the current step's bar fills as its scene plays, and only its bar shows
    await expect.poll(() => fills.nth(index).evaluate((fill) => new DOMMatrix(getComputedStyle(fill).transform).a)).toBeGreaterThan(0);
    await expect
      .poll(() => fills.evaluateAll((all) => all.map((fill) => getComputedStyle(fill).opacity !== "0")))
      .toEqual(fixture.how.steps.map((_, at) => at === index));
  }
  // after the third step the section lets go and the next one arrives
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + 900 * 2.2);
  await expect(page.locator("#session")).toBeInViewport();
});

/*
 * Points at, presses or taps the middle of an element where it is on screen,
 * the way a reader's hand does: once it has stopped moving (the held block
 * slides when the header comes and goes), and without scrolling the page
 * first, which Playwright's own actions may do to an element that is held.
 */
async function handOn(page: Page, target: Locator, gesture: "point" | "press" | "tap") {
  const still = () =>
    target.evaluate(
      (element) =>
        new Promise<boolean>((done) => {
          const before = element.getBoundingClientRect();
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const after = element.getBoundingClientRect();
              done(before.x === after.x && before.y === after.y);
            }),
          );
        }),
    );
  await expect.poll(still).toBe(true);
  const box = (await target.boundingBox())!;
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  if (gesture === "point") await page.mouse.move(x, y);
  else if (gesture === "tap") await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/* waits for the page to stop moving under the reader: fonts set, eager pictures in, two frames painted */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((image) => !image.complete && image.loading !== "lazy")
        .map((image) => new Promise((done) => (image.onload = image.onerror = done))),
    );
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
}

/* the middle of a step's third of the held scroll */
async function scrollToStep(page: Page, index: number) {
  const { top, height } = await page.evaluate(() => ({
    top: document.querySelector("#how")!.getBoundingClientRect().top + window.scrollY,
    height: window.innerHeight,
  }));
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + height * (0.2 + 0.4 * index));
  await expect(page.locator(".hw-step").nth(index)).toHaveAttribute("aria-pressed", "true");
}

/* the current step, its bar, and its scene's frame: where its camera and pointer are, and how far its screen has got */
const howNow = (page: Page) =>
  page.evaluate(() => {
    const layer = document.querySelector('.hw-scroll .hw-layer[data-on="true"]')!;
    const camera = getComputedStyle(layer.querySelector(".scn-camera")!).transform;
    const cursor = layer.querySelector(".scn-cursor");
    const step = [...document.querySelectorAll(".hw-step")].findIndex((step) => step.getAttribute("aria-pressed") === "true");
    return {
      step,
      bar: new DOMMatrix(getComputedStyle(document.querySelectorAll(".hw-step-fill")[step]!).transform).a,
      frame: [camera, cursor ? getComputedStyle(cursor).transform : "", layer.querySelector(".scn-screen")!.innerHTML.length].join(" | "),
      scrollY: window.scrollY,
    };
  });

/*
 * Watches the current step until the next one takes over, at most `within`
 * ms: how many different frames its scene showed, how far its bar got, and
 * which step came next.
 */
async function watchStep(page: Page, within = 15_000) {
  const first = await howNow(page);
  const frames = new Set([first.frame]);
  let bar = first.bar;
  const start = Date.now();
  for (;;) {
    await page.waitForTimeout(150);
    const now = await howNow(page);
    if (now.step !== first.step || Date.now() - start > within) {
      return { step: first.step, frames: frames.size, bar, next: now.step, scrollY: now.scrollY };
    }
    frames.add(now.frame);
    bar = Math.max(bar, now.bar);
  }
}

test("in view, the steps play on by themselves, record, review, publish and record again, each scene playing through, with a pointer resting on it or after a tap", async ({
  browser,
}) => {
  test.setTimeout(150_000);
  for (const [kind, options] of [
    ["wide", { viewport: { width: 1440, height: 900 } }],
    ["phone", PHONE],
  ] as const) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.goto("/");
    await settle(page);
    await scrollToStep(page, 0);
    const scrollY = await page.evaluate(() => window.scrollY);
    // a pointer resting on the screen, the way it rests while a reader scrolls, or a tap on it, never stops it
    const view = page.locator(".hw-scroll .hw-view");
    await handOn(page, view, kind === "wide" ? "point" : "tap");
    await expect(page.locator('.hw-scroll .hw-layer[data-on="true"] .scn-view')).toHaveAttribute("data-paused", "false");
    const order = [0];
    for (let turn = 0; turn < fixture.how.steps.length; turn += 1) {
      const watched = await watchStep(page);
      const title = fixture.how.steps[watched.step]!.title;
      expect(watched.frames, `the ${title} scene stood still (${kind})`).toBeGreaterThan(5);
      expect(watched.bar, `the ${title} bar did not fill with its scene (${kind})`).toBeGreaterThan(0.85);
      expect(watched.next, `the ${title} step did not hand over to the next one (${kind})`).toBe(
        (watched.step + 1) % fixture.how.steps.length,
      );
      // the page never moves: only the step and its scene change
      expect(watched.scrollY, `the page moved at the ${title} step (${kind})`).toBe(scrollY);
      order.push(watched.next);
    }
    expect(order, `the steps did not play on in order (${kind})`).toEqual([0, 1, 2, 0]);
    await context.close();
  }
});

test("the steps play on after the header steps away and comes back", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await settle(page);
  const header = page.locator(".site-bar");
  const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
  // wheel into the first step the way a reader does, the pointer on the screen: the header steps away
  await page.evaluate((y) => window.scrollTo({ top: y - 200, behavior: "instant" }), top);
  const box = (await page.locator(".hw-scroll .hw-view").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let step = 0; step < 6; step += 1) {
    await page.mouse.wheel(0, 80);
    await page.waitForTimeout(40);
  }
  await expect(header).toHaveAttribute("data-hidden", "true");
  // a little back up brings it back, and on down it steps away again
  await page.mouse.wheel(0, -80);
  await expect(header).toHaveAttribute("data-hidden", "false");
  await page.mouse.wheel(0, 80);
  await expect(header).toHaveAttribute("data-hidden", "true");
  await expect(page.locator(".hw-step").first()).toHaveAttribute("aria-pressed", "true");
  const watched = await watchStep(page);
  expect(watched.frames, "the scene stood still after the header came and went").toBeGreaterThan(5);
  expect(watched.next, "the next step did not take over after the header came and went").toBe(1);
  const next = await watchStep(page, 3000);
  expect(next.frames, "the next scene stood still after the header came and went").toBeGreaterThan(3);
});

test("choosing a step plays its scene from the start, and scrolling into a third still makes its step current", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await settle(page);
  await scrollToStep(page, 0);
  const steps = page.locator(".hw-step");
  const scrollY = await page.evaluate(() => window.scrollY);
  // choosing the step that is already current starts its take again: a fresh screen, its bar back at the start
  await handOn(page, steps.nth(2), "press");
  await expect(steps.nth(2)).toHaveAttribute("aria-pressed", "true");
  const take = page.locator('.hw-scroll .hw-layer[data-on="true"] .scn-view');
  await expect.poll(async () => (await howNow(page)).bar).toBeGreaterThan(0.2);
  await take.evaluate((view) => (view.dataset.earlier = "true"));
  await handOn(page, steps.nth(2), "press");
  await expect(page.locator('.hw-scroll .hw-layer[data-on="true"] .scn-view[data-earlier]')).toHaveCount(0);
  expect((await howNow(page)).bar).toBeLessThan(0.2);
  expect(await page.evaluate(() => window.scrollY), "choosing a step moved the page").toBe(scrollY);
  // the reader's scroll into another third makes that step current, and the steps play on from there
  await scrollToStep(page, 1);
  const watched = await watchStep(page);
  expect(watched.step).toBe(1);
  expect(watched.next).toBe(2);
});

test("a scene plays only while it can be seen, and keyboard focus holds it, and the stepping, where it is", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await settle(page);
  await scrollToStep(page, 0);
  const view = page.locator(".hw-scroll .hw-view");
  const take = page.locator('.hw-layer[data-on="true"] .scn-view');
  await expect(take).toHaveAttribute("data-paused", "false");
  // the screen is one described image, and it takes focus so a keyboard can hold it
  await expect(view).toHaveAttribute("role", "img");
  await expect(view).toHaveAttribute("tabindex", "0");

  // tabbing to it holds the take exactly where it is: once every move under way has stopped, nothing changes
  await page.locator(".hw-step").last().evaluate((step) => step.focus({ preventScroll: true }));
  await page.keyboard.press("Tab");
  await expect(view).toBeFocused();
  await expect(take).toHaveAttribute("data-paused", "true");
  const settled = () =>
    page.evaluate(() =>
      document
        .querySelector('.hw-scroll .hw-layer[data-on="true"]')!
        .getAnimations({ subtree: true })
        .every((animation) => animation.playState !== "running"),
    );
  await expect.poll(settled).toBe(true);
  const held = await howNow(page);
  await page.waitForTimeout(1000);
  expect(await howNow(page), "the take or the steps moved while the keyboard held them").toEqual(held);
  // moving on lets it carry on
  await page.keyboard.press("Shift+Tab");
  await expect(take).toHaveAttribute("data-paused", "false");
  await expect.poll(async () => (await howNow(page)).frame).not.toBe(held.frame);

  // scrolled away, it holds too
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator('.hw-layer[data-on="true"] .scn-view')).toHaveAttribute("data-paused", "true");
});

test("every word in a scene reads at a real size, on a wide screen and on a phone", async ({ browser }) => {
  for (const [kind, options] of [
    ["wide", { viewport: { width: 1440, height: 900 } }],
    ["phone", PHONE],
  ] as const) {
    const floor = fixture.how.readable[kind];
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.goto("/");
    const height = page.viewportSize()!.height;
    const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
    for (const [index] of fixture.how.steps.entries()) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + height * (index * 0.4 + 0.2));
      await page.waitForTimeout(1800);
      const smallest = await page.evaluate(() => {
        const layer = document.querySelector('.hw-scroll .hw-layer[data-on="true"]')!;
        const view = layer.querySelector(".scn-view")!.getBoundingClientRect();
        const lens = new DOMMatrix(getComputedStyle(layer.querySelector(".scn-camera")!).transform).a;
        let least = Infinity;
        const walker = document.createTreeWalker(layer.querySelector(".scn-screen")!, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const box = range.getBoundingClientRect();
          const inView = box.width > 0 && box.right > view.left && box.left < view.right && box.bottom > view.top && box.top < view.bottom;
          const shown = node.parentElement!.checkVisibility({ opacityProperty: true, visibilityProperty: true });
          if (inView && shown) least = Math.min(least, parseFloat(getComputedStyle(node.parentElement!).fontSize) * lens);
        }
        return least;
      });
      expect(smallest, `${kind} step ${index + 1}: text at ${smallest.toFixed(1)}px`).toBeGreaterThanOrEqual(floor - 0.05);
    }
    await context.close();
  }
});

test("on a phone the title, scene and steps hold centred under the header, one step open at a time", async ({
  browser,
}) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/");
  const items = page.locator(".hw-steps > li");
  await expect(items).toHaveCount(fixture.how.steps.length);
  const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
  const height = page.viewportSize()!.height;
  for (const [index, offset] of [0.2, 0.6, 1.0].entries()) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + height * offset);
    await expect(items.nth(index)).toHaveAttribute("data-on", "true");
    await expect
      .poll(() =>
        page
          .locator(".hw-step-more")
          .evaluateAll((parts) => parts.map((part) => part.getBoundingClientRect().height > 1)),
      )
      .toEqual(fixture.how.steps.map((_, at) => at === index));
    // (measured once the fonts have set the title's height, which the block's centring reads)
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const title = document.querySelector(".hw-scroll h2")!.getBoundingClientRect();
          const list = document.querySelector(".hw-steps")!.getBoundingClientRect();
          const header = document.querySelector(".site-bar")!.getBoundingClientRect();
          return Math.abs(title.top - header.bottom - (window.innerHeight - list.bottom)) < 4;
        }),
      )
      .toBe(true);
    const layout = await page.evaluate(() => {
      const title = document.querySelector(".hw-scroll h2")!.getBoundingClientRect();
      const scene = document.querySelector(".hw-scroll .hw-view")!.getBoundingClientRect();
      const list = document.querySelector(".hw-steps")!.getBoundingClientRect();
      const header = document.querySelector(".site-bar")!.getBoundingClientRect();
      return {
        above: title.top - header.bottom,
        below: window.innerHeight - list.bottom,
        gap: list.top - scene.bottom,
        fits: list.bottom <= window.innerHeight,
      };
    });
    // the block sits as far under the header as it ends above the screen's foot
    expect(layout.above, `the title is under the header at step ${index + 1}`).toBeGreaterThanOrEqual(0);
    expect(Math.abs(layout.above - layout.below), `the block is off centre at step ${index + 1}`).toBeLessThan(4);
    expect(layout.gap, `the steps do not sit right under the scene at step ${index + 1}`).toBeLessThanOrEqual(24);
    expect(layout.fits, `the steps run off the screen at step ${index + 1}`).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await context.close();
});

test("under reduced motion the steps stack, each scene on its finished frame, with nothing moving", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hw-scroll")).toHaveCount(0);
  const views = page.locator(".hw-stacked .hw-view");
  await expect(views).toHaveCount(fixture.how.finals.length);
  for (const final of fixture.how.finals) {
    const view = page.locator(`.hw-stacked .hw-view[data-scene="${final.scene}"]`);
    for (const text of final.texts) {
      await expect(view, `${final.scene} does not show ${text}`).toContainText(text);
    }
  }
  await expect(page.locator(".hw-stacked .scn-cursor")).toHaveCount(0);
  expect(
    await page.locator(".hw-stacked").evaluate((section) => section.getAnimations({ subtree: true }).length),
  ).toBe(0);
});

test("the sample session carries the figures a share card shows", () => {
  const figures = fixture.session.figures;
  const turns = SAMPLE_SESSION.turns ?? [];
  expect(SAMPLE_SESSION.model).toBe(figures.model);
  expect(SAMPLE_SESSION.totalTokens).toBe(figures.totalTokens);
  expect(SAMPLE_SESSION.inputSubmissionCount).toBe(figures.inputSubmissionCount);
  expect(turns.filter((turn) => turn.role === "user")).toHaveLength(figures.inputSubmissionCount);
  expect(turns[0]?.content).toBe(fixture.session.firstAsk);
  // the total sits on the session alone: no turn carries a usage count of its own
  for (const turn of turns) expect(Object.keys(turn).filter((key) => /token|usage/i.test(key))).toEqual([]);
});

test("the share card's figures are the sample's own prompt count and token total", () => {
  expect(SAMPLE_CARD.figures).toEqual(fixture.card.figures);
  expect(SAMPLE_CARD.firstPrompt).toBe(fixture.session.firstAsk);
  // it names the session by the title the transcript browser shows, never by its id
  expect(SAMPLE_CARD.title).toBe(fixture.session.title);
  expect(shareCardFromPayload(SAMPLE_SESSION)?.figures).toEqual(SAMPLE_CARD.figures);
});

/* the X thread in the session section, scrolled into view */
async function openThread(page: Page) {
  await page.goto("/");
  // the window's thread; a phone's copy without the window waits hidden until the windows give way
  const thread = page.locator("#session .lp-windows [data-x-thread]");
  await thread.scrollIntoViewIfNeeded();
  await expect(thread).toBeVisible();
  return thread;
}

test("the X thread's three posts carry their names, handles, times and words, and the first its chart", async ({
  page,
}) => {
  const thread = await openThread(page);
  const posts = thread.locator(".lp-x-post");
  await expect(posts).toHaveCount(fixture.thread.posts.length);
  for (const [index, post] of fixture.thread.posts.entries()) {
    const shown = posts.nth(index);
    await expect(shown.locator(".lp-x-name")).toHaveText(post.name);
    await expect(shown.locator(".lp-x-handle")).toHaveText(post.handle);
    await expect(shown.locator(".lp-x-time")).toHaveText(post.time);
    if (post.text) await expect(shown.locator(".lp-x-text")).toHaveText(post.text);
    else await expect(shown.locator(".lp-x-text")).toHaveCount(0);
  }
  // the chart's bars, oldest model first, each the pass rate the sample's own table reports
  const bars = posts.first().locator(".lp-x-bar");
  expect(await bars.locator(".lp-x-bar-label").allInnerTexts()).toEqual(fixture.thread.chart.map((bar) => bar.label));
  expect(await bars.locator(".lp-x-bar-value").allInnerTexts()).toEqual(fixture.thread.chart.map((bar) => `${bar.value}%`));
  const sample = JSON.stringify(SAMPLE_SESSION);
  for (const bar of fixture.thread.chart) expect(sample).toContain(`| ${bar.value}% (`);
  // a taller bar for a higher pass rate
  const heights = await bars.locator(".lp-x-bar-fill").evaluateAll((fills) => fills.map((fill) => fill.getBoundingClientRect().height));
  expect([...heights].sort((a, b) => a - b)).toEqual(heights);
  // X's one separator sits between each handle and its time and nowhere else; no emoji stands in for an icon
  const text = await thread.innerText();
  expect(text.split("·")).toHaveLength(fixture.thread.posts.length + 1);
  expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  // the post text reads at X's own size
  const sizes = await thread
    .locator(".lp-x-text, .lp-x-name, .lp-x-handle, .lp-x-time")
    .evaluateAll((items) => items.map((item) => parseFloat(getComputedStyle(item).fontSize)));
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(15);
});

test("every post in the X thread has its more dots at its top right, hidden from assistive technology", async ({
  page,
}) => {
  const thread = await openThread(page);
  const more = thread.locator(".lp-x-more");
  await expect(more).toHaveCount(fixture.thread.posts.length);
  for (const [index] of fixture.thread.posts.entries()) {
    const dots = more.nth(index);
    await expect(dots).toHaveAttribute("aria-hidden", "true");
    const place = await dots.evaluate((element) => {
      const post = element.closest(".lp-x-post")!.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      const head = element.closest(".lp-x-post")!.querySelector(".lp-x-name")!.getBoundingClientRect();
      return { right: post.right - box.right, top: box.top - post.top, middle: Math.abs((box.top + box.bottom) / 2 - (head.top + head.bottom) / 2) };
    });
    // in from the post's right edge by its padding, on the line of the name
    expect(place.right, `post ${index + 1}`).toBeLessThanOrEqual(20);
    expect(place.top, `post ${index + 1}`).toBeLessThanOrEqual(20);
    expect(place.middle, `post ${index + 1}`).toBeLessThanOrEqual(4);
  }
  // every post carries X's actions: reply, repost, like, views, then bookmark and share
  const actions = thread.locator(".lp-x-actions");
  await expect(actions).toHaveCount(fixture.thread.posts.length);
  for (const [index] of fixture.thread.posts.entries()) {
    expect(
      await actions.nth(index).locator("[data-action]").evaluateAll((items) => items.map((item) => item.getAttribute("data-action"))),
    ).toEqual(fixture.thread.actions);
  }
});

test("the X thread reads once as a short group, the card as one image named by its alt, its icons hidden", async ({
  page,
}) => {
  const thread = await openThread(page);
  const group = page.getByRole("group", { name: fixture.thread.label });
  await expect(group).toHaveCount(1);
  expect(await group.evaluate((element) => element.hasAttribute("data-x-thread"))).toBe(true);
  // the card is one image named by fairtrade's alt for this sample; the words it lays out one by one are hidden
  const image = group.getByRole("img", { name: shareCardAlt(SAMPLE_CARD), exact: true });
  await expect(image).toHaveCount(1);
  await expect(image.locator("> *")).toHaveAttribute("aria-hidden", "true");
  // the chart is one image too, named by its bars
  await expect(group.getByRole("img", { name: /model A 71%/ })).toHaveCount(1);
  // a screen reader hears each handle apart from its time, not run into it: the text it reads, without what is hidden
  const spoken = await group.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text = "";
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.parentElement!.closest('[aria-hidden="true"]')) text += node.textContent;
    }
    return text;
  });
  for (const post of fixture.thread.posts) expect(spoken).toContain(`${post.handle}, ${post.time}`);
  // every drawn icon is decoration
  const exposed = await thread.locator("svg").evaluateAll(
    (icons) => icons.filter((icon) => !icon.closest('[aria-hidden="true"]')).length,
  );
  expect(exposed, "icons assistive technology would read").toBe(0);
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
    await expect
      .poll(() => page.evaluate(() => document.getAnimations().filter((item) => item instanceof CSSTransition).length))
      .toBe(0);
    // a picture of X: its dark UI in both of the site's themes
    expect(await thread.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(0, 0, 0)");
    const accessibility = await new AxeBuilder({ page }).include("#session [data-x-thread]").analyze();
    expect(accessibility.violations, `the thread in the ${colorScheme} theme`).toEqual([]);
  }
});

test("the card in the X thread shows the transcript's own prompt count, token total and first prompt", async ({
  page,
}) => {
  const thread = await openThread(page);
  const viewer = page.locator("#session [data-session-viewer]");
  await viewer.scrollIntoViewIfNeeded();
  await expect(viewer.locator(".txn-app")).toBeVisible();
  const card = thread.locator(".lp-x-card");
  await card.scrollIntoViewIfNeeded();
  const words = (await card.innerText()).replace(/\s+/g, " ").trim();
  const prompts = words.match(/prompts (\d+)/)?.[1];
  const tokens = words.match(/tokens (\d+(?:\.\d+)?[kM]?)/)?.[1];
  // the transcript's header counts the same prompts and tokens
  const meta = (await viewer.locator(".txn-meta").innerText()).replace(/\s+/g, " ");
  expect(prompts).toBe(String(fixture.card.figures.prompts));
  expect(meta).toContain(`${prompts} prompts`);
  expect(tokens).toBeTruthy();
  expect(meta).toContain(`${tokens} tokens`);
  // its prompt is the transcript's first user turn, cut where the card runs out of lines
  const prompt = words.split(/\buser\b/)[1]!.replace(/…$/, "").trim();
  const first = (await viewer.locator(".txn-turn.user").first().innerText()).replace(/\s+/g, " ");
  expect(prompt.length).toBeGreaterThan(20);
  expect(first).toContain(prompt);
  expect(fixture.session.firstAsk.startsWith(prompt)).toBe(true);
  // drawn in the card's own face, which the landing does not restyle, and scaled to the post's width
  const drawn = await card.evaluate((frame, promptWord) => {
    const word = [...frame.querySelectorAll("span")].find((span) => span.textContent === promptWord)!;
    const inner = frame.querySelector('[aria-hidden="true"]')!.getBoundingClientRect();
    return {
      family: getComputedStyle(word).fontFamily,
      loaded: document.fonts.check('44px "Atkinson Hyperlegible"'),
      frame: frame.getBoundingClientRect().width,
      inner: inner.width,
      ratio: inner.width / inner.height,
    };
  }, fixture.thread.phone.promptWord);
  expect(drawn.family).toMatch(/^"?Atkinson Hyperlegible"?(,|$)/);
  expect(drawn.loaded).toBe(true);
  expect(Math.abs(drawn.inner - drawn.frame)).toBeLessThanOrEqual(2);
  expect(drawn.ratio).toBeCloseTo(2, 1);
});

test("under the card in the X thread, the line naming where it links", async ({ page }) => {
  const thread = await openThread(page);
  const last = thread.locator(".lp-x-post").last();
  const from = last.locator(".lp-x-from");
  await expect(from).toHaveText(fixture.thread.from);
  const order = await from.evaluate((line) => {
    const card = line.previousElementSibling!;
    return {
      card: card.classList.contains("lp-x-card"),
      below: line.getBoundingClientRect().top >= card.getBoundingClientRect().bottom,
    };
  });
  expect(order).toEqual({ card: true, below: true });
});

/* "40m", "2h": a post's age as X writes it, in minutes */
function minutes(age: string) {
  const [, count, unit] = age.match(/^(\d+)(m|h)$/) ?? [];
  if (!count) throw new Error(`not an age X would write: ${age}`);
  return Number(count) * (unit === "h" ? 60 : 1);
}

test("every post in the X thread comes after the sample session ended, newer down the thread", () => {
  const ended = minutes(fixture.session.endedAgo);
  // the viewer moves the sample to have ended this long before the reader arrived
  expect(SESSION.endedAgoMinutes).toBe(ended);
  const ages = fixture.thread.posts.map((post) => minutes(post.time));
  for (const [index, age] of ages.entries()) expect(age, `post ${index + 1}`).toBeLessThan(ended);
  expect([...ages].sort((a, b) => b - a)).toEqual(ages);
  expect(new Set(ages).size).toBe(ages.length);
});

test("the X thread's posts are set in the system face X uses, inside its window", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const thread = await openThread(page);
  const faces = await thread
    .locator(".lp-x-text, .lp-x-name")
    .evaluateAll((items) => items.map((item) => getComputedStyle(item).fontFamily));
  expect(faces.length).toBeGreaterThan(0);
  for (const face of faces) expect(face.split(",")[0]!.trim()).toBe(fixture.thread.face);
});

test("a keyboard user's focus in the transcript is never hidden under the thread over it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const viewer = page.locator("#session [data-session-viewer]");
    await viewer.scrollIntoViewIfNeeded();
    await expect(viewer.locator(".txn-app")).toBeVisible();
    // hydrated: the windows have seen themselves come into view, so focus can bring its window forward
    await expect(page.locator("#session .lp-windows")).toHaveAttribute("data-fanned", "true");
    await viewer.locator(".txn-stream").evaluate((stream) => stream.querySelector<HTMLElement>("a, button, [tabindex]")!.focus());
    // the transcript, focused, stands in front of the thread
    await expect(page.locator("#session .lp-windows")).toHaveAttribute("data-front", "front");
    let reached = 0;
    for (let press = 0; press < 40; press += 1) {
      await page.keyboard.press("Tab");
      const focus = await page.evaluate(() => {
        const element = document.activeElement!;
        if (!element.closest("#session [data-session-viewer] :is(.txn-stream, .txn-rail-body)")) return null;
        // what draws at the focused control's centre is the control, never the thread over the transcript
        const box = element.getBoundingClientRect();
        const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return {
          name: `${element.className} ${element.textContent?.slice(0, 24)}`,
          hidden: !!top?.closest("#session .lp-windows-x"),
        };
      });
      if (!focus) continue;
      reached += 1;
      expect(focus.hidden, `at ${width}, after ${press + 1} presses, ${focus.name}`).toBe(false);
    }
    expect(reached, `focus stayed in the transcript at ${width}`).toBeGreaterThan(20);
  }
});

test("the shared thread can be reached and scrolled by keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of fixture.session.windows.widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const windows = page.locator("#session .lp-windows");
    const body = windows.getByRole("region", { name: fixture.thread.label });
    await body.scrollIntoViewIfNeeded();
    await expect(windows).toHaveAttribute("data-fanned", "true");
    await expect(windows.locator(".txn-app")).toBeVisible();
    await body.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(body).not.toBeFocused();
    await page.keyboard.press("Tab");
    await expect(body).toBeFocused();
    await expect(windows).toHaveAttribute("data-front", "x");
    await page.keyboard.press("End");
    await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => body.evaluate((element) => element.scrollTop + element.clientHeight)).toBeGreaterThanOrEqual(
      await body.evaluate((element) => element.scrollHeight - 1),
    );
  }
});

test("a sample session opens in the real transcript browser, in a wide window that keeps its height", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const section = page.locator("#session");
  const viewer = section.locator("[data-session-viewer]");
  await expect(viewer).toHaveAttribute("aria-label", fixture.session.label);
  // the browser draws the viewer as the section nears the screen, after the page hydrates, so its relative times
  // can never break hydration (a broken one re-renders the document and drops the theme the head script set)
  await expect(viewer.locator(".txn-app")).toHaveCount(0);
  await viewer.scrollIntoViewIfNeeded();
  await expect(viewer.locator(".txn-app")).toBeVisible();
  expect(errors).toEqual([]);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  // the session goes by its short title, with no crumb trail and no session id
  await expect(viewer.getByRole("heading", { name: fixture.session.title })).toBeVisible();
  await expect(section).not.toContainText(fixture.session.sessionId);
  await expect(section.locator(".txn-crumb a, .txn-crumb li")).toHaveCount(0);
  // no explainer beside it: the markers in the transcript say what was redacted
  await expect(section.locator(".lp-note")).toHaveCount(0);
  // behind it, Claude Code where the session was recorded, hidden from assistive technology
  await expect(section.locator(".lp-windows-term")).toHaveAttribute("aria-hidden", "true");
  await expect(section.locator(".lp-windows-term .mac-win-terminal")).toBeVisible();
  // the values peasant redacted show as their markers
  for (const marker of fixture.session.markers) {
    await expect(viewer, `the transcript does not show ${marker}`).toContainText(marker);
  }
  // the header names its publisher by handle, and its times read as recent work, never weeks old
  await expect(viewer.locator(".txn-meta")).toContainText(fixture.session.author);
  await expect(viewer.locator(".txn-meta")).not.toContainText("<USER>");
  // the header counts the prompts the sample carries, and the Terminal repeats its first ask word for word
  await expect(viewer.locator(".txn-meta")).toContainText(`${fixture.session.figures.inputSubmissionCount} prompts`);
  await expect(section.locator(".lp-windows-term .mac-title")).toHaveText(fixture.session.terminal);
  await expect(section.locator(".lp-windows-term")).toContainText(fixture.session.firstAsk);
  for (const time of await viewer.locator(".txn-turntime").allInnerTexts()) {
    expect(time, "a turn's time reads as weeks old").not.toMatch(/\d+(d|w|mo|y) ago/);
  }

  // the conversation has most of the window: the filters wait behind their rail's strip, which still opens them
  const grid = viewer.locator(".txn-body-grid");
  await expect(grid).toHaveAttribute("data-right-rail", "closed");
  const share = await viewer.evaluate(
    (element) => element.querySelector(".txn-stream")!.getBoundingClientRect().width / element.getBoundingClientRect().width,
  );
  expect(share, "the conversation's share of the window").toBeGreaterThanOrEqual(0.6);
  // the thread stands over the strip until the reader points at the transcript, which brings it in front
  await viewer.locator(".txn-stream").hover({ position: { x: 40, y: 40 } });
  await viewer.locator(".txn-rail-strip-right .txn-rail-reopen").click();
  await expect(grid).not.toHaveAttribute("data-right-rail", "closed");
  // nothing in it slides sideways out from under its column's edge
  for (const column of [".txn-stream", ".txn-rail-right .txn-rail-body"]) {
    const sideways = viewer.locator(column).first();
    await sideways.hover();
    await page.mouse.wheel(400, 0);
    expect(await sideways.evaluate((element) => element.scrollLeft), `${column} slid sideways`).toBe(0);
  }

  // the browser's own tabs, each of which works, and the window keeps its height whichever is shown
  const tabs = viewer.getByRole("tab");
  expect((await tabs.allInnerTexts()).map((text) => text.split("\n")[0])).toEqual(fixture.session.tabs);
  // the transcript's window, not the thread's beside it
  const browser = section.locator(".mac-win-browser.lp-session-win");
  const height = () => browser.evaluate((window) => window.getBoundingClientRect().height);
  const before = await height();
  for (const [index] of fixture.session.tabs.entries()) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
    expect(await height()).toBe(before);
  }
  // a tool call opens in place, its redacted result read whole
  await viewer.getByRole("tab", { name: /full trace/ }).click();
  const env = viewer.locator(".tc-head", { hasText: ".env" }).first();
  await env.click();
  await expect(env).toHaveAttribute("aria-expanded", "true");
  await expect(env.locator("xpath=..")).toContainText("AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY>");
  expect(await height()).toBe(before);
  // the transcript scrolls inside the window, never the page under it
  const stream = viewer.locator(".txn-stream");
  expect(await stream.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);

  // it is shown in a browser window whose address field carries the padlock and no address
  await expect(browser.locator(".mac-lights")).toBeVisible();
  await expect(browser.locator(".mac-address-lock")).toBeVisible();
  await expect(browser.locator(".mac-address-text")).toHaveText("");
  // the real macOS chrome, not a drawing in the site's tokens: rounded window, the system's traffic-light colours
  expect(await browser.evaluate((window) => getComputedStyle(window).borderTopLeftRadius)).toBe("10px");
  expect(
    await browser
      .locator(".mac-lights i")
      .evaluateAll((lights) => lights.map((light) => getComputedStyle(light).backgroundColor)),
  ).toEqual(["rgb(255, 95, 87)", "rgb(254, 188, 46)", "rgb(40, 200, 64)"]);

  // every window in the section reads at AA in both themes, the Terminal's dimmed title behind the browser too
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
    // the windows ease into the new theme; read them once they have arrived
    await expect
      .poll(() => page.evaluate(() => document.getAnimations().filter((item) => item instanceof CSSTransition).length))
      .toBe(0);
    const accessibility = await new AxeBuilder({ page }).include("#session").analyze();
    expect(accessibility.violations, `the section in the ${colorScheme} theme`).toEqual([]);
  }
});

test("the transcript browser rests where it opens, and only the reader's own input changes it", async ({ browser }) => {
  test.setTimeout(60_000);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext(viewport.width < 500 ? { ...PHONE, viewport } : { viewport });
    const page = await context.newPage();
    await page.goto("/");
    // a phone shows the session's slice instead of the browser; it holds still the same way
    const phone = viewport.width < 768;
    const viewer = page.locator(phone ? "#session [data-session-phone]" : "#session [data-session-viewer]");
    await viewer.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(viewer.locator(phone ? ".txn-turn" : ".txn-app").first()).toBeVisible();
    // what a hand could change: the tab, how far the conversation is scrolled, what is open, anything moving
    const state = () =>
      viewer.evaluate((element) => ({
        tab: element.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim().split(/\s/)[0],
        scrolled: element.querySelector(".txn-stream")?.scrollTop ?? -1,
        opened: element.querySelectorAll('[aria-expanded="true"]').length,
        filters: element.querySelector(".txn-body-grid")?.getAttribute("data-right-rail"),
        moving: document
          .getAnimations()
          .filter((animation) => {
            const target = (animation.effect as KeyframeEffect | null)?.target;
            return target instanceof Element && element.contains(target) && animation.playState === "running";
          }).length,
        pointers: element.querySelectorAll(".mac-pointer, [data-touring]").length,
        lit: "highlights" in CSS ? CSS.highlights.size : 0,
      }));
    // it opens at rest (the browser on the full trace, at its top), nothing open but what it opens by default
    const opening = await state();
    expect(opening, `the opening state at ${viewport.width}`).toMatchObject(
      phone ? { moving: 0, pointers: 0, lit: 0 } : { tab: "full", scrolled: 0, moving: 0, pointers: 0, lit: 0 },
    );
    if (viewport.width >= 1024) expect(opening.filters).toBe("closed");
    // and left alone, it stays exactly so
    await page.waitForTimeout(6_000);
    expect(await state(), `the browser changed on its own at ${viewport.width}`).toEqual(opening);
    await context.close();
  }
});
test("the theme follows the system until the reader chooses one", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  // still following: a system change applies live
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.locator("[data-theme-toggle]").first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => window.localStorage.getItem("peasant-labs-theme"))).toBe("light");

  // a choice outlives the system setting
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".lp-vision-art .art-light")).toBeVisible();
  await expect(page.locator(".lp-vision-art .art-dark")).toBeHidden();
});

test("the docs sidebar lists only destinations that exist and marks the page you are on", async ({
  page,
  request,
}) => {
  await page.goto("/docs");
  const sidebar = page.getByRole("complementary", { name: "docs" });
  const links = sidebar.locator("nav:not(.asb-utils) a.asb-item");
  expect(
    await links.evaluateAll((items) =>
      items.map((item) => ({
        label: item.querySelector(".asb-label")?.textContent?.trim(),
        href: item.getAttribute("href"),
      })),
    ),
  ).toEqual(fixture.docsNav);

  for (const item of fixture.docsNav) {
    const [path, anchor] = item.href.split("#");
    const response = await request.get(path!);
    expect(response.status(), `${item.href} does not resolve`).toBe(200);
    if (anchor) {
      expect(await response.text(), `${item.href} has no #${anchor}`).toContain(`id="${anchor}"`);
    }
  }

  for (const item of fixture.docsNav.filter((entry) => !entry.href.includes("#"))) {
    await page.goto(item.href);
    await expect(
      page.getByRole("complementary", { name: "docs" }).locator('nav:not(.asb-utils) [aria-current="page"]'),
    ).toHaveText(item.label);
  }
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`on a phone the docs sidebar folds into fairtrade's top bar and drawer (${colorScheme})`, async ({ browser }) => {
    const context = await browser.newContext({ ...PHONE, colorScheme });
    const page = await context.newPage();
    await page.goto("/docs/guides/evals");
    await expect(page.locator(".asb-item").first()).toBeHidden();
    await page.getByRole("button", { name: "open the menu" }).tap();
    await expect(page.locator("nav:not(.asb-utils) a.asb-item").first()).toBeVisible();
    // the drawer fades its rows in one after another, the footer last; contrast is read once they are all in
    await expect
      .poll(() => page.evaluate(() => document.querySelector(".asb")?.getAnimations({ subtree: true }).length))
      .toBe(0);
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    await context.close();
  });
}

test("the docs starting points sit in full rows on a wide screen, with no card left alone", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs");
  const rows = await page.locator(".dx-guide").evaluateAll((cards) => {
    const byTop = new Map<number, number>();
    for (const card of cards) {
      const top = Math.round(card.getBoundingClientRect().top);
      byTop.set(top, (byTop.get(top) ?? 0) + 1);
    }
    return [...byTop.values()];
  });
  expect(rows.every((count) => count === rows[0])).toBe(true);
  expect(rows[0]).toBeGreaterThan(1);
});

test("the blog lists every post and each post renders under its own title", async ({ page }) => {
  await page.goto("/blog");
  const cards = page.locator(".bx-post");
  await expect(cards).toHaveCount(fixture.posts.length);
  for (const [index, post] of fixture.posts.entries()) {
    await expect(cards.nth(index)).toHaveAttribute("href", `/blog/${post.slug}`);
    await expect(cards.nth(index).locator("h2")).toHaveText(post.title);
    await page.goto(`/blog/${post.slug}`);
    await expect(page.locator("h1")).toHaveText(post.title);
    // an authored title keeps its capitals
    expect(await page.locator("h1").evaluate((heading) => getComputedStyle(heading).textTransform)).toBe("none");
    await page.goto("/blog");
  }
  const missing = await page.goto("/blog/not-a-post");
  expect(missing?.status()).toBe(404);
});
