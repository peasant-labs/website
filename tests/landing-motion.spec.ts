import { expect, test } from "@playwright/test";
import { loadLandingFixture, PHONE } from "./landing-fixture";
import { openViewerFilters } from "./landing-viewer";

const fixture = loadLandingFixture();

test("on a phone the header is the mark and one menu button, and the menu behaves", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/");
  const header = page.locator(".site-bar");
  await expect(header.getByRole("navigation", { name: "site" })).toBeHidden();
  const button = header.getByRole("button", { name: "open the menu" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toHaveAttribute("aria-controls", "site-sheet");
  const box = await button.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);

  await button.tap();
  const close = header.getByRole("button", { name: "close the menu" });
  await expect(close).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("navigation", { name: "menu" });
  expect(
    await menu.getByRole("link").evaluateAll((links) =>
      links.map((link) => ({ label: link.textContent?.trim(), href: link.getAttribute("href") })),
    ),
  ).toEqual(fixture.header.menu);
  await expect(menu.getByRole("link").first()).toBeFocused();
  const sheet = page.locator("#site-sheet");
  await expect(sheet.getByRole("link", { name: fixture.header.login.label })).toHaveAttribute(
    "href",
    fixture.header.login.href,
  );
  // install lives on the page and in the footer, never in the header
  await expect(sheet.getByText(fixture.footer.cta.primary.label)).toHaveCount(0);
  await expect(sheet.locator("[data-theme-toggle]")).toBeVisible();
  // the sheet fills the screen under the bar, so none of the page shows below it
  await expect
    .poll(async () => {
      const bottom = await sheet.evaluate((element) => element.getBoundingClientRect().bottom);
      return Math.abs(bottom - PHONE.viewport.height);
    })
    .toBeLessThanOrEqual(1);
  // the page behind does not scroll while the menu is open
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

  // focus stays inside: past the last stop, tab comes back to the button
  const stops = await sheet.locator("a:visible, button:visible").count();
  for (let index = 0; index < stops; index += 1) await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");

  // its button closes it, and so does following a link
  await button.tap();
  await expect(close).toHaveAttribute("aria-expanded", "true");
  await close.tap();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.tap();
  await menu.getByRole("link", { name: "blog" }).tap();
  await expect(page).toHaveURL(/\/blog$/);
  await context.close();
});

test("on a wide screen the header steps away while reading down and never offers install", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.locator(".site-bar");
  await expect(header).toHaveAttribute("data-scrolled", "false");
  await page.mouse.wheel(0, 1500);
  await expect(header).toHaveAttribute("data-hidden", "true");
  await expect(header).toHaveAttribute("data-scrolled", "true");
  await page.mouse.wheel(0, -400);
  await expect(header).toHaveAttribute("data-hidden", "false");
  await expect(header.getByText(fixture.footer.cta.primary.label)).toHaveCount(0);
  await expect(header.getByRole("button", { name: "open the menu" })).toBeHidden();
});

