import { expect, test } from "@playwright/test";
import { loadLandingFixture, PHONE } from "./landing-fixture";

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

test("the desktop collage exposes its supporting windows without covering the transcript's opening", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const windows = page.locator(".lp-windows");
  const back = windows.locator(".lp-windows-term");
  const shared = windows.locator(".lp-windows-x");
  await expect(windows).toHaveAttribute("data-fanned", "false");
  for (const item of [back, shared]) {
    expect(await item.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  }
  await windows.scrollIntoViewIfNeeded();
  await expect(windows).toHaveAttribute("data-fanned", "true");
  await expect(windows.locator(".txn-app")).toBeVisible();
  await expect.poll(() => back.evaluate((element) => getComputedStyle(element).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await expect.poll(() => shared.evaluate((element) => getComputedStyle(element).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  expect(await shared.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe("transform");

  for (const width of fixture.session.windows.widths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("#session [data-x-thread]").filter({ visible: true }), `at ${width}`).toHaveCount(1);
    const layout = await windows.evaluate((group) => {
      const rect = (selector: string) => group.querySelector(selector)!.getBoundingClientRect();
      const box = group.getBoundingClientRect();
      return {
        back: rect(".lp-windows-term"), front: rect(".lp-windows-front .mac-win"), shared: rect(".lp-windows-x .mac-win"),
        terminalBody: rect(".lp-windows-term .mac-body"),
        terminalOverflow: [...group.querySelectorAll(".lp-windows-term :is(.mac-body, .cc, .cc-welcome)")].map((element) => element.scrollWidth - element.clientWidth),
        terminalWelcome: rect(".lp-windows-term .cc-welcome"),
        terminalText: parseFloat(getComputedStyle(group.querySelector(".lp-windows-term .cc")!).fontSize),
        sharedBody: rect(".lp-windows-x .mac-body"),
        title: rect(".lp-windows-front .txn-title"),
        left: box.left, right: box.right, inner: box.width,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    const at = `at ${width}`;
    expect(layout.front.width / layout.inner, at).toBeGreaterThan(fixture.session.windows.frontMinRatio);
    expect(layout.front.width / layout.inner, at).toBeLessThan(fixture.session.windows.frontMaxRatio);
    expect(layout.front.right, at).toBeLessThanOrEqual(layout.right + 1);
    expect(layout.back.left, at).toBeGreaterThanOrEqual(layout.left - 1);
    expect(layout.front.top - layout.back.top, `the terminal's context stays exposed ${at}`).toBeGreaterThanOrEqual(fixture.session.windows.terminalExposedMin);
    expect(layout.back.bottom, `the terminal is layered behind the transcript ${at}`).toBeGreaterThan(layout.front.top);
    expect(layout.front.bottom - layout.shared.top, `the social window has a limited overlap ${at}`).toBeGreaterThan(0);
    expect(layout.front.bottom - layout.shared.top, at).toBeLessThanOrEqual(fixture.session.windows.socialOverlapMax);
    expect(layout.shared.top, `the social window leaves the transcript title clear ${at}`).toBeGreaterThan(layout.title.bottom);
    expect(layout.shared.right, at).toBeGreaterThan(layout.front.right);
    expect(layout.shared.right, at).toBeLessThanOrEqual(layout.right + 1);
    expect(layout.terminalBody.height, at).toBeGreaterThanOrEqual(fixture.session.terminalBodyMin);
    for (const overflow of layout.terminalOverflow) expect(overflow, `the terminal content fits its window ${at}`).toBeLessThanOrEqual(1);
    expect(layout.terminalWelcome.right, at).toBeLessThanOrEqual(layout.terminalBody.right);
    expect(layout.terminalText, at).toBeGreaterThanOrEqual(fixture.session.terminalTextMin);
    expect(layout.sharedBody.height, at).toBeGreaterThanOrEqual(fixture.session.sharedBodyMin);
    expect(layout.overflow, at).toBe(false);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(windows).toHaveAttribute("data-fanned", "false");
  for (const item of [back, shared]) {
    expect(await item.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    expect(await item.evaluate((element) => getComputedStyle(element).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
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

for (const { name, width, colorScheme, raisedGap, baselineSpread, subjectGap, topInset, frontDepth } of fixture.hero.flow.layouts) {
  test(`the hero composition keeps one compact scene and planted figures: ${name}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const flow = page.locator(".hf");
    await flow.scrollIntoViewIfNeeded();
    const composition = await flow.evaluate((root) => {
      const visible = (selector: string) => [...root.querySelectorAll(selector)].find((element) => getComputedStyle(element).display !== "none" && element.getBoundingClientRect().width > 0)!;
      const art = visible(".hf-art");
      const rect = (selector: string) => art.querySelector(selector)!.getBoundingClientRect().toJSON();
      return {
        height: root.getBoundingClientRect().height,
        width: root.getBoundingClientRect().width,
        top: root.getBoundingClientRect().top,
        card: visible(".hf-card").getBoundingClientRect().toJSON(),
        commons: rect(".hf-commons"),
        laptop: rect(".hf-laptop"),
        stack: visible(".hf-base").getBoundingClientRect().toJSON(),
        rake: rect('[data-member="rake"]'), wave: rect('[data-member="wave"]'), basket: rect('[data-member="basket"]'),
        backBody: rect('[data-member="wave"] .hf-person-body'), frontBody: rect('[data-member="basket"] .hf-person-body'),
      };
    });
    if (raisedGap !== undefined) {
      expect(composition.laptop.bottom - composition.stack.bottom, `phone transcript separation at ${width}`).toBeGreaterThan(composition.height * raisedGap);
    }
    if (baselineSpread !== undefined && subjectGap !== undefined && topInset !== undefined) {
      const bottoms = [composition.laptop.bottom, composition.stack.bottom, composition.basket.bottom];
      expect(Math.max(...bottoms) - Math.min(...bottoms), `the center stack shares the scene's ground at ${width}`).toBeLessThan(composition.height * baselineSpread);
      const gaps = [composition.stack.left - composition.laptop.right, composition.commons.left - composition.card.right];
      expect(Math.min(...gaps), `the resting subjects remain distinct at ${width}`).toBeGreaterThan(0);
      expect(Math.max(...gaps), `the subjects form one group at ${width}`).toBeLessThan(composition.width * subjectGap);
      const tops = [composition.laptop.top, composition.card.top, composition.commons.top];
      expect(Math.max(...tops) - composition.top, `the upper corners do not become empty pockets at ${width}`).toBeLessThan(composition.height * topInset);
    }
    expect(composition.basket.bottom - Math.max(composition.rake.bottom, composition.wave.bottom), `front figure at ${width}`).toBeGreaterThan(composition.height * frontDepth);
    expect(composition.basket.left, `the people gather around the front figure at ${width}`).toBeGreaterThan(composition.rake.left);
    expect(composition.basket.right, `the people gather around the front figure at ${width}`).toBeLessThan(composition.wave.right);
    expect(composition.backBody.height / composition.frontBody.height, `back figures are smaller at ${width}`).toBeLessThan(0.96);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(() => flow.evaluate((root) => root.getAnimations({ subtree: true }).length)).toBeGreaterThan(0);
    for (const frame of fixture.hero.flow.journeyFrames) {
      const escaped = await flow.evaluate((root, time) => {
        const animations = root.getAnimations({ subtree: true });
        const originalTimes = animations.map((animation) => animation.currentTime);
        for (const animation of animations) animation.currentTime = time;
        const bounds = root.getBoundingClientRect();
        const outside = [...root.querySelectorAll(".hf-card")].filter((element) => Number(getComputedStyle(element).opacity) > 0.01).filter((element) => {
          const box = element.getBoundingClientRect();
          return box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1;
        }).length;
        animations.forEach((animation, index) => { animation.currentTime = originalTimes[index]; });
        return outside;
      }, frame.time);
      expect(escaped, `cards stay in frame at ${width}, ${colorScheme}, ${frame.name}`).toBe(0);
    }
  });
}

test("the hero picture loops while on screen, holds while a pointer moves onto it, and holds still for reduced motion", async ({
  page,
}) => {
  const panel = page.locator(".hf-panel");
  const flow = panel.locator(".hf");
  const picture = flow.getByRole("img");
  const card = flow.locator(".hf-card").first();
  const running = () => card.evaluate((element) => element.getAnimations().map((animation) => animation.playState));

  for (const { width, colorScheme } of fixture.hero.flow.layouts.filter((layout) => layout.interaction)) {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const agent of fixture.hero.flow.agents) {
      await expect(picture).toHaveAttribute("aria-label", new RegExp(agent));
    }
    // the picture tells its story in shapes; the words are only in its accessible name, and it has no controls
    await expect(picture.locator(".hf-card").first()).toBeVisible();
    expect((await picture.innerText()).trim()).toBe("");
    await expect(panel.getByRole("button")).toHaveCount(0);
    await flow.scrollIntoViewIfNeeded();
    await expect(page.locator(".lp-hero-flow")).toHaveCSS("opacity", "1");
    const people = flow.locator(".hf-art:visible .hf-commons");
    const grounded = await people.boundingBox();
    for (const frame of fixture.hero.flow.groundedFrames) {
      await flow.evaluate((element, time) => {
        for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = time;
      }, frame);
      expect(await people.boundingBox(), `the people remain grounded at ${width}, ${colorScheme}, ${frame}ms`).toEqual(grounded);
    }
    // the picture holds its height from the first paint: nothing below it moves
    const layout = () =>
      flow.evaluate((root) => ({
        height: (root as HTMLElement).offsetHeight,
        next: document.querySelector<HTMLElement>("#uses")!.offsetTop,
      }));
    const before = await layout();
    expect(before.height).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    expect(await layout()).toEqual(before);
    // every part stays inside the picture
    const outside = await flow.evaluate((root) => {
      const frame = root.getBoundingClientRect();
      return [...root.querySelectorAll(".hf-stage > *")]
        .map((element) => element.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0)
        .filter((box) => box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1)
        .length;
    });
    expect(outside, `the picture overflows at ${width}`).toBe(0);
  }

  expect(await running()).toEqual(["running"]);
  expect(await flow.locator(".hf-wide .hf-commons").evaluate((element) => element.getAnimations())).toEqual([]);
  // scroll first: a scroll lets a hold go, and hover() would otherwise scroll after moving the pointer
  await flow.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await flow.hover();
  await expect(flow).toHaveAttribute("data-paused", "true");
  expect(await running()).toEqual(["paused"]);
  await page.mouse.move(0, 0);
  await expect(flow).toHaveAttribute("data-paused", "false");

  // scrolling the picture under a pointer that has not moved does not hold it
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = (await flow.boundingBox())!;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, Math.max(10, box.y - 200));
  await page.mouse.wheel(0, 300);
  await expect.poll(async () => (await flow.boundingBox())!.y).toBeLessThan(box.y - 200);
  await page.waitForTimeout(300);
  await expect(flow).toHaveAttribute("data-paused", "false");
  // moving the pointer over it does, and scrolling again lets it go
  await page.mouse.move(x + 4, Math.max(10, box.y - 200) + 4);
  await expect(flow).toHaveAttribute("data-paused", "true");
  await page.mouse.wheel(0, 40);
  await expect(flow).toHaveAttribute("data-paused", "false");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await running()).toEqual([]);
  expect(await flow.locator(".hf-wide .hf-commons").evaluate((element) => element.getAnimations())).toEqual([]);
  await expect(card).toHaveCSS("opacity", "1");
});

test("the window a pointer moves onto or focus moves into comes to the front, and stays there", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const windows = page.locator("#session .lp-windows");
  await windows.scrollIntoViewIfNeeded();
  // hydrated: the group has seen itself come into view
  await expect(windows).toHaveAttribute("data-fanned", "true");
  const order = () =>
    windows.evaluate((group) =>
      ["term", "front", "x"].reduce(
        (top, name) => {
          const z = Number(getComputedStyle(group.querySelector(`.lp-windows-${name}`)!).zIndex);
          return z > top.z ? { name, z } : top;
        },
        { name: "", z: -Infinity },
      ).name,
    );
  // untouched, the thread is the window in front
  await expect.poll(order).toBe("x");
  // each window comes forward from a part of it that shows, wherever the page's own bar is not over it
  const point = async (selector: string, fx: number, fy: number) => {
    await windows.locator(selector).scrollIntoViewIfNeeded();
    const box = (await windows.locator(selector).boundingBox())!;
    const [x, y] = [box.x + box.width * fx, box.y + box.height * fy];
    expect(await page.evaluate(([px, py]) => !!document.elementFromPoint(px, py)?.closest(".lp-windows"), [x, y])).toBe(true);
    await page.mouse.move(x, y);
  };
  await point(".lp-windows-term", 0.3, 0.15);
  await expect.poll(order).toBe("term");
  await point(".lp-windows-front", 0.3, 0.6);
  await expect.poll(order).toBe("front");
  // The transcript's reading controls remain unobstructed.
  const strip = windows.locator(".txn-rail-strip-right");
  const box = (await strip.boundingBox())!;
  const hit = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x, y)?.closest(".txn-rail-strip-right"),
    [box.x + box.width / 2, box.y + box.height * 0.6],
  );
  expect(hit, "the filters' strip is reachable once the transcript is in front").toBe(true);
  // it stays in front after the pointer leaves the windows
  await page.mouse.move(5, 5);
  await expect.poll(order).toBe("front");
  // The thread stays independently reachable below the transcript.
  await point(".lp-windows-x", 0.95, 0.1);
  await expect.poll(order).toBe("x");
  // keyboard focus brings its window forward too
  await windows.locator(".lp-windows-front .txn-stream").evaluate((stream) => stream.querySelector<HTMLElement>("a, button, [tabindex]")!.focus());
  await expect.poll(order).toBe("front");
});
