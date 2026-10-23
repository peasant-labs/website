import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadLandingFixture, PHONE, visibleSlide } from "./landing-fixture";

const fixture = loadLandingFixture();

test("the landing reads in order and carries none of the removed sections", async ({ page }) => {
  const response = await page.goto("/");
  const html = (await response!.text()).toLowerCase();

  await expect(page.locator("h1")).toHaveText(fixture.hero.title);
  await expect(page.locator(".lp-lede")).toHaveText(fixture.hero.lede);

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
  ).toEqual(fixture.footer);
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

test("the install shell shows each platform's exact command, whole, and copies it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const shell = page.locator("[data-install-shell]");

  for (const platform of fixture.install.platforms) {
    const tab = shell.getByRole("tab", { name: platform.label });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const lines = shell.locator(".gs-line");
    await expect(lines).toHaveCount(2);
    await expect(lines.nth(0).locator("[data-command]")).toHaveText(platform.command);
    await expect(lines.nth(1).locator("[data-command]")).toHaveText(fixture.install.kickstart);

    // Never cut off: the command wraps inside its line rather than overflowing it.
    const clipped = await lines
      .nth(0)
      .locator("[data-command]")
      .evaluate((code) => code.scrollWidth > code.clientWidth + 1);
    expect(clipped, `${platform.label} command is cut off at 390`).toBe(false);

    await lines.nth(0).getByRole("button", { name: `copy ${platform.command}` }).click();
    await expect(lines.nth(0).getByRole("button", { name: `copied ${platform.command}` })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(platform.command);
  }

  // The tabs are a real tablist: arrow keys move between platforms.
  await shell.getByRole("tab", { name: fixture.install.platforms[0]!.label }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(shell.getByRole("tab", { name: fixture.install.platforms[1]!.label })).toBeFocused();

  const guide = page.getByRole("link", { name: fixture.install.guide.label });
  await expect(guide).toHaveAttribute("href", fixture.install.guide.href);
});

test("the use-case carousel: one slide per audience, tabs, arrows and keys", async ({ page }) => {
  await page.goto("/");
  const carousel = page.locator("[data-use-cases]");
  await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  const tabs = carousel.getByRole("tab");
  await expect(tabs).toHaveText(fixture.useCases.slides.map((slide) => slide.label));

  for (const slide of fixture.useCases.slides) {
    await carousel.getByRole("tab", { name: slide.label }).click();
    const panel = visibleSlide(page);
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute("id", `uc-panel-${slide.id}`);
    // one picture per slide (one per theme is in the DOM; one is shown)
    await expect(panel.locator("img:visible")).toHaveCount(1);
    await expect(panel.locator(".uc-cap-text")).toHaveText(slide.capabilities);
    // the capabilities are a caption on the picture, not controls
    await expect(panel.locator(".uc-caption button, .uc-caption a")).toHaveCount(0);
    await expect(panel.locator(".uc-figure .uc-caption")).toHaveCount(1);
    // beside the picture: the audience, its sentence, and one action
    await expect(panel.locator(".uc-copy h3")).toHaveText(slide.label);
    await expect(panel.locator(".uc-copy p")).toHaveText(slide.sentence);
    const cta = panel.locator(".uc-copy").getByRole("link", { name: slide.cta.label, exact: true });
    await expect(cta).toHaveAttribute("href", slide.cta.href);
  }

  const first = fixture.useCases.slides[0]!;
  const second = fixture.useCases.slides[1]!;
  const last = fixture.useCases.slides.at(-1)!;
  await carousel.getByRole("tab", { name: first.label }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(carousel.getByRole("tab", { name: second.label })).toBeFocused();
  await expect(carousel.getByRole("tab", { name: second.label })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(carousel.getByRole("tab", { name: last.label })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(carousel.getByRole("tab", { name: first.label })).toHaveAttribute("aria-selected", "true");

  await carousel.getByRole("button", { name: "previous use case" }).click();
  await expect(carousel.getByRole("tab", { name: last.label })).toHaveAttribute("aria-selected", "true");
  await carousel.getByRole("button", { name: "next use case" }).click();
  await expect(carousel.getByRole("tab", { name: first.label })).toHaveAttribute("aria-selected", "true");
});

test("the use-case stage sets the picture beside its copy, with the tabs in one row above", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const tabs = [...document.querySelectorAll(".uc-tab")].map((tab) => tab.getBoundingClientRect());
      const figure = rect('.uc-panel[data-active="true"] .uc-figure');
      const copy = rect('.uc-panel[data-active="true"] .uc-copy');
      const stage = rect(".uc-stage");
      const arrows = rect(".uc-arrows");
      return {
        oneRow: tabs.every((tab) => Math.abs(tab.top - tabs[0]!.top) < 1),
        tabsAbove: tabs.every((tab) => tab.bottom <= stage.top + 1),
        copyBeside: copy.left >= figure.right - 1,
        copyBelow: copy.top >= figure.bottom - 1,
        arrowsBelow: arrows.top >= stage.bottom - 1,
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    expect(geometry.oneRow, `tabs wrap at ${width}`).toBe(true);
    expect(geometry.tabsAbove, `tabs are not above the stage at ${width}`).toBe(true);
    expect(geometry.arrowsBelow, `arrows are not under the stage at ${width}`).toBe(true);
    expect(geometry.pageOverflow, `page overflows at ${width}`).toBe(false);
    if (width === 1440) expect(geometry.copyBeside, "copy is not beside the picture").toBe(true);
    else expect(geometry.copyBelow, "copy is not under the picture on a phone").toBe(true);
  }
});

test("captions fade through one capability at a time, hold on hover, and stand still under reduced motion", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const carousel = page.locator("[data-use-cases]");
  await carousel.scrollIntoViewIfNeeded();
  const slide = fixture.useCases.slides[0]!;
  const on = carousel.locator('.uc-panel[data-active="true"] .uc-cap[data-on="true"] .uc-cap-text');

  await expect(on).toHaveText([slide.capabilities[0]!]);
  await page.mouse.move(0, 0);
  await page.clock.runFor(fixture.useCases.captionMs + 50);
  await expect(on).toHaveText([slide.capabilities[1]!]);

  await carousel.locator(".uc-stage").hover();
  await page.clock.runFor(fixture.useCases.captionMs * 2);
  await expect(on).toHaveText([slide.capabilities[1]!]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const caps = page.locator('.uc-panel[data-active="true"] .uc-cap');
  await expect(caps.locator(".uc-cap-text")).toHaveText(slide.capabilities);
  expect(await caps.evaluateAll((items) => items.map((item) => getComputedStyle(item).opacity))).toEqual([
    "1",
    "1",
    "1",
  ]);
});

test("how it works: three steps, each with its scene; choosing one scrolls to it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const steps = page.locator(".hw-step");
  await expect(steps.locator(".hw-step-title")).toHaveText(fixture.how.steps.map((step) => step.title));

  for (const [index, step] of fixture.how.steps.entries()) {
    await steps.nth(index).click();
    await expect(steps.nth(index)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".hw-step-body:visible")).toHaveText(step.body);
    // the section is held while it is read: the window stays on screen
    await expect(page.locator(".hw-window")).toBeInViewport();
    const view = page.locator(".hw-scroll .hw-view");
    await expect(view).toHaveAttribute("role", "img");
    expect((await view.getAttribute("aria-label"))?.length ?? 0).toBeGreaterThan(20);
    // the scene is fairtrade's components on a screen nobody can tab into
    await expect(view.locator(".scn-screen")).toHaveAttribute("inert", "");
  }

  // the publish action in the scene keeps its label on one line
  const label = page.locator('.hw-view[data-scene="publish"] [data-focus="publish"]');
  await expect(label).toHaveText(new RegExp(`^(${fixture.how.publishLabel}|done)$`));
  expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test("scrolling walks the held section through steps 1, 2 and 3, then lets the page go on", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
  const steps = page.locator(".hw-step");
  for (const [index, offset] of [0.2, 1.2, 2.2].entries()) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + 900 * offset);
    await expect(steps.nth(index)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".hw-window")).toBeInViewport();
  }
  // after the third step the section lets go and the next one arrives
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + 900 * 3.2);
  await expect(page.locator("#install h2")).toBeInViewport();
});

