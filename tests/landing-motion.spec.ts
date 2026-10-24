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

  // the windows stand from a tablet's width; a phone shows the session's slice instead (its own test)
  for (const width of [1440, 768]) {
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
    const at = `at ${width}`;
    // behind and up to the left; the transcript wide in front; the check over the front window's lower left edge
    expect(layout.back.left, at).toBeLessThan(layout.front.left);
    expect(layout.back.top, at).toBeLessThan(layout.front.top);
    expect(layout.check.left, at).toBeLessThan(layout.front.left);
    expect(layout.check.right, at).toBeGreaterThan(layout.front.left);
    // it crosses only the front window's bottom edge, never its content
    expect(layout.check.top, at).toBeLessThan(layout.front.bottom);
    expect(layout.check.top, at).toBeGreaterThanOrEqual(layout.front.bottom - 16);
    expect(layout.front.width / layout.inner, at).toBeGreaterThan(0.85);
    expect(layout.front.right, `the transcript runs past the content ${at}`).toBeLessThanOrEqual(layout.right + 1);
    expect(layout.back.left, `the Terminal runs past the content ${at}`).toBeGreaterThanOrEqual(layout.left - 1);
    expect(layout.overflow, `the page overflows ${at}`).toBe(false);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await back.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
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
    // no windows: no browser chrome, no Terminal behind
    await expect(section.locator(".lp-session-win")).toBeHidden();
    await expect(section.locator(".lp-windows-term")).toBeHidden();
    await expect(slice).toBeVisible();
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

test("the hero picture loops while on screen, holds while a pointer rests on it, and holds still for reduced motion", async ({
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
    // the picture tells its story in shapes; the words are only in its accessible name, and it has no controls
    await expect(picture.locator(".hf-card").first()).toBeVisible();
    expect((await picture.innerText()).trim()).toBe("");
    await expect(panel.getByRole("button")).toHaveCount(0);
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
  await flow.hover();
  await expect(flow).toHaveAttribute("data-paused", "true");
  expect(await running()).toEqual(["paused"]);
  await page.mouse.move(0, 0);
  await expect(flow).toHaveAttribute("data-paused", "false");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await running()).toEqual([]);
  await expect(card).toHaveCSS("opacity", "1");
});
