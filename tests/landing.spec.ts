import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadLandingFixture, PHONE, cardOf } from "./landing-fixture";

const fixture = loadLandingFixture();

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

test("the install terminal types each platform's exact command at its prompt, whole, and copies it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const shell = page.locator("[data-install-shell]");
  // the commands sit in a Terminal window, not in a box of the site's own
  await expect(shell.locator(".mac-win-terminal .gs-lines")).toHaveCount(1);
  // and the Terminal takes the page's own appearance: light on the light theme, dark on the dark one
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    const lightness = await shell.locator(".gs-term .mac-body").evaluate((body) => {
      const [r, g, b] = getComputedStyle(body).backgroundColor.match(/\d+/g)!.map(Number);
      return (0.2126 * r! + 0.7152 * g! + 0.0722 * b!) / 255;
    });
    if (theme === "light") expect(lightness, "the install terminal is inverted on the light theme").toBeGreaterThan(0.8);
    else expect(lightness, "the install terminal is bright on the dark theme").toBeLessThan(0.2);
  }

  for (const platform of fixture.install.platforms) {
    const tab = shell.getByRole("tab", { name: platform.label });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const lines = shell.locator(".gs-line");
    await expect(lines).toHaveCount(2);
    await expect(lines.nth(0).locator("[data-command]")).toHaveText(platform.command);
    await expect(lines.nth(1).locator("[data-command]")).toHaveText(fixture.install.kickstart);
    await expect(lines.locator(".gs-prompt")).toHaveText([platform.prompt, platform.prompt]);

    // Never cut off: the line wraps inside the window rather than overflowing it.
    const clipped = await lines
      .nth(0)
      .locator(".gs-text")
      .evaluate((text) => text.scrollWidth > text.clientWidth + 1);
    expect(clipped, `${platform.label} command is cut off at 390`).toBe(false);

    await lines.nth(0).getByRole("button", { name: `copy ${platform.command}` }).click();
    await expect(lines.nth(0).getByRole("button", { name: `copied ${platform.command}` })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(platform.command);
  }

  // The tabs are a real tablist: arrow keys move between platforms.
  await shell.getByRole("tab", { name: fixture.install.platforms[0]!.label }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(shell.getByRole("tab", { name: fixture.install.platforms[1]!.label })).toBeFocused();

  const guide = page.locator("#install").getByRole("link", { name: fixture.install.guide.label });
  await expect(guide).toHaveAttribute("href", fixture.install.guide.href);
});

test("the use cases show all four audiences at once, each led by the capability it shows, with its picture and one action", async ({
  page,
}) => {
  await page.goto("/");
  const uses = page.locator("[data-use-cases]");
  // no carousel: nothing to page through, every audience is on the page
  await expect(uses.getByRole("tab")).toHaveCount(0);
  await expect(uses.locator("[aria-roledescription]")).toHaveCount(0);
  await expect(uses.locator("h3")).toHaveText(fixture.useCases.slides.map((slide) => slide.label));
  await expect(uses.locator("h3 svg")).toHaveCount(fixture.useCases.slides.length);

  for (const slide of fixture.useCases.slides) {
    const card = cardOf(page, slide.id);
    await expect(card).toHaveAttribute("aria-labelledby", `uc-${slide.id}-title`);
    await expect(card.locator(".uc-cap-text")).toHaveText(slide.capabilities);
    // the capability showing is the card's headline, set larger than the audience's label
    const sizes = await card.evaluate((element) => ({
      audience: parseFloat(getComputedStyle(element.querySelector("h3")!).fontSize),
      capability: parseFloat(getComputedStyle(element.querySelector('.uc-cap[data-on="true"]')!).fontSize),
    }));
    expect(sizes.capability, `${slide.label}: the capability does not lead the card`).toBeGreaterThan(sizes.audience);
    // one segment per capability; choosing one shows its headline and its own picture
    const segments = card.locator(".uc-segs").getByRole("button");
    await expect(segments).toHaveCount(slide.capabilities.length);
    const picture = card.locator("img:visible");
    const shows = (capIndex: number) => new RegExp(`^/art/${slide.pictures[capIndex]}-(light|dark)\\.png$`);
    for (const capIndex of [2, 0]) {
      await segments.nth(capIndex).click();
      await expect(card.locator('.uc-cap[data-on="true"] .uc-cap-text')).toHaveText([slide.capabilities[capIndex]!]);
      await expect(segments.nth(capIndex)).toHaveAttribute("aria-current", "true");
      // the two cross-fade, then only the caption's own is left
      await expect(picture).toHaveCount(1);
      await expect(picture).toHaveAttribute("src", shows(capIndex));
    }
    const cta = card.getByRole("link", { name: slide.cta.label, exact: true });
    await expect(cta).toHaveAttribute("href", slide.cta.href);
  }

  // the segments are reachable from the keyboard
  await cardOf(page, fixture.useCases.slides[0]!.id).getByRole("button").first().focus();
  await page.keyboard.press("Tab");
  await expect(cardOf(page, fixture.useCases.slides[0]!.id).getByRole("button").nth(1)).toBeFocused();
});