test("the agents drift past under the hero, hold when hovered, and stand still for reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const band = page.locator("[data-agents]");
  // one row is the list a screen reader hears, each name led by its mark; the loop's copies are hidden
  const list = band.getByRole("list", { name: fixture.agents.label });
  await expect(list.getByRole("listitem")).toHaveText(fixture.agents.names);
  await expect(list.locator("svg.brand")).toHaveCount(fixture.agents.names.length);
  await expect(band.locator('ul[aria-hidden="true"]')).toHaveCount(3);

  const track = band.locator(".lp-agents-track");
  await band.scrollIntoViewIfNeeded();
  await expect(band).toHaveAttribute("data-playing", "true");
  expect(await track.evaluate((element) => getComputedStyle(element).animationName)).toBe("lp-agents");
  expect(await track.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("running");
  await band.hover();
  expect(await track.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("paused");
  // off screen it holds as well
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(band).toHaveAttribute("data-playing", "false");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(band.locator("ul")).toHaveCount(1);
  expect(await track.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
});

test("the desktop demos overlap behind the main window on one baseline and stack in narrower containers", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of fixture.session.windows.widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.mouse.move(5, 5);
    await page.goto("/");
    const windows=page.locator(".lp-windows");
    await windows.scrollIntoViewIfNeeded();
    await expect(windows.locator(".txn-app")).toBeVisible();
    const layout=await windows.evaluate(group=>{
      const box=(selector:string)=>group.querySelector(selector)!.getBoundingClientRect();
      return {
        term: box(".lp-windows-term"),
        viewer: box(".lp-windows-front"),
        thread: box(".lp-windows-x"),
        container: group.getBoundingClientRect(),
        terminalBody: box(".lp-windows-term .mac-body"),
        terminalOverflow: [...group.querySelectorAll(".lp-windows-term :is(.mac-body, .cc, .cc-welcome)")]
          .map((element) => element.scrollWidth - element.clientWidth),
        terminalWelcome: box(".lp-windows-term .cc-welcome"),
        terminalText: parseFloat(getComputedStyle(group.querySelector(".lp-windows-term .cc")!).fontSize),
        sharedBody: box(".lp-windows-x .mac-body"),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.terminalBody.height, `terminal body at ${width}`).toBeGreaterThanOrEqual(fixture.session.terminalBodyMin);
    for (const overflow of layout.terminalOverflow) {
      expect(overflow, `terminal content fits at ${width}`).toBeLessThanOrEqual(1);
    }
    expect(layout.terminalWelcome.right, `welcome fits at ${width}`).toBeLessThanOrEqual(layout.terminalBody.right);
    expect(layout.terminalText, `terminal text at ${width}`).toBeGreaterThanOrEqual(fixture.session.terminalTextMin);
    expect(layout.sharedBody.height, `shared body at ${width}`).toBeGreaterThanOrEqual(fixture.session.sharedBodyMin);
    if(fixture.session.windows.layeredWidths.includes(width)) {
      expect(Math.abs(layout.term.top-layout.viewer.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.thread.top-layout.viewer.top)).toBeLessThanOrEqual(1);
      const terminalOverlap = (layout.term.right - layout.viewer.left) / layout.container.width;
      const threadOverlap = (layout.viewer.right - layout.thread.left) / layout.container.width;
      expect(terminalOverlap, `terminal has controlled overlap at ${width}`).toBeGreaterThanOrEqual(fixture.session.windows.overlap.minRatio);
      expect(terminalOverlap, `terminal stays exposed at ${width}`).toBeLessThanOrEqual(fixture.session.windows.overlap.maxRatio);
      expect(threadOverlap, `thread has controlled overlap at ${width}`).toBeGreaterThanOrEqual(fixture.session.windows.overlap.minRatio);
      expect(threadOverlap, `thread stays exposed at ${width}`).toBeLessThanOrEqual(fixture.session.windows.overlap.maxRatio);
      expect(layout.term.left).toBeLessThan(layout.viewer.left);
      expect(layout.term.right).toBeLessThan(layout.viewer.right);
      expect(layout.thread.left).toBeGreaterThan(layout.viewer.left);
      expect(layout.thread.right).toBeGreaterThan(layout.viewer.right);
      expect(layout.viewer.width/layout.container.width).toBeGreaterThan(fixture.session.windows.frontMinRatio);
      expect(layout.viewer.width/layout.container.width).toBeLessThan(fixture.session.windows.frontMaxRatio);
      expect(layout.viewer.width).toBeGreaterThan(layout.term.width);
      expect(layout.viewer.width, `layered reader stays usable at ${width}`).toBeGreaterThanOrEqual(fixture.session.windows.minLayeredWidth);
      expect(layout.thread.right).toBeLessThanOrEqual(layout.container.right+1);
    } else {
      expect(fixture.session.windows.stackedWidths).toContain(width);
      expect(layout.term.bottom).toBeLessThan(layout.viewer.top);
      expect(layout.viewer.bottom).toBeLessThan(layout.thread.top);
    }
  }
});

test("the transcript browser fits at a tablet's width, a long line scrolling inside its own block", async ({
  browser,
}) => {
  for (const width of [768]) {
    const context = await browser.newContext({ ...PHONE, viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    const viewer = page.locator("#session [data-session-viewer]");
    await viewer.scrollIntoViewIfNeeded();
    // the tool call whose result carries the redacted key, opened in place
    const env = viewer.locator(".tc-head", { hasText: ".env" }).first();
    await env.scrollIntoViewIfNeeded();
    await env.tap();
    const result = env.locator("xpath=..").locator("pre").first();
    await expect(result).toContainText("<AWS_ACCESS_KEY>");
    const fit = await result.evaluate((box) => ({
      page: document.documentElement.scrollWidth - window.innerWidth,
      // a line wider than the window scrolls inside the code block, as in the transcript browser itself
      contained: box.scrollWidth <= box.clientWidth || /auto|scroll/.test(getComputedStyle(box).overflowX),
    }));
    expect(fit, `the transcript browser does not fit at ${width}`).toEqual({ page: 0, contained: true });
    await context.close();
  }
});

test("on a phone the session is a short slice at the column's width, its redacted key read whole", async ({
  browser,
}) => {
  for (const width of fixture.session.phone.widths) {
    const context = await browser.newContext({ ...PHONE, viewport: { width, height: 844 } });
    const page = await context.newPage();
    await page.goto("/");
    const section = page.locator("#session");
    const slice = section.locator("[data-session-phone]");
    await slice.scrollIntoViewIfNeeded();
    // no windows: no browser chrome, no Terminal behind; the shared thread follows the slice, out of any window
    await expect(section.locator(".lp-session-win")).toBeHidden();
    await expect(section.locator(".lp-windows-term")).toBeHidden();
    await expect(section.locator(".mac-win").filter({ visible: true })).toHaveCount(0);
    await expect(slice).toBeVisible();
    const turnHeadings = slice.locator(".txn-turn-heading");
    await expect(turnHeadings).not.toHaveCount(0);
    expect(await turnHeadings.evaluateAll((headings) => headings.map((heading) => heading.tagName)))
      .toEqual(Array(await turnHeadings.count()).fill(`H${fixture.session.phone.headingLevel}`));
    await expect(section.locator("[data-x-thread]").filter({ visible: true })).toHaveCount(1);
    // the prompt, the tool call that read .env open on its redacted key, and the commit with its churn
    await expect(slice.locator(".txn-turn.user")).toContainText(fixture.session.phone.prompt);
    const env = slice.locator(".tc-head", { hasText: fixture.session.phone.tool });
    await expect(env).toHaveAttribute("aria-expanded", "true");
    const result = env.locator("xpath=..").locator("pre");
    await expect(result).toContainText(`${fixture.session.phone.key}${fixture.session.phone.marker}`);
    await expect(slice.locator(".lp-phone-commit")).toContainText(fixture.session.phone.commit);
    await expect(slice.locator(".lp-phone-commit")).toContainText(fixture.session.phone.stat);

    const layout = await slice.evaluate((element, marker) => {
      const pre = element.querySelector("pre")!;
      // the marker sits on one line, never split by a wrap
      const node = [...pre.childNodes].find((child) => child.textContent?.includes(marker))!;
      const range = document.createRange();
      const at = node.textContent!.indexOf(marker);
      range.setStart(node, at);
      range.setEnd(node, at + marker.length);
      const texts = [...element.querySelectorAll("*")].filter(
        (item) => item.getClientRects().length && [...item.childNodes].some((child) => child.nodeType === 3 && child.textContent?.trim()),
      );
      const targets = [...element.querySelectorAll("button")].filter((item) => item.getClientRects().length);
      return {
        page: document.documentElement.scrollWidth - window.innerWidth,
        width: Math.round(element.getBoundingClientRect().width),
        column: Math.round(element.closest("section")!.querySelector(".lp-head")!.getBoundingClientRect().width),
        overflowing: [...element.children].filter((child) => child.getBoundingClientRect().right > window.innerWidth).length,
        markerLines: new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size,
        smallestText: Math.min(...texts.map((item) => parseFloat(getComputedStyle(item).fontSize))),
        smallestTarget: Math.min(...targets.map((item) => item.getBoundingClientRect().height)),
      };
    }, fixture.session.phone.marker);
    expect(layout, `the slice at ${width}`).toMatchObject({ page: 0, overflowing: 0, markerLines: 1 });
    expect(layout.width).toBe(layout.column);
    expect(layout.smallestText, `text under 14px at ${width}`).toBeGreaterThanOrEqual(14);
    expect(layout.smallestTarget, `a target under 44px at ${width}`).toBeGreaterThanOrEqual(44);

    // the tool call closes and opens on the reader's tap, and on nothing else
    await env.tap();
    await expect(env).toHaveAttribute("aria-expanded", "false");
    await env.tap();
    await expect(env).toHaveAttribute("aria-expanded", "true");
    await context.close();
  }
});

test("on a phone the shared thread follows the slice at the column's width, readable and dark in both themes", async ({
  browser,
}) => {
  for (const width of fixture.session.phone.widths) {
    for (const colorScheme of ["light", "dark"] as const) {
      const at = `at ${width} in the ${colorScheme} theme`;
      const context = await browser.newContext({ ...PHONE, colorScheme, viewport: { width, height: 844 } });
      const page = await context.newPage();
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
      const section = page.locator("#session");
      const thread = section.locator("[data-x-thread]").filter({ visible: true });
      await thread.scrollIntoViewIfNeeded();
      await expect(thread, at).toBeVisible();
      await expect(thread.locator(".lp-x-post"), at).toHaveCount(fixture.thread.posts.length);
      await expect(thread.locator(".lp-x-from"), at).toHaveText(fixture.thread.from);
      const layout = await thread.evaluate((element, word) => {
        const box = element.getBoundingClientRect();
        const slice = element.closest("section")!.querySelector("[data-session-phone]")!.getBoundingClientRect();
        const column = element.closest("section")!.querySelector(".lp-head")!.getBoundingClientRect();
        const card = element.querySelector(".lp-x-card")!;
        const drawn = card.querySelector('[aria-hidden="true"]')!.getBoundingClientRect();
        const prompt = [...card.querySelectorAll("span")].find((span) => span.textContent === word)!;
        const texts = [...element.querySelectorAll(".lp-x-text, .lp-x-name, .lp-x-handle, .lp-x-time")];
        return {
          page: document.documentElement.scrollWidth - window.innerWidth,
          left: Math.round(box.left - column.left),
          right: Math.round(column.right - box.right),
          below: box.top >= slice.bottom,
          windowed: Boolean(element.closest(".mac-win")),
          background: getComputedStyle(element).backgroundColor,
          postText: Math.min(...texts.map((item) => parseFloat(getComputedStyle(item).fontSize))),
          // the card is drawn at its own 1200 pixels and scaled: what a reader sees is the size times the scale
          cardPrompt: parseFloat(getComputedStyle(prompt).fontSize) * (drawn.width / 1200),
          cardInside: drawn.left >= box.left - 1 && drawn.right <= box.right + 1,
          // X's system face, though no window around it sets one
          face: getComputedStyle(element.querySelector(".lp-x-text")!).fontFamily.split(",")[0]!.trim(),
          // out of the avatar column, it never runs over the avatar above it
          clearOfAvatar: drawn.top >= card.closest(".lp-x-post")!.querySelector(".lp-x-avatar")!.getBoundingClientRect().bottom,
        };
      }, fixture.thread.phone.promptWord);
      expect(layout, at).toMatchObject({ page: 0, left: 0, right: 0, below: true, windowed: false, cardInside: true, clearOfAvatar: true });
      expect(layout.face, `the post text's face ${at}`).toBe(fixture.thread.face);
      // a picture of X: its dark UI whatever the site's theme
      expect(layout.background, at).toBe("rgb(0, 0, 0)");
      expect(layout.postText, `post text ${at}`).toBeGreaterThanOrEqual(fixture.thread.phone.postText);
      expect(layout.cardPrompt, `the card's prompt ${at}`).toBeGreaterThanOrEqual(fixture.thread.phone.cardPrompt);
      await context.close();
    }
  }
});

test("pictures grow their dots in once, and only when motion is allowed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/js-reveal/);
  await expect(page.locator("#hero-title")).toHaveAttribute("data-shown", "true");
  const art = page.locator(".lp-vision-art");
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute("data-revealed", "done", { timeout: 5000 });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/js-reveal/);
  expect(
    await page.locator(".lp-vision-art .art-img").first().evaluate((image) => getComputedStyle(image).maskImage),
  ).toBe("none");
});

test("a heading that mounts after load is still revealed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/js-reveal/);
  await page.evaluate(() => {
    const late = document.createElement("p");
    late.id = "late";
    late.dataset.fade = "";
    late.textContent = "late";
    document.querySelector("#hero-title")!.after(late);
  });
  await expect(page.locator("#late")).toHaveAttribute("data-shown", "true");
});

for (const { name, width, colorScheme, compact } of fixture.hero.flow.layouts) {
  test(`the village handoff keeps its two anchors and grounded readers: ${name}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "no-preference" });
    await page.setViewportSize({ width, height: 900 });
    await page.clock.install();
    await page.goto("/");
    const panel = page.locator(".hf-panel"), flow = panel.locator(".hf");
    await panel.getByRole("button").scrollIntoViewIfNeeded();
    await expect(page.locator(".lp-hero-flow")).toHaveAttribute("data-shown", "true");
    await page.clock.runFor(1000); // finish the existing section reveal before measuring planted geometry
    const art = flow.locator(".hf-art:visible");
    await expect(art).toHaveAttribute("viewBox", compact ? "0 0 480 360" : "0 0 960 360");
    const picture = flow.getByRole("img");
    for (const agent of fixture.hero.flow.agents) await expect(picture).toHaveAttribute("aria-label", new RegExp(agent));
    expect((await picture.innerText()).trim()).toBe("");
    expect((await art.locator(".hf-screen-marks [data-brand]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-brand")))).sort()).toEqual(fixture.hero.flow.marks);
    await expect(art.locator(".hf-screen-marks")).not.toContainText(/./);
    const members = art.locator("[data-member]");
    expect((await members.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-member")))).sort()).toEqual([...fixture.hero.flow.members].sort());
    const anchored = await members.evaluateAll((nodes) => nodes.map((node) => { const svg = node as SVGGraphicsElement, matrix = svg.getCTM()!, bounds = svg.getBBox(); return { bounds: [bounds.x, bounds.y, bounds.width, bounds.height], matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] }; }));
    const composition = await art.evaluate((svg) => {
      const computer = svg.querySelector(".hf-laptop")!.getBoundingClientRect();
      const press = svg.querySelector(".hf-workshop")!.getBoundingClientRect();
      const frame = svg.getBoundingClientRect();
      return { computerCenter: (computer.left + computer.width / 2 - frame.left) / frame.width, pressCenter: (press.left + press.width / 2 - frame.left) / frame.width, ratio: frame.width / frame.height };
    });
    expect(composition.computerCenter, "computer remains the left anchor").toBeLessThan(.5);
    expect(composition.pressCenter, "village workshop remains the right anchor").toBeGreaterThan(.5);
    expect(composition.ratio).toBeCloseTo(compact ? 480 / 360 : 960 / 360, 2);
    const before = await flow.evaluate((node) => ({ width: node.clientWidth, height: node.clientHeight }));
    await expect(flow).toHaveAttribute("data-progress", fixture.hero.flow.rest.toFixed(3));
    await page.clock.runFor(1000);
    await expect(flow).toHaveAttribute("data-progress", fixture.hero.flow.rest.toFixed(3));
    await panel.getByRole("button", { name: fixture.hero.flow.motionLabels[0], exact: true }).click();
    let elapsed = 0;
    for (const frame of fixture.hero.flow.journeyFrames) {
      await page.clock.runFor(frame.time - elapsed + (elapsed === 0 ? 32 : 0));
      elapsed = frame.time;
      const escaped = await art.evaluate((svg) => {
        const bounds = (svg as SVGSVGElement).getBBox(), view = (svg as SVGSVGElement).viewBox.baseVal;
        return bounds.x < -1 || bounds.y < -1 || bounds.x + bounds.width > view.width + 1 || bounds.y + bounds.height > view.height + 1;
      });
      expect(escaped, `the full artwork stays inside its viewBox at ${name}, ${frame.name}`).toBe(false);
      expect(await members.evaluateAll((nodes) => nodes.map((node) => { const svg = node as SVGGraphicsElement, matrix = svg.getCTM()!, bounds = svg.getBBox(); return { bounds: [bounds.x, bounds.y, bounds.width, bounds.height], matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] }; })), `people stay planted during ${frame.name}`).toEqual(anchored);
      expect(await flow.evaluate((node) => ({ width: node.clientWidth, height: node.clientHeight })), `the picture does not resize during ${frame.name}`).toEqual(before);
      if (frame.name === "press") await expect(art.locator('[data-part="press-platen"]')).not.toHaveAttribute("transform", "translate(0 0)");
      if (frame.name === "stamp") {
        await expect(art.locator('[data-part="approval-stamp"]')).toHaveAttribute("transform", "translate(0 3)");
        await expect(art.locator('[data-part="approval-seal"]')).toHaveAttribute("opacity", "1");
      }
    }
    await expect(panel.getByRole("button", { name: fixture.hero.flow.motionLabels[2], exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(flow).toHaveAttribute("data-progress", "1.000");
    await page.clock.runFor(fixture.hero.flow.duration);
    await expect(flow).toHaveAttribute("data-progress", "1.000");
  });
}

test("the village composition and frame share the same container boundary", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of fixture.hero.flow.boundaryWidths) {
    await page.setViewportSize({ width, height: 900 });
    const flow = page.locator(".hf"), art = flow.locator(".hf-art:visible");
    const hostWidth = await flow.evaluate((node) => node.clientWidth);
    const compact = hostWidth < fixture.hero.flow.compositionBoundary;
    await expect(art).toHaveAttribute("viewBox", compact ? "0 0 480 360" : "0 0 960 360");
    const box = (await art.boundingBox())!;
    expect(box.width / box.height, `viewBox and aspect ratio agree at host width${hostWidth}`).toBeCloseTo(compact ? 480 / 360 : 960 / 360, 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
});

test("the village motion is opt-in, pausable and bounded, with static reduced-motion steps", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  const panel = page.locator(".hf-panel"), flow = panel.locator(".hf");
  await panel.scrollIntoViewIfNeeded();
  const play = panel.getByRole("button");
  await expect(play).toHaveText(fixture.hero.flow.motionLabels[0]);
  const target = (await play.boundingBox())!;
  expect(target.height).toBeGreaterThanOrEqual(fixture.hero.flow.buttonTarget);
  await play.focus();
  await page.keyboard.press("Enter");
  await expect(play).toHaveText(fixture.hero.flow.motionLabels[1]);
  await page.clock.runFor(1600);
  const first = Number(await flow.getAttribute("data-progress"));
  expect(first).toBeGreaterThan(0);
  await play.click();
  const paused = await flow.getAttribute("data-progress");
  await page.clock.runFor(1000);
  await expect(flow).toHaveAttribute("data-progress", paused!);
  await play.click();
  await page.clock.runFor(1000);
  expect(Number(await flow.getAttribute("data-progress"))).toBeGreaterThan(Number(paused));
  // Leaving the scene pauses it without restarting the timeline on return.
  await page.locator("#install").scrollIntoViewIfNeeded();
  await expect(play).toHaveAttribute("aria-pressed", "false");
  const offscreen = await flow.getAttribute("data-progress");
  await page.clock.runFor(1000);
  await expect(flow).toHaveAttribute("data-progress", offscreen!);
  await panel.scrollIntoViewIfNeeded();
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await play.click();
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(play).toHaveAttribute("aria-pressed", "false");
  const hidden = await flow.getAttribute("data-progress");
  await page.clock.runFor(1000);
  await expect(flow).toHaveAttribute("data-progress", hidden!);
  await page.evaluate(() => { delete (document as unknown as { hidden?: boolean }).hidden; document.dispatchEvent(new Event("visibilitychange")); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(play).toHaveText(fixture.hero.flow.motionLabels[3]);
  await page.goto("/");
  await panel.scrollIntoViewIfNeeded();
  await expect(play).toHaveText(fixture.hero.flow.motionLabels[3]);
  await play.click();
  await expect(flow).toHaveAttribute("data-progress", fixture.hero.flow.reducedStep.toFixed(3));
  const stepped = await flow.getAttribute("data-progress");
  await page.clock.runFor(fixture.hero.flow.duration);
  await expect(flow).toHaveAttribute("data-progress", stepped!);
  await play.click();
  await expect(flow).toHaveAttribute("data-progress", (fixture.hero.flow.reducedStep * 2).toFixed(3));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(play).toHaveText(fixture.hero.flow.motionLabels[0]);
  await play.click();
  await expect(play).toHaveText(fixture.hero.flow.motionLabels[1]);
});

for (const theme of fixture.session.windows.themes) {
  for (const motion of fixture.session.windows.motion) {
    test(`the layered demos switch by pointer and focus without moving: ${theme}, ${motion}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: motion });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.mouse.move(5, 5);
      await page.goto("/");
      const windows = page.locator("#session .lp-windows");
      await windows.scrollIntoViewIfNeeded();
      await expect(windows).toHaveAttribute("data-fanned", "true");
      await expect(windows).toHaveAttribute("data-front", "front");
      const geometry = () => windows.evaluate(group => {
        const origin = group.getBoundingClientRect();
        return [...group.children].map(child => {
          const box = child.getBoundingClientRect();
          return { left: box.left - origin.left, top: box.top - origin.top, width: box.width, height: box.height };
        });
      });
      const before = await geometry();
      expect(await windows.evaluate(group => [...group.children].map(child => child.className.replace("lp-windows-", ""))))
        .toEqual(fixture.session.windows.order);
      const overlapOwner = async (selector: string, other: string) => {
        const target = (await windows.locator(selector).boundingBox())!;
        const peer = (await windows.locator(other).boundingBox())!;
        const x = (Math.max(target.x, peer.x) + Math.min(target.x + target.width, peer.x + peer.width)) / 2;
        const top = Math.max(target.y, peer.y);
        const bottom = Math.min(target.y + target.height, peer.y + peer.height);
        const y = top + Math.min(96, (bottom - top) / 3);
        expect(Math.min(target.x + target.width, peer.x + peer.width) - Math.max(target.x, peer.x)).toBeGreaterThan(0);
        return page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest(".lp-windows > div")?.className, [x, y]);
      };
      // A z-index attribute alone is insufficient: the main reader must actually
      // cover both supporting windows in their shared painted area.
      for (const row of fixture.session.windows.switches.filter(row => row.id !== "front")) {
        expect(await overlapOwner(row.selector, row.overlaps)).toBe("lp-windows-front");
      }
      for (const mode of fixture.session.windows.activationModes) {
        for (const row of fixture.session.windows.switches) {
          await page.mouse.move(5, 5);
          const target = windows.locator(row.selector);
          const box = (await target.boundingBox())!;
          const x = box.x + box.width * row.exposed[0];
          const y = box.y + box.height * row.exposed[1];
          expect(await page.evaluate(({ px, py, selector }) => !!document.elementFromPoint(px, py)?.closest(selector),
            { px: x, py: y, selector: row.selector }), `${row.id} retains an exposed activation area`).toBe(true);
          if (mode === "focus") {
            await windows.locator(row.focus).first().focus();
            expect(await target.evaluate(element => element.contains(document.activeElement))).toBe(true);
          } else if (mode === "click") {
            await page.mouse.click(x, y);
          } else {
            await page.mouse.move(x, y);
          }
          await expect(windows).toHaveAttribute("data-front", row.id);
          expect(await overlapOwner(row.selector, row.overlaps), `${mode} paints ${row.id} above its neighbour`).toBe(`lp-windows-${row.id}`);
          await page.mouse.move(5, 5);
          await expect(windows).toHaveAttribute("data-front", row.id);
          expect(await geometry(), `${mode} leaves every window's geometry fixed`).toEqual(before);
        }
      }
      // The real viewer's native control still operates after returning it to front.
      await windows.locator(fixture.session.windows.switches.find(row => row.id === "front")!.focus).first().focus();
      const filters = await openViewerFilters(windows.locator(".lp-windows-front"));
      await filters.close();
      const shared = windows.locator(".lp-windows-x .mac-body");
      await shared.focus();
      await expect(windows).toHaveAttribute("data-front", "x");
      await page.keyboard.press("PageDown");
      await expect.poll(() => shared.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      expect(await geometry()).toEqual(before);
    });
  }
}

