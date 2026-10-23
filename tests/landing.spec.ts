import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadLandingFixture, PHONE } from "./landing-fixture";

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
  // the commands sit in a Terminal window, not in a box of the site's own, with the systems as its tabs
  await expect(shell.locator(".mac-win-terminal .gs-lines")).toHaveCount(1);
  await expect(shell.locator(".mac-win-terminal").getByRole("tablist")).toHaveCount(1);
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
    // each step says what it does, numbered, over its command
    for (const [index, step] of fixture.install.steps.entries()) {
      await expect(lines.nth(index).locator(".gs-step")).toHaveText(`${index + 1}${step}`);
    }
    // each copy is as tall as a command line and sits at its own step's right edge,
    // beside the step's words on a phone so the command keeps the whole width
    const placed = await lines.evaluateAll((items) =>
      items.map((item) => {
        const text = item.querySelector(".gs-text")!.getBoundingClientRect();
        const step = item.querySelector(".gs-step")!.getBoundingClientRect();
        const copy = item.querySelector(".gs-copy")!.getBoundingClientRect();
        const line = parseFloat(getComputedStyle(item.querySelector(".gs-text")!).lineHeight);
        return {
          height: Math.abs(copy.height - line) < 1,
          inStep: copy.top < text.top && copy.bottom > step.top,
          rightEdge: copy.right >= text.right - 1,
        };
      }),
    );
    expect(placed).toEqual([
      { height: true, inStep: true, rightEdge: true },
      { height: true, inStep: true, rightEdge: true },
    ]);

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

test("the use cases are one row of all twelve capabilities, each tagged with its audience, all in the served page", async ({
  page,
}) => {
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await expect(row).toHaveAttribute("aria-roledescription", "carousel");
  await expect(row).toHaveAttribute("role", "region");
  await expect(row.getByRole("tab")).toHaveCount(0);
  // no arrows and no counter: the row is the way through
  await expect(row.getByRole("button")).toHaveCount(0);

  const cards = row.locator(".uc-card:not([aria-hidden])");
  const all = fixture.useCases.slides.flatMap((slide) =>
    slide.capabilities.map((capability, index) => ({
      slide,
      capability,
      detail: slide.details[index]!,
      picture: slide.pictures[index]!,
    })),
  );
  await expect(cards).toHaveCount(all.length);
  for (const [index, { slide, capability, detail, picture }] of all.entries()) {
    const card = cards.nth(index);
    await expect(card.locator("h3")).toHaveText(capability);
    await expect(card.locator(".uc-cap-detail")).toHaveText(detail);
    // a small tag names the audience, with its icon, the card's one icon besides the action's arrow
    await expect(card.locator(".uc-tag")).toHaveText(slide.label);
    await expect(card.locator(".uc-tag svg")).toHaveCount(1);
    await expect(card.locator("h3 svg, .uc-cap-detail svg, figure svg")).toHaveCount(0);
    await expect(card.locator("img").first()).toHaveAttribute(
      "src",
      new RegExp(`^/art/${picture}-(light|dark)\\.png$`),
    );
    const cta = card.getByRole("link", { name: slide.cta.label, exact: true });
    await expect(cta).toHaveAttribute("href", slide.cta.href);
  }
  // the loop's second set is hidden from assistive technology and out of the tab order
  const clones = row.locator('.uc-card[aria-hidden="true"]');
  await expect(clones).toHaveCount(all.length);
  expect(await clones.evaluateAll((items) => items.every((item) => item.hasAttribute("inert")))).toBe(true);

  // every headline and every description is in the page as served, for search engines and readers without script
  const served = (await (await page.request.get("/")).text())
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
  for (const { capability, detail } of all) {
    expect(served, `the served page is missing ${JSON.stringify(capability)}`).toContain(capability);
    expect(served, `the served page is missing ${JSON.stringify(detail)}`).toContain(detail);
  }

  // with focus the arrow keys move the row, and focus holds its drift
  await row.focus();
  const before = await row.evaluate((element) => element.scrollLeft);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
});

