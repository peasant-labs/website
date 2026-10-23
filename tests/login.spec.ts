import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { PHONE } from "./landing-fixture";
import { loadLoginFixture } from "./login-fixture";

const fixture = loadLoginFixture();

const dialogOf = (page: Page) => page.getByRole("dialog", { name: fixture.dialog.title });

/* the online app is never reached: its sign-in start is answered here */
async function answerOnline(context: BrowserContext) {
  await context.route(`${fixture.online}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>sign-in start</title>" }),
  );
}

test.beforeEach(async ({ context }) => {
  await answerOnline(context);
});

for (const colorScheme of ["dark", "light"] as const) {
  test(`?login opens the log-in dialog over the landing page (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/?login");
    await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
    const dialog = dialogOf(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog.getByRole("button", { name: fixture.dialog.github })).toBeVisible();
    // the title, the github button and the privacy notice: no terminal command, no footer band
    await expect(dialog).not.toContainText("peasant village login");
    await expect(dialog.locator(".dlg-foot")).toHaveCount(0);
    await expect(dialog.getByRole("link", { name: fixture.dialog.privacy.label })).toHaveAttribute(
      "href",
      fixture.dialog.privacy.href,
    );
    await expect(page.locator("h1")).toBeAttached();

    const accessibility = await new AxeBuilder({ page }).include(".dlg-overlay").analyze();
    expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);
  });
}

for (const entry of fixture.next) {
  test(`the github button: ${entry.name}`, async ({ page }) => {
    await page.goto(entry.address);
    const started = page.waitForRequest((request) => request.url().startsWith(fixture.online));
    await dialogOf(page).getByRole("button", { name: fixture.dialog.github }).click();
    expect((await started).url()).toBe(entry.start);
  });
}

test("Escape closes it and takes the flag out of the address, so a reload does not reopen it", async ({ page }) => {
  await page.goto("/?login&next=%2Fcollectives%2Fabc");
  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(new URL(page.url()).search).toBe("");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.reload();
  await expect(page.locator("h1")).toBeVisible();
  await expect(dialog).toBeHidden();
});

test("Tab and Shift+Tab stay inside the dialog", async ({ page }) => {
  await page.goto("/?login");
  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  const inside = () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  await expect.poll(inside).toBe(true);
  const stops = await dialog.locator("a[href], button:not([disabled])").count();
  for (let index = 0; index < stops * 2 + 1; index += 1) {
    await page.keyboard.press("Tab");
    expect(await inside(), `tab ${index + 1} left the dialog`).toBe(true);
  }
  for (let index = 0; index < stops * 2 + 1; index += 1) {
    await page.keyboard.press("Shift+Tab");
    expect(await inside(), `shift+tab ${index + 1} left the dialog`).toBe(true);
  }
});

test("on a wide screen the header's log in opens it in place and the scrim closes it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const login = page.locator(".site-bar").getByRole("link", { name: "log in" });
  await login.click();
  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe("/");

  // a click on the scrim, outside the dialog, closes it and hands focus back to the link
  await page.mouse.click(24, 880);
  await expect(dialog).toBeHidden();
  await expect(login).toBeFocused();
});

test("on a phone the menu's log in closes the menu and opens it, inside the screen", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  await answerOnline(context);
  const page = await context.newPage();
  await page.goto("/");
  const menuButton = page.locator(".site-bar").getByRole("button", { name: "open the menu" });
  await menuButton.tap();
  await page.locator("#site-sheet").getByRole("link", { name: "log in" }).tap();

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  // measured once the dialog has finished arriving
  await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  const github = await dialog.getByRole("button", { name: fixture.dialog.github }).boundingBox();
  expect(github!.x + github!.width).toBeLessThanOrEqual(box!.x + box!.width);
  expect(github!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(menuButton).toBeFocused();
  await context.close();
});

test("any other link to the log-in address on the page opens it in place", async ({ page }) => {
  await page.goto("/");
  const href = await page.locator(".site-bar").getByRole("link", { name: "log in" }).getAttribute("href");
  // a call to action elsewhere on the page, pointing where the header's link points
  await page.evaluate((target) => {
    const link = Object.assign(document.createElement("a"), { href: target, textContent: "sign up here" });
    document.querySelector("main")?.prepend(link);
  }, href!);
  await page.getByRole("link", { name: "sign up here" }).click();
  await expect(dialogOf(page)).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
});

/* the header's way in, for a reader the online app's hint names or does not */
for (const entry of fixture.header) {
  for (const width of [1440, 390] as const) {
    test(`the header: ${entry.name} (${width})`, async ({ browser, baseURL }) => {
      const context = await browser.newContext(width === 390 ? PHONE : { viewport: { width, height: 900 } });
      await answerOnline(context);
      if (entry.hint !== null) {
        await context.addCookies([{ name: fixture.signedIn.cookie, value: entry.hint, url: baseURL! }]);
      }
      const page = await context.newPage();
      await page.goto(entry.address);
      const signedIn = entry.shows === fixture.signedIn.label;
      await expect(page.locator("html")).toHaveAttribute("data-online", signedIn ? "in" : "out");

      // the docs carry their own sidebar; every other page the header (its menu sheet on a phone)
      const docs = entry.address.startsWith("/docs");
      let scope = docs ? page.locator(".asb") : page.locator(".site-bar");
      if (!docs && width === 390) {
        if (await dialogOf(page).isVisible()) await page.keyboard.press("Escape");
        await page.locator(".site-bar").getByRole("button", { name: "open the menu" }).tap();
        scope = page.locator("#site-sheet");
      }
      if (docs && width === 390) {
        await page.locator(".asb-bar").getByRole("button", { name: "open the menu" }).tap();
      }
      const online = scope.locator(".site-online").filter({ visible: true });
      const login = scope.getByRole("link", { name: "log in" });
      if (signedIn) {
        await expect(online).toHaveCount(1);
        await expect(online).toHaveAttribute("href", fixture.signedIn.href);
        // the docs sidebar's row opens online in a new tab, as its other apps do
        await expect(online).toHaveAccessibleName(
          `${fixture.signedIn.label}, signed in as @${entry.hint}${docs ? ", opens in a new tab" : ""}`,
        );
        if (docs) {
          await expect(online).toHaveAttribute("target", "_blank");
          await expect(online.locator(".site-online-handle")).toHaveText(`@${entry.hint}`);
          if (width === 1440) {
            // collapsed to the rail, the row is the initial alone, its words a tooltip
            await page.getByRole("button", { name: "collapse the sidebar" }).click();
            await expect(online.locator(".site-online-av")).toBeVisible();
            await expect
              .poll(() => online.locator(".site-online-text").evaluate((el) => el.getBoundingClientRect().width))
              .toBeLessThanOrEqual(1);
            await expect(online).toHaveAttribute("title", `${fixture.signedIn.label}, signed in as @${entry.hint}`);
          }
        }
        await expect(login).toBeHidden();
      } else {
        await expect(online).toHaveCount(0);
        await expect(login).toBeVisible();
      }
      const hint = (await context.cookies()).find((cookie) => cookie.name === fixture.signedIn.cookie);
      expect(hint?.value ?? null).toBe(entry.hintAfter);
      await context.close();
    });
  }
}
