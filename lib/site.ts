/**
 * single source of truth for site-wide metadata — consumed by the root
 * layout (head tags) and the generated og / twitter images, so the
 * shared link card and the embedded text never drift apart.
 */
export const site = {
  name: "peasant",
  url: "https://peasantlabs.org",
  title: "peasant: data commons built by commoners",
  description: "Record, publish, and share agent sessions with people you trust.",
  /* the short line used on social cards */
  tagline: "Record, publish, and share agent sessions with people you trust.",
} as const;

/** where the hosted app signs people in; signed-out visitors of its home are sent here. */
export const LOGIN_URL = "https://village.peasantlabs.org/login";

export const GITHUB_URL = "https://github.com/peasant-labs";

/** the header's destinations, in the order they are read. */
export const SITE_NAV = [
  { id: "docs", label: "docs", href: "/docs" },
  { id: "blog", label: "blog", href: "/blog" },
] as const;

/** the phone menu: every destination, in the order a reader looks for them. */
export const MENU_NAV = [
  { id: "docs", label: "docs", href: "/docs" },
  { id: "blog", label: "blog", href: "/blog" },
  { id: "projects", label: "projects", href: "/projects" },
  { id: "about", label: "about", href: "/about" },
  { id: "contact", label: "contact", href: "/contact" },
] as const;

/** the footer's destinations. contact is last: it is the one link a reader goes looking for. */
export const FOOTER_NAV = [
  { id: "docs", label: "docs", href: "/docs" },
  { id: "blog", label: "blog", href: "/blog" },
  { id: "projects", label: "projects", href: "/projects" },
  { id: "github", label: "github", href: GITHUB_URL },
  { id: "contact", label: "contact", href: "/contact" },
] as const;

export type SiteNavSection = (typeof SITE_NAV)[number];
