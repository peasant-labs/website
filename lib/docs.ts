/**
 * The docs sidebar: the docs' own pages. Sections of the overview are not
 * listed here: they are the overview's "on this page" list, and search finds
 * them.
 */
export type DocsIcon = "overview" | "evals" | "reviews" | "blog";

export type DocsNavItem = Readonly<{
  id: string;
  label: string;
  href: string;
  icon: DocsIcon;
}>;

export type DocsNavGroup = Readonly<{
  id: string;
  label: string | null;
  /* the nav landmark's name when the group shows no label */
  ariaLabel: string;
  items: readonly DocsNavItem[];
}>;

export const DOCS_NAV: readonly DocsNavGroup[] = [
  {
    id: "start",
    label: null,
    ariaLabel: "docs pages",
    items: [{ id: "overview", label: "overview", href: "/docs", icon: "overview" }],
  },
  {
    id: "guides",
    label: "guides",
    ariaLabel: "guides",
    items: [
      { id: "evals", label: "agent evals", href: "/docs/guides/evals", icon: "evals" },
      { id: "reviews", label: "pr reviews", href: "/docs/guides/reviews", icon: "reviews" },
      { id: "classroom", label: "classroom", href: "/docs/guides/classroom", icon: "overview" },
      { id: "onboarding", label: "onboarding", href: "/docs/guides/onboarding", icon: "overview" },
      { id: "find-sessions", label: "past sessions", href: "/docs/guides/find-sessions", icon: "overview" },
    ],
  },
  {
    id: "more",
    label: null,
    ariaLabel: "more",
    items: [{ id: "blog", label: "blog", href: "/blog", icon: "blog" }],
  },
];

/** The page a pathname belongs to. */
export function currentDocsItem(pathname: string): string | null {
  if (pathname === "/docs") return "overview";
  const guide = DOCS_NAV.find((group) => group.id === "guides")?.items.find((item) => pathname === item.href);
  if (guide) return guide.id;
  if (pathname === "/blog" || pathname.startsWith("/blog/")) return "blog";
  return null;
}
