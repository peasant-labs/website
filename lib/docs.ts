/**
 * The docs sidebar: every destination it lists exists on this site. Sections of
 * the overview are anchors on /docs; guides are pages of their own.
 */
export type DocsIcon =
  | "overview"
  | "install"
  | "kickstart"
  | "publish"
  | "evals"
  | "reviews"
  | "cli"
  | "agents"
  | "redaction"
  | "access"
  | "blog";

export type DocsNavItem = Readonly<{
  id: string;
  label: string;
  href: string;
  icon: DocsIcon;
}>;

export type DocsNavGroup = Readonly<{
  id: string;
  label: string | null;
  items: readonly DocsNavItem[];
}>;

export const DOCS_NAV: readonly DocsNavGroup[] = [
  {
    id: "start",
    label: "get started",
    items: [
      { id: "overview", label: "overview", href: "/docs", icon: "overview" },
      { id: "install", label: "install", href: "/docs#install", icon: "install" },
      { id: "kickstart", label: "set up", href: "/docs#kickstart", icon: "kickstart" },
      { id: "publish", label: "publish", href: "/docs#publish", icon: "publish" },
    ],
  },
  {
    id: "guides",
    label: "guides",
    items: [
      { id: "evals", label: "agent evals", href: "/docs/guides/evals", icon: "evals" },
      { id: "reviews", label: "pr reviews", href: "/docs/guides/reviews", icon: "reviews" },
    ],
  },
  {
    id: "reference",
    label: "reference",
    items: [
      { id: "cli", label: "cli", href: "/docs#cli", icon: "cli" },
      { id: "agents", label: "agents", href: "/docs#agents", icon: "agents" },
      { id: "redaction", label: "redaction", href: "/docs#redaction", icon: "redaction" },
      { id: "access", label: "collectives", href: "/docs#access", icon: "access" },
    ],
  },
  {
    id: "more",
    label: null,
    items: [{ id: "blog", label: "blog", href: "/blog", icon: "blog" }],
  },
];

/** The page a pathname belongs to. Anchors never claim "current": they are parts of the overview. */
export function currentDocsItem(pathname: string): string | null {
  if (pathname === "/docs") return "overview";
  if (pathname.startsWith("/docs/guides/evals")) return "evals";
  if (pathname.startsWith("/docs/guides/reviews")) return "reviews";
  if (pathname === "/blog" || pathname.startsWith("/blog/")) return "blog";
  return null;
}