test("the terminal can be brought forward by keyboard and virtual activation without page scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.move(5, 5);
  await page.goto("/");
  const windows = page.locator("#session .lp-windows");
  await windows.scrollIntoViewIfNeeded();
  await expect(windows).toHaveAttribute("data-fanned", "true");
  const terminal = windows.getByRole("button", { name: fixture.session.windows.terminalButton, exact: true });
  const main = windows.locator(".lp-windows-front");
  for (const key of fixture.session.windows.terminalKeys) {
    await page.mouse.move(5, 5);
    await terminal.focus();
    await expect(terminal).toBeFocused();
    await expect(windows).toHaveAttribute("data-front", "term");
    // Pointer activation changes the layer while keyboard focus stays on the
    // terminal. Enter/Space must reactivate that focused window, not scroll.
    const box = (await main.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(windows).toHaveAttribute("data-front", "front");
    await expect(terminal).toBeFocused();
    const top = await page.evaluate(() => window.scrollY);
    await page.keyboard.press(key);
    await expect(windows).toHaveAttribute("data-front", "term");
    expect(await page.evaluate(() => window.scrollY)).toBe(top);
  }
  await page.keyboard.press("Tab");
  await expect(windows).toHaveAttribute("data-front", "front");
  expect(await main.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.mouse.move(5, 5);
  // Assistive technology can activate a role button without a pointer event.
  await terminal.evaluate((element: HTMLElement) => element.click());
  await expect(windows).toHaveAttribute("data-front", "term");
});

for (const theme of fixture.session.windows.themes) {
  test(`the demo reader keeps prose and keyboard-focused footer controls visible: ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const { name, width, filtersAvailable, filtersMode } of fixture.session.windows.controls.cases) {
      await page.setViewportSize({ width, height: 1000 });
      await page.mouse.move(5, 5);
      await page.goto("/");
      const viewer = page.locator("#session .lp-windows-front");
      await viewer.scrollIntoViewIfNeeded();
      await expect(viewer.locator(".txn-app")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(filtersAvailable, `${name} retains access to filters`).toBe(true);
      const filters = await openViewerFilters(viewer);
      expect(filters.mode, `${name} uses the canonical responsive controls`).toBe(filtersMode);
      const responses = filters.panel.getByRole("checkbox", { name: /^responses/ });
      await expect(responses).toBeChecked();
      await responses.uncheck();
      await expect(responses).not.toBeChecked();
      const prose = viewer.locator(".txn-turn.user .txn-md-prose").first();
      await expect(prose).toBeVisible();
      expect(await prose.evaluate(element => getComputedStyle(element).fontFamily), `product prose keeps its canonical font inside the mock browser at ${width}`)
        .toContain(fixture.session.windows.controls.bodyFont);
      expect(await prose.evaluate(element => element.getBoundingClientRect().width), `available reader layout retains readable prose at ${width}`)
        .toBeGreaterThanOrEqual(fixture.session.windows.controls.minProseWidth);
      await filters.close();
      const reopened = await openViewerFilters(viewer);
      const savedResponses = reopened.panel.getByRole("checkbox", { name: /^responses/ });
      await expect(savedResponses).not.toBeChecked();
      await savedResponses.check();
      await expect(savedResponses).toBeChecked();
      await reopened.close();
      const tabs = viewer.locator(".txn-footer [role=tab]");
      await tabs.first().focus();
      await page.keyboard.press("End");
      const last = tabs.last();
      await expect(last).toBeFocused();
      await expect(last).toHaveAttribute("aria-selected", "true");
      await expect(last).toContainText(fixture.session.tabs.at(-1)!);
      const visibility = await last.evaluate(element => {
        const box = element.getBoundingClientRect();
        const list = element.closest('[role="tablist"]')!.getBoundingClientRect();
        const frame = element.closest(".lp-windows-front")!.getBoundingClientRect();
        const style = getComputedStyle(element);
        const ring = style.outlineStyle === "none" ? 0 : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
        return {
          left: box.left - ring,
          right: box.right + ring,
          top: box.top,
          bottom: box.bottom,
          clipLeft: Math.max(0, list.left, frame.left),
          clipRight: Math.min(innerWidth, list.right, frame.right),
          clipTop: Math.max(0, frame.top),
          clipBottom: Math.min(innerHeight, frame.bottom),
        };
      });
      expect(visibility.left, `footer focus starts inside the visible area at ${width}`).toBeGreaterThanOrEqual(visibility.clipLeft - 1);
      expect(visibility.right, `footer label and focus ring stay inside the visible area at ${width}`).toBeLessThanOrEqual(visibility.clipRight + 1);
      expect(visibility.top, `footer focus stays below the clipped top at ${width}`).toBeGreaterThanOrEqual(visibility.clipTop - 1);
      expect(visibility.bottom, `footer focus stays above the clipped bottom at ${width}`).toBeLessThanOrEqual(visibility.clipBottom + 1);
    }
  });
}
