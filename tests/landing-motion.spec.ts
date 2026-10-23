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

  // a tap outside closes it, and so does following a link
  await button.tap();
  await expect(close).toHaveAttribute("aria-expanded", "true");
  await page.touchscreen.tap(195, 820);
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

test("the install commands type in once when the terminal comes into view, and show whole without motion", async ({
  page,
}) => {
  await page.goto("/");
  const terminal = page.locator(".gs-window");
  const characters = terminal.locator(".gs-line").first().locator(".gs-ch");
  // below the fold the commands wait, hidden, to be typed
  await expect(terminal).toHaveAttribute("data-typing", "wait");
  expect(await characters.first().evaluate((character) => getComputedStyle(character).opacity)).toBe("0");

  await terminal.scrollIntoViewIfNeeded();
  await expect(terminal).toHaveAttribute("data-typing", "run");
  // one keystroke after another: each character waits a little longer than the one before
  const delays = await characters.evaluateAll((items) =>
    items.slice(0, 3).map((item) => parseFloat(getComputedStyle(item).animationDelay)),
  );
  expect(delays[1]!).toBeGreaterThan(delays[0]!);
  expect(delays[2]!).toBeGreaterThan(delays[1]!);
  await expect(terminal).toHaveAttribute("data-typing", "done", { timeout: 6000 });
  expect(await characters.last().evaluate((character) => getComputedStyle(character).opacity)).toBe("1");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await terminal.getAttribute("data-typing")).toBeNull();
  expect(await characters.first().evaluate((character) => getComputedStyle(character).opacity)).toBe("1");
});

test("the session's windows fan out from one stack once, the transcript wide in front, all inside the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const windows = page.locator(".lp-windows");
  const back = windows.locator(".lp-windows-term");
  await expect(windows).toHaveAttribute("data-fanned", "false");
  expect(await back.evaluate((element) => getComputedStyle(element).opacity)).toBe("0");

  await windows.scrollIntoViewIfNeeded();
  await expect(windows).toHaveAttribute("data-fanned", "true");
  await expect
    .poll(() => back.evaluate((element) => getComputedStyle(element).transform))
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await expect
    .poll(() => windows.locator(".lp-check").evaluate((element) => getComputedStyle(element).transform))
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await windows.evaluate((group) => {
      const rect = (selector: string) => group.querySelector(selector)!.getBoundingClientRect();
      const column = group.parentElement!;
      const style = getComputedStyle(column);
      const left = column.getBoundingClientRect().left + parseFloat(style.paddingLeft);
      const inner = column.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      return {
        back: rect(".lp-windows-term"),
        front: rect(".lp-windows-front .mac-win"),
        check: rect(".lp-check"),
        left,
        right: left + inner,
        inner,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    // behind and up to the left; the transcript wide in front; the check over the front window's lower left edge
    expect(layout.back.left, `at ${width}`).toBeLessThan(layout.front.left);
    expect(layout.back.top, `at ${width}`).toBeLessThan(layout.front.top);
    expect(layout.check.left, `at ${width}`).toBeLessThan(layout.front.left);
    expect(layout.check.right, `at ${width}`).toBeGreaterThan(layout.front.left);
    // over the front window's left edge on a wide screen; hanging just under it on a phone, clear of the reel's controls
    // it crosses only the front window's bottom edge on a wide screen, never its content; on a phone it hangs below
    if (width === 1440) {
      expect(layout.check.top).toBeLessThan(layout.front.bottom);
      expect(layout.check.top).toBeGreaterThanOrEqual(layout.front.bottom - 16);
    } else expect(layout.check.top).toBeGreaterThanOrEqual(layout.front.bottom);
    if (width === 1440) expect(layout.front.width / layout.inner).toBeGreaterThan(0.85);
    expect(layout.front.right, `the transcript runs past the content at ${width}`).toBeLessThanOrEqual(layout.right + 1);
    expect(layout.back.left, `the Terminal runs past the content at ${width}`).toBeGreaterThanOrEqual(layout.left - 1);
    expect(layout.overflow, `the page overflows at ${width}`).toBe(false);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await back.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
});

test("the transcript browser fits at phone and tablet widths, a long line scrolling inside its own block", async ({
  browser,
}) => {
  for (const width of [390, 768]) {
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

test("the hero picture loops while on screen, pauses on request, and holds still for reduced motion", async ({
  page,
}) => {
  const panel = page.locator(".hf-panel");
  const flow = panel.locator(".hf");
  const picture = flow.getByRole("img");
  const card = flow.locator(".hf-card").first();
  const running = () => card.evaluate((element) => element.getAnimations().map((animation) => animation.playState));

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const agent of fixture.hero.flow.agents) {
      await expect(picture).toHaveAttribute("aria-label", new RegExp(agent));
    }
    // the picture tells its story in shapes; the words are only in its accessible name
    await expect(picture.locator(".hf-card").first()).toBeVisible();
    expect((await picture.innerText()).trim()).toBe("");
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
    // every part stays inside the picture, and the pause control inside its panel without covering the scene
    const outside = await panel.evaluate((root) => {
      const inside = (box: DOMRect, frame: DOMRect) =>
        box.left >= frame.left - 1 && box.right <= frame.right + 1 && box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1;
      const scene = root.querySelector(".hf")!.getBoundingClientRect();
      const parts = [...root.querySelectorAll(".hf-stage > *")]
        .map((element) => element.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0)
        .filter((box) => !inside(box, scene)).length;
      const toggle = root.querySelector(".hf-toggle")!.getBoundingClientRect();
      return { parts, toggle: inside(toggle, root.getBoundingClientRect()) && toggle.top >= scene.bottom };
    });
    expect(outside, `the picture overflows at ${width}`).toEqual({ parts: 0, toggle: true });
  }

  expect(await running()).toEqual(["running"]);
  await panel.getByRole("button", { name: fixture.hero.flow.pause }).click();
  await expect(flow).toHaveAttribute("data-paused", "true");
  expect(await running()).toEqual(["paused"]);
  await panel.getByRole("button", { name: fixture.hero.flow.play }).click();
  await expect(flow).toHaveAttribute("data-paused", "false");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await running()).toEqual([]);
  await expect(card).toHaveCSS("opacity", "1");
  await expect(panel.getByRole("button", { name: fixture.hero.flow.pause })).toBeHidden();
});
