import { expect, test } from "@playwright/test";

/*
 * An unknown address answers 404 with the site's own page: the header and
 * footer, a heading, and a way home, on the theme's ground rather than the
 * pure black or white of Next's default page.
 */
for (const colorScheme of ["dark", "light"] as const) {
  test(`an unknown address keeps the site frame in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    const response = await page.goto("/this-address-does-not-exist");
    expect(response?.status()).toBe(404);

    await expect(page).toHaveTitle("page not found | peasant");
    await expect(page.locator("h1")).toHaveText("page not found");
    await expect(page.locator(".site-shell header").first()).toBeVisible();
    await expect(page.locator(".site-foot")).toBeVisible();
    await expect(page.getByRole("link", { name: "back to home", exact: true })).toHaveAttribute("href", "/");

    const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(ground).not.toBe("rgb(0, 0, 0)");
    expect(ground).not.toBe("rgb(255, 255, 255)");
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(colorScheme);
  });
}
