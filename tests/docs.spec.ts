import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { PHONE } from "./landing-fixture";

type AnchorsFixture = { version: 1; pages: Array<{ path: string; ids: string[] }> };
type SearchFixture = {
  version: 1;
  cases: Array<{ query: string; href: string }>;
  openers: Array<{ key: string }>;
};

type FrameFixture = { version: 1; reference: string; pages: string[]; widths: number[] };

const anchors = parse(readFileSync(resolve("testdata/docs/anchors.yaml"), "utf8")) as AnchorsFixture;
const frame = parse(readFileSync(resolve("testdata/docs/frame.yaml"), "utf8")) as FrameFixture;
const search = parse(readFileSync(resolve("testdata/docs/search.yaml"), "utf8")) as SearchFixture;
const landing = parse(readFileSync(resolve("testdata/landing/landing.yaml"), "utf8")) as {
  posts: Array<{ slug: string }>;
  docsShortcuts: string[];
};

test("every docs address the apps link to still lands on its section", async ({ page }) => {
  for (const { path, ids } of anchors.pages) {
    await page.goto(path);
    for (const id of ids) {
      await expect(page.locator(`[id="${id}"]`), `${path}#${id} is gone`).toHaveCount(1);
    }
  }
});

test("the search index holds every docs page, every linked section and every post", async ({ request }) => {
  const response = await request.get("/docs/search-index.json");
  expect(response.status()).toBe(200);
  const index = (await response.json()) as { docs: Array<{ href: string; text: string }> };
  const hrefs = new Set(index.docs.map((doc) => doc.href));
  for (const { path, ids } of anchors.pages) {
    expect(hrefs.has(path), `${path} is not indexed`).toBe(true);
    for (const id of ids) expect(hrefs.has(`${path}#${id}`), `${path}#${id} is not indexed`).toBe(true);
  }
  for (const post of landing.posts) expect(hrefs.has(`/blog/${post.slug}`), `${post.slug} is not indexed`).toBe(true);
  for (const doc of index.docs) expect(doc.text.length, `${doc.href} is indexed empty`).toBeGreaterThan(0);
});

/* where a page puts its title, its content column and its first line of running text */
async function frameOf(page: Page, path: string) {
  await page.goto(path);
  return page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const { left, width } = element.getBoundingClientRect();
      return { left: Math.round(left), width: Math.round(width) };
    };
    return { title: box("#page-heading")?.left, column: box("main .dx-article"), prose: box("main .dx-prose > p") };
  });
}

for (const width of frame.widths) {
  test(`at ${width} the blog sits in the docs' frame, on the same left edge and measure`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const reference = await frameOf(page, frame.reference);
    expect(reference.column, "the docs page has no content column").not.toBeNull();
    expect(reference.prose, "the docs page has no running text").not.toBeNull();
    const posts = landing.posts.map((post) => `/blog/${post.slug}`);
    for (const path of [...frame.pages, ...posts]) {
      const blog = await frameOf(page, path);
      expect(blog.title, `${path}: the title moved`).toBe(reference.title);
      expect(blog.column, `${path}: the content column moved`).toEqual(reference.column);
      if (blog.prose) expect(blog.prose, `${path}: the running text moved`).toEqual(reference.prose);
      else expect(posts, `${path} is a post with no running text`).not.toContain(path);
    }
  });
}

test("a blog post's \"on this page\" lists exactly its headings", async ({ page }) => {
  for (const post of landing.posts) {
    await page.goto(`/blog/${post.slug}`);
    const headings = await page.locator("main article :is(h2, h3)[id]").evaluateAll((items) => items.map((item) => `#${item.id}`));
    const listed = await page.locator("main .dx-aside .dx-toc a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(listed, `${post.slug}: "on this page" and the headings differ`).toEqual(headings);
  }
});

test("on a phone no docs command wraps at a hyphen inside a word", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  for (const { path } of anchors.pages) {
    await page.goto(path);
    const commands = page.locator(".dx-cmd .cli-cmd-line code");
    await expect(commands.first()).toHaveAttribute("data-breaks", "marked");
    for (const lines of await commands.evaluateAll((codes) =>
      codes.map((code) => {
        const range = document.createRange();
        const rows = new Map<number, string>();
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const text = walker.currentNode as Text;
          for (let index = 0; index < text.length; index += 1) {
            range.setStart(text, index);
            range.setEnd(text, index + 1);
            const top = Math.round(range.getBoundingClientRect().top);
            rows.set(top, (rows.get(top) ?? "") + text.data[index]);
          }
        }
        return [...rows.values()].map((row) => row.trim());
      }),
    )) {
      for (const line of lines.slice(0, -1)) {
        expect(line, `${path}: "${lines.join(" / ")}" wraps inside a word`).not.toMatch(/-$/);
      }
    }
  }
  await context.close();
});

