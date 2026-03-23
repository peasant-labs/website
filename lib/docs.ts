import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { docsNav, type NavItem, type NavSection } from "@/content/_nav";

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

/**
 * Recursively walk `content/docs/` and return all valid slug arrays.
 * A slug is derived from the file path relative to DOCS_DIR,
 * e.g. `content/docs/core-concepts/architecture.mdx` -> ["core-concepts", "architecture"]
 * The root index file `content/docs/index.mdx` -> []
 */
export function getAllDocSlugs(): string[][] {
  const slugs: string[][] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
        const relativePath = path.relative(DOCS_DIR, fullPath);
        const withoutExt = relativePath.replace(/\.mdx?$/, "");

        if (withoutExt === "index") {
          slugs.push([]);
        } else if (withoutExt.endsWith("/index")) {
          const parts = withoutExt
            .replace(/\/index$/, "")
            .split(path.sep);
          slugs.push(parts);
        } else {
          slugs.push(withoutExt.split(path.sep));
        }
      }
    }
  }

  walk(DOCS_DIR);
  return slugs;
}

export interface DocFrontmatter {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DocData {
  filepath: string;
  frontmatter: DocFrontmatter;
  slug: string[];
}

/**
 * Resolve a slug array to its file path and frontmatter.
 * Tries both `<slug>.mdx` and `<slug>/index.mdx` patterns.
 */
export function getDocBySlug(slug: string[]): DocData | null {
  const candidates: string[] = [];

  if (slug.length === 0) {
    candidates.push(path.join(DOCS_DIR, "index.mdx"));
    candidates.push(path.join(DOCS_DIR, "index.md"));
  } else {
    const joined = slug.join(path.sep);
    candidates.push(path.join(DOCS_DIR, `${joined}.mdx`));
    candidates.push(path.join(DOCS_DIR, `${joined}.md`));
    candidates.push(path.join(DOCS_DIR, joined, "index.mdx"));
    candidates.push(path.join(DOCS_DIR, joined, "index.md"));
  }

  for (const filepath of candidates) {
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, "utf-8");
      const { data } = matter(raw);
      return {
        filepath,
        frontmatter: data as DocFrontmatter,
        slug,
      };
    }
  }

  return null;
}

export interface NavItemWithActive extends NavItem {
  active: boolean;
  href: string;
}

export interface NavSectionWithActive extends NavSection {
  items: NavItemWithActive[];
  hasActive: boolean;
}

/**
 * Returns the nav manifest enriched with `active` state
 * and computed `href` for each item.
 */
export function getNavigation(
  currentSlug: string[] = []
): NavSectionWithActive[] {
  const currentPath = currentSlug.join("/");

  return docsNav.map((section) => {
    const items = section.items.map((item) => {
      const itemPath = item.slug.join("/");
      const href =
        item.slug.length === 0 ? "/docs" : `/docs/${item.slug.join("/")}`;
      return {
        ...item,
        active: currentPath === itemPath,
        href,
      };
    });

    return {
      ...section,
      items,
      hasActive: items.some((item) => item.active),
    };
  });
}

export interface PrevNext {
  prev: NavItemWithActive | null;
  next: NavItemWithActive | null;
}

/**
 * Flatten the nav manifest and return the previous/next items
 * relative to the current slug.
 */
export function getPrevNext(currentSlug: string[]): PrevNext {
  const flat: NavItemWithActive[] = docsNav.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      active: false,
      href:
        item.slug.length === 0 ? "/docs" : `/docs/${item.slug.join("/")}`,
    }))
  );

  const currentPath = currentSlug.join("/");
  const index = flat.findIndex((item) => item.slug.join("/") === currentPath);

  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : null,
  };
}