test("the row's cards are one size, about three and a half across a wide screen and one and a fifth on a phone", async ({
  page,
}) => {
  for (const [width, low, high] of [
    [1440, 3.2, 3.9],
    [390, 1.1, 1.4],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const geometry = await page.evaluate(() => {
      const row = document.querySelector("[data-use-cases]") as HTMLElement;
      const cards = [...row.querySelectorAll<HTMLElement>(".uc-card:not([aria-hidden])")];
      const first = cards[0]!.getBoundingClientRect();
      const second = cards[1]!.getBoundingClientRect();
      const title = document.querySelector("#uses-title")!.getBoundingClientRect();
      const box = row.getBoundingClientRect();
      const room = cards.map((card) => {
        const figure = card.querySelector(".uc-figure")!.getBoundingClientRect();
        const art = card.querySelector(".uc-art")!.getBoundingClientRect();
        return Math.min(art.left - figure.left, figure.right - art.right, art.top - figure.top, figure.bottom - art.bottom);
      });
      return {
        sizes: new Set(cards.map((card) => `${card.offsetWidth}x${card.offsetHeight}`)).size,
        tops: new Set(cards.map((card) => card.offsetTop)).size,
        across: (box.right - first.left) / (second.left - first.left),
        startsWithTitle: Math.abs(first.left - title.left) < 2,
        fades: getComputedStyle(row).maskImage !== "none",
        room: Math.min(...room),
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    expect(geometry.sizes, `the cards are not one size at ${width}`).toBe(1);
    expect(geometry.tops, `the cards are not one row at ${width}`).toBe(1);
    expect(geometry.across, `cards across at ${width}`).toBeGreaterThanOrEqual(low);
    expect(geometry.across, `cards across at ${width}`).toBeLessThanOrEqual(high);
    expect(geometry.startsWithTitle, `the row does not start under its title at ${width}`).toBe(true);
    expect(geometry.fades, `the row does not fade at its edges at ${width}`).toBe(true);
    expect(geometry.room, `a picture is crowded on its panel at ${width}`).toBeGreaterThanOrEqual(16);
    expect(geometry.pageOverflow, `page overflows at ${width}`).toBe(false);
  }
});

test("the row drifts on its own and loops, holds when hovered, and stands still and snaps under reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const row = page.locator("[data-use-cases]");
  await row.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(row).toHaveAttribute("data-playing", "true");
  const start = await row.evaluate((element) => element.scrollLeft);
  await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(start + 4);

  // at the end of the first set it steps back by one set, so the loop never runs out
  const set = await row.evaluate((element) => {
    const clone = element.querySelector<HTMLElement>("[data-clone]")!;
    const set = clone.offsetLeft - (element.firstElementChild as HTMLElement).offsetLeft;
    element.scrollLeft = set - 1;
    return set;
  });
  await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeLessThan(set / 2);

  // hovering holds it where it is
  await row.hover();
  await expect(row).toHaveAttribute("data-playing", "false");
  const held = await row.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(400);
  expect(await row.evaluate((element) => element.scrollLeft)).toBe(held);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(row.locator('.uc-card[aria-hidden="true"]')).toHaveCount(0);
  await expect(row).toHaveAttribute("data-playing", "false");
  expect(await row.evaluate((element) => getComputedStyle(element).scrollSnapType)).toBe("x mandatory");
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

test("the vision stands on its own grounded panel, and the landing ends on a calm split call to action", async ({
  page,
}) => {
  await page.goto("/");
  const panel = page.locator(".lp-vision-inner");
  const ground = await panel.evaluate((element) => {
    const style = getComputedStyle(element);
    const line = getComputedStyle(element.querySelector(".lp-vision-art")!, "::after");
    return {
      surface: style.backgroundColor !== getComputedStyle(document.body).backgroundColor,
      border: style.borderTopWidth,
      line: line.borderTopWidth,
    };
  });
  expect(ground).toEqual({ surface: true, border: "1px", line: "1px" });
  await expect(panel.locator("#vision-line")).toHaveText(fixture.vision.line);

  // the close: its line at the section titles' size and two buttons of one height, beside a whole picture on a panel
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const close = await page.evaluate(() => {
      const band = document.querySelector("footer [data-footer-cta]")!;
      const rect = (element: Element) => element.getBoundingClientRect();
      const [primary, secondary] = [...band.querySelectorAll(".site-foot-actions .btn")].map(rect);
      const panel = band.querySelector(".site-foot-close-panel")!;
      const shown = [...panel.querySelectorAll<HTMLImageElement>(".art-img")].find(
        (image) => getComputedStyle(image).display !== "none",
      )!;
      return {
        lineSize: getComputedStyle(band.querySelector(".site-foot-line")!).fontSize,
        titleSize: getComputedStyle(document.querySelector("#install h2")!).fontSize,
        buttons: band.querySelectorAll(".site-foot-actions .btn").length,
        sameHeight: Math.abs(primary!.height - secondary!.height) < 1,
        sameRow: Math.abs(primary!.top - secondary!.top) < 1,
        stacked: primary!.top < secondary!.top - 1,
        panelGround: getComputedStyle(panel).backgroundColor !== getComputedStyle(document.body).backgroundColor,
        panelBorder: getComputedStyle(panel).borderTopWidth,
        whole: (() => {
          const box = rect(panel);
          const art = rect(shown);
          return art.left >= box.left && art.right <= box.right && art.top >= box.top && art.bottom <= box.bottom;
        })(),
        pictureFirst: rect(panel).bottom <= rect(band.querySelector(".site-foot-line")!).top + 1,
        beside: rect(panel).left >= rect(band.querySelector(".site-foot-line")!).right - 1,
        extras: band.querySelectorAll("[data-install-line], .site-foot-close-mark").length,
      };
    });
    expect(close.lineSize, `the closing line is not at the section titles' size at ${width}`).toBe(close.titleSize);
    expect(close.buttons).toBe(2);
    expect(close.sameHeight, `the closing buttons differ in height at ${width}`).toBe(true);
    if (width === 1440) {
      expect(close.sameRow, "the closing buttons do not share a row").toBe(true);
      expect(close.beside, "the picture is not beside the words").toBe(true);
    } else {
      expect(close.stacked, "the closing buttons do not stack on a phone").toBe(true);
      expect(close.pictureFirst, "the picture does not come first on a phone").toBe(true);
    }
    expect(close.panelGround && close.panelBorder === "1px", `the picture has no panel at ${width}`).toBe(true);
    expect(close.whole, `the closing picture is cropped at ${width}`).toBe(true);
    expect(close.extras, "the close repeats the install command or floats the mark").toBe(0);
  }

  // other pages keep the compact row, with no picture in it
  await page.goto("/about");
  await expect(page.locator("footer .site-foot-close-panel")).toHaveCount(0);
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
  // the scenes have no controls of their own: no replay, pause or resume
  await expect(page.locator("#how").getByRole("button", { name: /replay|pause|resume|play/ })).toHaveCount(0);
  // (the buttons drawn inside a scene are part of its picture, which nobody can tab into)
  await expect(page.locator("#how .hw-window button:not(.scn-screen *)")).toHaveCount(0);
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
  // one sign of the scroll: the current step's bar along its rule, and no other progress or cue
  // (the scan bar drawn inside the review scene is part of its picture)
  await expect(page.locator("#how :is([role=progressbar], .rail, .hw-cue):not(.scn-screen *)")).toHaveCount(0);
  const fills = page.locator(".hw-step-fill");
  await expect(fills).toHaveCount(fixture.how.steps.length);
  for (const [index, offset] of [0.2, 1.2, 2.2].entries()) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + 900 * offset);
    await expect(steps.nth(index)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".hw-window")).toBeInViewport();
    // the current step's bar shows how far into its third the scroll is, and only its bar shows
    const own = await fills.nth(index).evaluate((fill) => new DOMMatrix(getComputedStyle(fill).transform).a);
    expect(own).toBeGreaterThan(0);
    await expect
      .poll(() => fills.evaluateAll((all) => all.map((fill) => getComputedStyle(fill).opacity !== "0")))
      .toEqual(fixture.how.steps.map((_, at) => at === index));
  }
  // after the third step the section lets go and the next one arrives
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + 900 * 3.2);
  await expect(page.locator("#session")).toBeInViewport();
});