test("on a phone the scene window holds under the header while the steps scroll beneath it", async ({
  browser,
}) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/");
  const flow = page.locator(".hw-flow-step");
  await expect(flow).toHaveCount(fixture.how.steps.length);
  for (const index of [0, 1, 2]) {
    await flow.nth(index).evaluate((step) => step.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(flow.nth(index)).toHaveAttribute("data-on", "true");
    const held = await page.locator(".hw-side").evaluate((side) => {
      const box = side.getBoundingClientRect();
      const header = document.querySelector(".site-bar")!.getBoundingClientRect();
      return Math.abs(box.top - header.bottom) < 2 && box.height < window.innerHeight * 0.6;
    });
    expect(held, `the window is not held under the header at step ${index + 1}`).toBe(true);
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

test("a sample session opens in fairtrade's viewer, labelled as sample, with redaction markers", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#session");
  const demo = section.locator("[data-transcript-demo]");
  await expect(demo).toHaveAttribute("aria-label", fixture.session.label);
  await expect(demo.locator(".txn-app")).toHaveCount(1);
  await expect(demo.locator("img")).toHaveCount(0);
  await expect(demo).toContainText(fixture.session.sessionId);
  await expect(section.locator(".lp-note")).toHaveText(fixture.session.note);

  await demo.getByRole("tab", { name: /^full trace/ }).click();
  for (const marker of fixture.session.markers) {
    await expect(demo, `the viewer does not show ${marker}`).toContainText(marker);
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
  await expect(page.locator(".art-light").first()).toBeVisible();
  await expect(page.locator(".art-dark").first()).toBeHidden();
});

test("the docs sidebar lists only destinations that exist and marks the page you are on", async ({
  page,
  request,
}) => {
  await page.goto("/docs");
  const sidebar = page.getByRole("complementary", { name: "docs" });
  const links = sidebar.locator("nav:not(.asb-apps) a.asb-item");
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
      page.getByRole("complementary", { name: "docs" }).locator('nav:not(.asb-apps) [aria-current="page"]'),
    ).toHaveText(item.label);
  }
});

test("on a phone the docs sidebar folds into fairtrade's top bar and drawer", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/docs/guides/evals");
  await expect(page.locator(".asb-item").first()).toBeHidden();
  await page.getByRole("button", { name: "open the menu" }).tap();
  await expect(page.locator("nav:not(.asb-apps) a.asb-item").first()).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await context.close();
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
