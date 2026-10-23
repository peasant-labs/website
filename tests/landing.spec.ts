import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

type Link = { label: string; href: string };

type LandingFixture = {
  version: 1;
  header: { nav: Link[]; login: Link };
  footer: Link[];
  hero: {
    title: string;
    lede: string;
    primary: { label: string; target: string };
    secondary: { label: string; target: string };
  };
  sections: Array<{ id: string; heading: string }>;
  removed: string[];
  useCases: {
    captionMs: number;
    slides: Array<{ id: string; label: string; capabilities: string[]; cta: Link }>;
  };
  how: { steps: Array<{ title: string; body: string }>; consent: string; publishLabel: string };
  install: { platforms: Array<{ label: string; command: string }>; kickstart: string; guide: Link };
  session: { label: string; sessionId: string; note: string; markers: string[] };
  vision: { line: string; cta: Link };
  docsNav: Link[];
  posts: Array<{ slug: string; title: string }>;
};

function loadFixture(): LandingFixture {
  const root = parse(readFileSync(resolve("testdata/landing/landing.yaml"), "utf8")) as LandingFixture;
  if (root?.version !== 1) {
    throw new Error("testdata/landing/landing.yaml: expected version 1; update the loader with the fixture.");
  }
  for (const slide of root.useCases.slides) {
    if (slide.capabilities.length !== 3) {
      throw new Error(`useCases.slides.${slide.id}: a slide carries exactly three capabilities.`);
    }
  }
  return root;
}

const fixture = loadFixture();

async function visibleSlide(page: Page) {
  return page.locator(".uc-panel:not([hidden])");
}

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
    const panel = await visibleSlide(page);
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute("id", `uc-panel-${slide.id}`);
    // one picture per slide (one per theme is in the DOM; one is shown)
    await expect(panel.locator("img:visible")).toHaveCount(1);
    await expect(panel.locator(".uc-cap")).toHaveText(slide.capabilities);
    // the capabilities are a caption, not controls
    await expect(panel.locator(".uc-caption button, .uc-caption a")).toHaveCount(0);
    const cta = panel.getByRole("link", { name: slide.cta.label, exact: true });
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

test("captions fade through one capability at a time, hold on hover, and stand still under reduced motion", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const carousel = page.locator("[data-use-cases]");
  await carousel.scrollIntoViewIfNeeded();
  const slide = fixture.useCases.slides[0]!;
  const on = carousel.locator('.uc-panel:not([hidden]) .uc-cap[data-on="true"]');

  await expect(on).toHaveText([slide.capabilities[0]!]);
  await page.mouse.move(0, 0);
  await page.clock.runFor(fixture.useCases.captionMs + 50);
  await expect(on).toHaveText([slide.capabilities[1]!]);

  await carousel.locator(".uc-stage").hover();
  await page.clock.runFor(fixture.useCases.captionMs * 2);
  await expect(on).toHaveText([slide.capabilities[1]!]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const caps = page.locator(".uc-panel:not([hidden]) .uc-cap");
  await expect(caps).toHaveText(slide.capabilities);
  expect(await caps.evaluateAll((items) => items.map((item) => getComputedStyle(item).opacity))).toEqual([
    "1",
    "1",
    "1",
  ]);
});

test("how it works: three steps, each with its scene, and a consent line that reads right", async ({ page }) => {
  await page.goto("/");
  const steps = page.locator(".hw-step");
  await expect(steps.locator(".hw-step-title")).toHaveText(fixture.how.steps.map((step) => step.title));

  for (const [index, step] of fixture.how.steps.entries()) {
    await steps.nth(index).click();
    await expect(steps.nth(index)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".hw-step-body:visible")).toHaveText(step.body);
    const scene = page.locator(".hw-scene");
    await expect(scene).toHaveAttribute("role", "img");
    expect((await scene.getAttribute("aria-label"))?.length ?? 0).toBeGreaterThan(20);
  }

  await expect(page.locator(".hw-cons")).toHaveText(fixture.how.consent);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const label = page.locator(".hw-pub");
    await expect(label).toHaveText(fixture.how.publishLabel);
    const fits = await label.evaluate((element) => ({
      nowrap: getComputedStyle(element).whiteSpace === "nowrap",
      inside: element.scrollWidth <= element.clientWidth + 1,
    }));
    expect(fits, `the publish label wraps or overflows at ${width}`).toEqual({ nowrap: true, inside: true });
  }
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
  const links = sidebar.locator(".dx-item");
  expect(
    await links.evaluateAll((items) =>
      items.map((item) => ({ label: item.textContent?.trim(), href: item.getAttribute("href") })),
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
      page.getByRole("complementary", { name: "docs" }).locator('[aria-current="page"]'),
    ).toHaveText(item.label);
  }
});

test("on a phone the docs sidebar folds into a menu that opens in place", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/guides/evals");
  const menu = page.getByRole("button", { name: "open the docs menu" });
  await expect(page.locator(".dx-item").first()).toBeHidden();
  await menu.click();
  await expect(page.getByRole("button", { name: "close the docs menu" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".dx-item").first()).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
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
