import { expect, test } from "@playwright/test";
import { loadLandingFixture, PHONE, visibleSlide } from "./landing-fixture";

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
  await expect(sheet.getByRole("link", { name: fixture.header.install.label })).toHaveAttribute(
    "href",
    fixture.header.install.href,
  );
  await expect(sheet.locator("[data-theme-toggle]")).toBeVisible();
  // the page behind does not scroll while the menu is open
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

  // focus stays inside: past the last stop, tab comes back to the button
  const stops = await sheet.locator("a, button").count();
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

test("on a wide screen the header steps away while reading down and offers install once the hero's has gone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.locator(".site-bar");
  const install = page.locator(".site-bar-install");
  await expect(header).toHaveAttribute("data-scrolled", "false");
  await expect(install).toHaveAttribute("data-shown", "false");
  await page.mouse.wheel(0, 1500);
  await expect(header).toHaveAttribute("data-hidden", "true");
  await expect(header).toHaveAttribute("data-scrolled", "true");
  await page.mouse.wheel(0, -400);
  await expect(header).toHaveAttribute("data-hidden", "false");
  await expect(install).toHaveAttribute("data-shown", "true");
  await expect(install).toHaveAttribute("href", fixture.header.install.href);
  await expect(header.getByRole("button", { name: "open the menu" })).toBeHidden();
});

test("the carousel plays on its own and loops forward without rewinding", async ({ page }) => {
  await page.goto("/");
  const carousel = page.locator("[data-use-cases]");
  await carousel.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const slides = fixture.useCases.slides;
  const progress = carousel.locator(".uc-progress");
  await expect(progress).toHaveCount(1);
  expect(await progress.evaluate((bar) => getComputedStyle(bar).animationDuration)).toBe(
    `${fixture.useCases.slideMs / 1000}s`,
  );

  // the slide's time running out moves it on; from the last it goes forward onto the first
  await carousel.getByRole("tab", { name: slides.at(-1)!.label }).click();
  await page.mouse.move(0, 0);
  await carousel.locator(".uc-progress").dispatchEvent("animationend");
  await expect(carousel.getByRole("tab", { name: slides[0]!.label })).toHaveAttribute("aria-selected", "true");
  await expect(visibleSlide(page)).toHaveAttribute("id", `uc-panel-${slides[0]!.id}`);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-use-cases] .uc-progress")).toHaveCount(0);
});

test("on touch the carousel follows the finger: a flick or a long drag moves a slide, a short one springs back", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/");
  const stage = page.locator(".uc-stage");
  await stage.scrollIntoViewIfNeeded();
  // a drag that pauses before letting go carries no flick; one that lets go moving does
  const swipe = async (dx: number, { flick }: { flick: boolean }) => {
    const box = (await stage.boundingBox())!;
    const y = box.y + box.height / 3;
    const x0 = box.x + box.width * (dx < 0 ? 0.8 : 0.2);
    const base = { pointerType: "touch", pointerId: 7, isPrimary: true, clientY: y };
    await stage.dispatchEvent("pointerdown", { ...base, clientX: x0 });
    for (let index = 1; index <= 4; index += 1) {
      if (!flick) await page.waitForTimeout(60);
      await stage.dispatchEvent("pointermove", { ...base, clientX: x0 + (dx * index) / 4 });
    }
    if (!flick) await page.waitForTimeout(150);
    await stage.dispatchEvent("pointerup", { ...base, clientX: x0 + dx });
  };
  const tabs = page.locator("[data-use-cases]").getByRole("tab");
  await swipe(-30, { flick: false });
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await swipe(-40, { flick: true });
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await swipe(200, { flick: false });
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await context.close();
});

test("the transcript viewer reflows at phone and tablet widths and drops keyboard hints on touch", async ({
  browser,
}) => {
  for (const width of [390, 768]) {
    const context = await browser.newContext({ ...PHONE, viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    const demo = page.locator("#session [data-transcript-demo]");
    await demo.scrollIntoViewIfNeeded();
    const fit = await demo.evaluate((box) => {
      const edge = box.getBoundingClientRect().right + 1;
      const clipped = [...box.querySelectorAll<HTMLElement>(".txn-title, .txn-crumb, .txn-meta > *")].filter(
        (element) => element.getBoundingClientRect().right > edge,
      );
      return { overflow: box.scrollWidth - box.clientWidth, clipped: clipped.length };
    });
    expect(fit, `the viewer does not fit at ${width}`).toEqual({ overflow: 0, clipped: 0 });
    await expect(demo.locator(".txn-hint")).toBeHidden();
    await context.close();
  }
});

test("pictures grow their dots in once, and only when motion is allowed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/js-reveal/);
  await expect(page.locator(".lp-hero-art")).toHaveAttribute("data-revealed", "done", { timeout: 5000 });
  await expect(page.locator("#hero-title")).toHaveAttribute("data-shown", "true");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/js-reveal/);
  expect(
    await page.locator(".lp-hero-art .art-img").first().evaluate((image) => getComputedStyle(image).maskImage),
  ).toBe("none");
});