test("every shortcut opens search with the field focused, and esc gives focus back", async ({ page }) => {
  await page.goto("/docs/guides/evals");
  for (const { key } of search.openers) {
    await page.locator("main h1").click();
    await page.keyboard.press(key);
    const field = page.getByRole("combobox", { name: "search the docs and blog" });
    await expect(field, `${key} did not open search`).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(field).toHaveCount(0);
  }
  const trigger = page.getByRole("complementary", { name: "docs" }).getByRole("button", { name: /search/ });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "search the docs and blog" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("a search for a section lands on that section", async ({ page }) => {
  for (const { query, href } of search.cases) {
    await page.goto("/docs");
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").fill(query);
    const first = page.getByRole("option").first();
    await expect(first, `"${query}" has no result`).toBeVisible();
    await expect(first).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL((url) => `${url.pathname}${url.hash}` === href);
    const [, id] = href.split("#");
    if (id) await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
  }
});

test("a search with no match names the query", async ({ page }) => {
  await page.goto("/docs");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("zzqqzz");
  await expect(page.locator(".cp-empty")).toContainText("zzqqzz");
  const accessibility = await new AxeBuilder({ page }).include(".dx-search").analyze();
  expect(accessibility.violations).toEqual([]);
});

test("on a phone search opens from the drawer as a full-screen sheet", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/docs");
  await page.getByRole("button", { name: "open the menu" }).tap();
  await page.getByRole("button", { name: /search/ }).tap();
  const panel = page.getByRole("dialog", { name: "search the docs and blog" });
  await expect(panel).toBeVisible();
  // full width once the opening motion settles
  const viewport = page.viewportSize()!;
  await expect.poll(async () => (await panel.boundingBox())?.width).toBe(viewport.width);
  await page.getByRole("combobox").fill("prune");
  await expect(page.getByRole("option").first()).toContainText("remove recorded sessions");
  const accessibility = await new AxeBuilder({ page }).include(".dx-search").analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("button", { name: "close" }).tap();
  await expect(panel).toHaveCount(0);
  await context.close();
});

test("on a phone, closing search gives focus to a control the reader can see", async ({ browser }) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await page.goto("/docs");
  const menu = page.getByRole("button", { name: "open the menu" });
  for (const close of ["Escape", "close"] as const) {
    await menu.tap();
    await page.getByRole("button", { name: /search/ }).tap();
    await expect(page.getByRole("dialog", { name: "search the docs and blog" })).toBeVisible();
    if (close === "Escape") await page.keyboard.press("Escape");
    else await page.getByRole("button", { name: "close" }).tap();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(menu, `after ${close}`).toBeFocused();
    await expect(menu).toBeVisible();
  }
  await context.close();
});

test("the docs sidebar leads with search and the switcher, which offers no other app", async ({ page }) => {
  await page.goto("/docs");
  const sidebar = page.getByRole("complementary", { name: "docs" });
  const groups = sidebar.locator(".asb-scroll nav");
  await expect(groups.first()).toHaveAttribute("aria-label", "shortcuts");
  const labels = await groups.first().locator(".asb-label").allTextContents();
  expect(labels.map((label) => label.trim())).toEqual(landing.docsShortcuts);
  await expect(sidebar.locator('a[href*="village.peasantlabs.org"]:not(.asb-account), a[href*="localhost:8690"]')).toHaveCount(0);
});