test("a scene plays only while it can be seen, and holds where it is under the reader's pointer or focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const top = await page.locator("#how").evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + 900 * 0.2);
  const view = page.locator(".hw-scroll .hw-view");
  const take = page.locator('.hw-layer[data-on="true"] .scn-view');
  await expect(take).toHaveAttribute("data-paused", "false");
  // the screen is one described image, and it takes focus so a keyboard can hold it
  await expect(view).toHaveAttribute("role", "img");
  await expect(view).toHaveAttribute("tabindex", "0");
  const pointer = page.locator('.hw-layer[data-on="true"] .scn-cursor');
  const where = () => pointer.evaluate((cursor) => cursor.style.transform + getComputedStyle(cursor).transform);

  await view.hover();
  await expect(take).toHaveAttribute("data-paused", "true");
  const held = await where();
  await page.waitForTimeout(900);
  expect(await where(), "the take moved while the pointer held it").toBe(held);
  await page.mouse.move(0, 0);
  await expect(take).toHaveAttribute("data-paused", "false");

  await view.focus();
  await expect(take).toHaveAttribute("data-paused", "true");
  await view.blur();
  await expect(take).toHaveAttribute("data-paused", "false");

  // scrolled away, it holds too
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator('.hw-layer[data-on="true"] .scn-view')).toHaveAttribute("data-paused", "true");
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

test("a sample session opens in the real transcript browser, in a wide window that keeps its height", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#session");
  const viewer = section.locator("[data-session-viewer]");
  await expect(viewer).toHaveAttribute("aria-label", fixture.session.label);
  // the session goes by its short title, with no crumb trail and no session id
  await expect(viewer.getByRole("heading", { name: fixture.session.title })).toBeVisible();
  await expect(section).not.toContainText(fixture.session.sessionId);
  await expect(section.locator(".txn-crumb a, .txn-crumb li")).toHaveCount(0);
  // no explainer beside it: the markers in the transcript say what was redacted
  await expect(section.locator(".lp-note")).toHaveCount(0);
  // behind it, Claude Code where the session was recorded, hidden from assistive technology;
  // over its corner, the pull request's check in village's own words
  await expect(section.locator(".lp-windows-term")).toHaveAttribute("aria-hidden", "true");
  await expect(section.locator(".lp-windows-term .mac-win-terminal")).toBeVisible();
  await expect(section.locator(".lp-check-name")).toHaveText(fixture.session.check.name);
  await expect(section.locator(".lp-check-summary")).toHaveText(fixture.session.check.summary);
  // the values peasant redacted show as their markers
  for (const marker of fixture.session.markers) {
    await expect(viewer, `the transcript does not show ${marker}`).toContainText(marker);
  }

  // the browser's own tabs, each of which works, and the window keeps its height whichever is shown
  const tabs = viewer.getByRole("tab");
  expect((await tabs.allInnerTexts()).map((text) => text.split("\n")[0])).toEqual(fixture.session.tabs);
  const browser = section.locator(".mac-win-browser");
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
