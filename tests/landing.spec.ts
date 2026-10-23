import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadLandingFixture, PHONE, visibleSlide } from "./landing-fixture";

const fixture = loadLandingFixture();

test("the landing reads in order and carries none of the removed sections", async ({ page }) => {
  const response = await page.goto("/");
  const html = (await response!.text()).toLowerCase();

  await expect(page.locator("h1")).toHaveText(fixture.hero.title);
  await expect(page.locator(".lp-lede")).toHaveText(fixture.hero.lede);
  await expect(page.locator(".lp-pillars li")).toHaveText(fixture.hero.pillars);

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

test("the use-case carousel: one slide per audience, labelled tabs, captions you can step through, and keys", async ({
  page,
}) => {
  await page.goto("/");
  const carousel = page.locator("[data-use-cases]");
  await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  const tabs = carousel.getByRole("tab");
  await expect(tabs).toHaveText(fixture.useCases.slides.map((slide) => slide.label));
  // every audience carries its icon, so the set reads at a glance
  await expect(tabs.locator("svg.uc-tab-ic")).toHaveCount(fixture.useCases.slides.length);
  // the arrows and their "n / 4" counter are gone: the tabs are the way between audiences
  await expect(carousel.locator(".uc-arrows")).toHaveCount(0);
  await expect(carousel.getByRole("button", { name: /use case$/ })).toHaveCount(0);

  for (const slide of fixture.useCases.slides) {
    await carousel.getByRole("tab", { name: slide.label }).click();
    const panel = visibleSlide(page);
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute("id", `uc-panel-${slide.id}`);
    // one picture per slide (one per theme is in the DOM; one is shown)
    await expect(panel.locator("img:visible")).toHaveCount(1);
    await expect(panel.locator(".uc-cap-text")).toHaveText(slide.capabilities);
    // the capabilities are a caption along the picture's panel, with one segment per capability to step to
    await expect(panel.locator(".uc-figure .uc-caption")).toHaveCount(1);
    await expect(panel.locator(".uc-caption a")).toHaveCount(0);
    const segments = panel.locator(".uc-caption").getByRole("button");
    await expect(segments).toHaveCount(slide.capabilities.length);
    await segments.nth(2).click();
    await expect(panel.locator('.uc-cap[data-on="true"] .uc-cap-text')).toHaveText([slide.capabilities[2]!]);
    await expect(segments.nth(2)).toHaveAttribute("aria-current", "true");
    await segments.nth(0).click();
    await expect(panel.locator('.uc-cap[data-on="true"] .uc-cap-text')).toHaveText([slide.capabilities[0]!]);
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

  // the segments are reachable from the keyboard too
  await page.keyboard.press("Tab");
  await expect(visibleSlide(page).locator(".uc-caption").getByRole("button").first()).toBeFocused();
});

test("the use-case stage sets the picture on its panel beside its copy, with every audience's tab in view above", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const tabs = [...document.querySelectorAll(".uc-tab")].map((tab) => tab.getBoundingClientRect());
      const row = rect(".uc-tabs-row");
      const figure = rect('.uc-panel[data-active="true"] .uc-figure');
      const copy = rect('.uc-panel[data-active="true"] .uc-copy');
      const stage = rect(".uc-stage");
      const rows = new Set(tabs.map((tab) => Math.round(tab.top))).size;
      const panel = getComputedStyle(document.querySelector('.uc-panel[data-active="true"] .uc-figure')!);
      return {
        rows,
        allInView: tabs.every((tab) => tab.left >= row.left - 1 && tab.right <= row.right + 1),
        tabsAbove: tabs.every((tab) => tab.bottom <= stage.top + 1),
        // the picture sits on a surface of its own, not on the page
        panelGround: panel.backgroundColor !== getComputedStyle(document.body).backgroundColor,
        figureLeftAtTabs: Math.abs(figure.left - tabs[0]!.left) < 1,
        copyBeside: copy.left >= figure.right - 1,
        copyBelow: copy.top >= figure.bottom - 1,
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    expect(geometry.rows, `tabs are not ${width === 1440 ? "one row" : "two by two"} at ${width}`).toBe(
      width === 1440 ? 1 : 2,
    );
    expect(geometry.allInView, `a tab is out of view at ${width}`).toBe(true);
    expect(geometry.tabsAbove, `tabs are not above the stage at ${width}`).toBe(true);
    expect(geometry.panelGround, `the picture has no panel of its own at ${width}`).toBe(true);
    expect(geometry.figureLeftAtTabs, `the picture's panel does not line up with the tabs at ${width}`).toBe(true);
    expect(geometry.pageOverflow, `page overflows at ${width}`).toBe(false);
    if (width === 1440) expect(geometry.copyBeside, "copy is not beside the picture").toBe(true);
    else expect(geometry.copyBelow, "copy is not under the picture on a phone").toBe(true);
  }
});

test("captions fade through one capability at a time, hold on hover, and stand still under reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const carousel = page.locator("[data-use-cases]");
  await carousel.scrollIntoViewIfNeeded();
  const slide = fixture.useCases.slides[0]!;
  const on = carousel.locator('.uc-panel[data-active="true"] .uc-cap[data-on="true"] .uc-cap-text');
  const fill = carousel.locator('.uc-panel[data-active="true"] .uc-seg-fill');

  await expect(on).toHaveText([slide.capabilities[0]!]);
  await page.mouse.move(0, 0);
  // each capability lasts as long as its segment takes to fill
  expect(await fill.evaluate((bar) => getComputedStyle(bar).animationDuration)).toBe(
    `${fixture.useCases.captionMs / 1000}s`,
  );
  await fill.dispatchEvent("animationend");
  await expect(on).toHaveText([slide.capabilities[1]!]);

  // hovering holds both clocks where they are
  await carousel.locator(".uc-stage").hover();
  await expect(carousel).toHaveAttribute("data-playing", "false");
  expect(await fill.evaluate((bar) => getComputedStyle(bar).animationPlayState)).toBe("paused");
  expect(
    await carousel.locator(".uc-progress").evaluate((bar) => getComputedStyle(bar).animationPlayState),
  ).toBe("paused");
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
  // with nothing cycling there is nothing to step through
  await expect(page.locator('.uc-panel[data-active="true"] .uc-seg')).toHaveCount(0);
});

test("how it works: three steps, each with its scene; choosing one scrolls to it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const steps = page.locator(".hw-step");
  await expect(steps.locator(".hw-step-title")).toHaveText(fixture.how.steps.map((step) => step.title));
  // each step is illustrated by its icon
  await expect(steps.locator("svg.hw-ic")).toHaveCount(fixture.how.steps.length);
  // the scene is the screen itself: no window shell around it
  await expect(page.locator(".hw-titlebar")).toHaveCount(0);

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
    // on a Mac: the menu bar, and windows with their three buttons
    await expect(view.locator(".mac-menubar")).toHaveCount(1);
    expect(await view.locator(".mac-win .mac-lights").count()).toBeGreaterThan(0);
    // the camera carries the screen and the cursor, nothing drawn around a click
    await expect(view.locator(".scn-camera > :not(.scn-screen, .scn-cursor)")).toHaveCount(0);
  }


  // the publish action in the scene keeps its label on one line
  const label = page.locator('.hw-view[data-scene="publish"] [data-focus="publish"]');
  await expect(label).toHaveText(new RegExp(`^(${fixture.how.publishLabel}|done)$`));
  expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);

  // the record scene is the terminal and the browser, not a list of other sessions behind
  await steps.nth(0).click();
  const record = page.locator('.hw-scroll .hw-view[data-scene="record"]');
  await expect(record.locator(".mac-win-terminal")).toHaveCount(1);
  await expect(record.locator("table")).toHaveCount(0);
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
  // it is shown in a browser window, at the address a published transcript has
  const browser = section.locator(".mac-win-browser");
  await expect(browser.locator(".mac-lights")).toBeVisible();
  await expect(browser.locator(".mac-url-text")).toHaveText(
    new RegExp(`/transcripts/${fixture.session.sessionId}$`),
  );

  const height = () => browser.evaluate((window) => window.getBoundingClientRect().height);
  const before = await height();
  await demo.getByRole("tab", { name: /^full trace/ }).click();
  for (const marker of fixture.session.markers) {
    await expect(demo, `the viewer does not show ${marker}`).toContainText(marker);
  }
  // switching what it shows never changes its height
  expect(await height()).toBe(before);
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

test("the docs starting points sit two by two on a wide screen, with no card left alone", async ({ page }) => {
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