test("the use cases sit in an aligned grid, two by two with every part on one line, and one column on a phone", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const geometry = await page.evaluate(() => {
      // layout boxes, not painted ones: a part still waiting to fade up is drawn a little lower
      const place = (element: Element) => {
        const box = element as HTMLElement;
        return { top: box.offsetTop, left: box.offsetLeft, width: box.offsetWidth };
      };
      const grid = document.querySelector("[data-use-cases]") as HTMLElement;
      const cards = [...grid.querySelectorAll(".uc-card")];
      const parts = (card: Element) =>
        [".uc-figure", "h3", ".uc-caps", ".uc-segs", ".uc-cta"].map((selector) => place(card.querySelector(selector)!));
      const rows = [
        [cards[0]!, cards[1]!],
        [cards[2]!, cards[3]!],
      ];
      const figures = [...grid.querySelectorAll(".uc-figure")];
      const room = figures.map((figure) => {
        const art = figure.querySelector(".uc-shot[data-on='true'] .uc-art")!.getBoundingClientRect();
        const box = figure.getBoundingClientRect();
        return Math.min(art.left - box.left, box.right - art.right, art.top - box.top, box.bottom - art.bottom);
      });
      return {
        widths: new Set(cards.map((card) => place(card).width)).size,
        columns: new Set(cards.map((card) => place(card).left)).size,
        // side by side, each part of a card starts on the same line as its neighbour's
        aligned: rows.every(([a, b]) => parts(a).every((part, index) => part.top === parts(b)[index]!.top)),
        // every picture sits on a surface of its own, with no border boxing it in
        panelGround: figures.every(
          (figure) => getComputedStyle(figure).backgroundColor !== getComputedStyle(document.body).backgroundColor,
        ),
        panelBorder: getComputedStyle(figures[0]!).borderTopWidth,
        room: Math.min(...room),
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    expect(geometry.widths, `the use cases are not one width at ${width}`).toBe(1);
    expect(geometry.columns, `use cases are not ${width === 1440 ? "two" : "one"} across at ${width}`).toBe(
      width === 1440 ? 2 : 1,
    );
    if (width === 1440) expect(geometry.aligned, "parts of side-by-side cards do not line up").toBe(true);
    expect(geometry.panelGround, `the picture has no panel of its own at ${width}`).toBe(true);
    expect(geometry.panelBorder, `the picture's panel is boxed in at ${width}`).toBe("0px");
    expect(geometry.room, `the picture is crowded against its panel at ${width}`).toBeGreaterThanOrEqual(
      width === 1440 ? 48 : 24,
    );
    expect(geometry.pageOverflow, `page overflows at ${width}`).toBe(false);
  }
});

test("each audience cycles on its own clock, a quarter apart, holds on hover, and stands still under reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const uses = page.locator("[data-use-cases]");
  const slides = fixture.useCases.slides;
  const first = cardOf(page, slides[0]!.id);
  const fill = first.locator(".uc-seg-fill");

  // off screen every clock holds at its start; each lasts as long as its segment takes to fill,
  // and the four start a quarter of that apart
  await expect(first).toHaveAttribute("data-playing", "false");
  expect(await fill.evaluate((bar) => getComputedStyle(bar).animationDuration)).toBe(
    `${fixture.useCases.captionMs / 1000}s`,
  );
  const delays = await uses
    .locator(".uc-seg-fill")
    .evaluateAll((bars) => bars.map((bar) => getComputedStyle(bar).animationDelay));
  expect(delays).toEqual(slides.map((_, order) => `${(-order * fixture.useCases.captionMs) / 4 / 1000}s`));

  await uses.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(first).toHaveAttribute("data-playing", "true");

  const on = first.locator('.uc-cap[data-on="true"] .uc-cap-text');
  await expect(on).toHaveText([slides[0]!.capabilities[0]!]);
  await fill.dispatchEvent("animationend");
  await expect(on).toHaveText([slides[0]!.capabilities[1]!]);
  // after the third it comes back to the first
  await first.locator(".uc-seg-fill").dispatchEvent("animationend");
  await first.locator(".uc-seg-fill").dispatchEvent("animationend");
  await expect(on).toHaveText([slides[0]!.capabilities[0]!]);

  // hovering one card holds its clock where it is; its neighbours carry on
  await first.locator(".uc-figure").hover();
  await expect(first).toHaveAttribute("data-playing", "false");
  expect(await first.locator(".uc-seg-fill").evaluate((bar) => getComputedStyle(bar).animationPlayState)).toBe(
    "paused",
  );
  await expect(cardOf(page, slides[1]!.id)).toHaveAttribute("data-playing", "true");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const slide of slides) {
    const caps = cardOf(page, slide.id).locator(".uc-cap");
    await expect(caps.locator(".uc-cap-text")).toHaveText(slide.capabilities);
    expect(await caps.evaluateAll((items) => items.map((item) => getComputedStyle(item).opacity))).toEqual([
      "1",
      "1",
      "1",
    ]);
  }
  // with nothing cycling there is nothing to step through
  await expect(uses.locator(".uc-seg")).toHaveCount(0);
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

test("how it works: three steps, each with its scene; choosing one scrolls to it", async ({ page }) => {
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
  // replay is the icon alone, named for assistive technology
  const replay = page.locator("#how").getByRole("button", { name: "replay" });
  await expect(replay).toHaveText("");
  await expect(page.locator(".hw-step-body")).toHaveText(fixture.how.steps.map((step) => step.body));
  const list = page.locator(".hw-steps");
  let listHeight: number | null = null;

  for (const [index] of fixture.how.steps.entries()) {
    await steps.nth(index).click();
    await expect(steps.nth(index)).toHaveAttribute("aria-pressed", "true");
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
    // the camera carries the screen and the cursor, nothing drawn around a click
    await expect(view.locator(".scn-camera > :not(.scn-screen, .scn-cursor)")).toHaveCount(0);
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
  await steps.nth(0).click();
  const record = page.locator('.hw-scroll .hw-view[data-scene="record"]');
  await expect(record.locator(".mac-win-terminal")).toHaveCount(1);
  await expect(record.locator(".mac-win-terminal .mac-title")).toHaveText(/^shop — (zsh|claude) — 80×24$/);
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
  await expect(page.locator("#install")).toBeInViewport();
});

test("on a phone the scene holds under the header with the steps right under it, one open at a time", async ({
  browser,
}) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/");
  const items = page.locator(".hw-steps > li");
  await expect(items).toHaveCount(fixture.how.steps.length);
  const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
  const height = page.viewportSize()!.height;
  for (const [index, offset] of [0.2, 1.2, 1.9].entries()) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + height * offset);
    await expect(items.nth(index)).toHaveAttribute("data-on", "true");
    await expect
      .poll(() =>
        page
          .locator(".hw-step-more")
          .evaluateAll((parts) => parts.map((part) => part.getBoundingClientRect().height > 1)),
      )
      .toEqual(fixture.how.steps.map((_, at) => at === index));
    const layout = await page.evaluate(() => {
      const scene = document.querySelector(".hw-scroll .hw-view")!.getBoundingClientRect();
      const list = document.querySelector(".hw-steps")!.getBoundingClientRect();
      const header = document.querySelector(".site-bar")!.getBoundingClientRect();
      return {
        held: Math.abs(scene.top - header.bottom) < 2,
        gap: list.top - scene.bottom,
        fits: list.bottom <= window.innerHeight,
      };
    });
    expect(layout.held, `the scene is not held under the header at step ${index + 1}`).toBe(true);
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

test("a sample session plays as a reel of its beats, read by fairtrade's own transcript parts", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#session");
  const reel = section.locator("[data-reel]");
  await expect(reel).toHaveAttribute("aria-label", fixture.session.label);
  await expect(reel).toHaveAttribute("aria-roledescription", "carousel");
  // the session goes by its short title, with no crumb trail, no session id, and nothing to operate
  await expect(reel.locator(".reel-title")).toHaveText(fixture.session.title);
  await expect(section).not.toContainText(fixture.session.sessionId);
  await expect(section.getByRole("tab")).toHaveCount(0);
  await expect(section.locator(".txn-app, .txn-crumb")).toHaveCount(0);
  await expect(section.locator(".lp-note")).toHaveText(fixture.session.note);
  // one window, nothing stacked behind or over it
  await expect(section.locator(".mac-win")).toHaveCount(1);
  // the values peasant redacted show as their markers
  for (const marker of fixture.session.markers) {
    await expect(reel, `the reel does not show ${marker}`).toContainText(marker);
  }

  // one segment per beat; each can be chosen, and the window keeps its height whichever is shown
  const browser = section.locator(".mac-win-browser");
  const segments = reel.locator(".reel-segs").getByRole("button");
  await expect(segments).toHaveCount(fixture.session.beats.length);
  const height = () => browser.evaluate((window) => window.getBoundingClientRect().height);
  const before = await height();
  const stage = reel.locator(".reel-stage");
  const descriptions = new Set<string | null>();
  for (const [index, beat] of fixture.session.beats.entries()) {
    await segments.nth(index).click();
    await expect(segments.nth(index)).toHaveAttribute("aria-label", `show ${beat}`);
    await expect(segments.nth(index)).toHaveAttribute("aria-current", "true");
    await expect(reel.locator('.reel-beat[data-on="true"]')).toHaveCount(1);
    descriptions.add(await stage.getAttribute("aria-label"));
    expect(await height()).toBe(before);
  }
  // the stage is one picture to assistive technology, described by the beat at hand
  expect(descriptions.size).toBe(fixture.session.beats.length);

  // it plays on its own: a beat's time running out moves the reel on; hovering holds it
  await segments.nth(0).click();
  await page.mouse.move(0, 0);
  await reel.locator(".reel-seg-fill").dispatchEvent("animationend");
  await expect(segments.nth(1)).toHaveAttribute("aria-current", "true");
  await stage.hover();
  await expect(reel).toHaveAttribute("data-playing", "false");
  expect(await reel.locator(".reel-seg-fill").evaluate((bar) => getComputedStyle(bar).animationPlayState)).toBe(
    "paused",
  );

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

  // under reduced motion nothing plays on its own
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#session .reel-seg-fill")).toHaveCount(0);
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
