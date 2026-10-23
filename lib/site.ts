/**
 * single source of truth for site-wide metadata — consumed by the root
 * layout (head tags) and the generated og / twitter images, so the
 * shared link card and the embedded text never drift apart.
 */
export const site = {
  name: "peasant",
  url: "https://peasantlabs.org",
  title: "peasant: the open-source commons for agent transcripts",
  description: "Record, publish, and share agent sessions with people you trust.",
  /* the short line used on social cards */
  tagline: "Record, publish, and share agent sessions with people you trust.",
} as const;

/** the hosted app; signed-out visitors of any of its pages are sent to this site's log-in dialog. */
export const ONLINE_URL = "https://village.peasantlabs.org";

/** the online app's privacy notice, readable signed out. */
export const PRIVACY_URL = `${ONLINE_URL}/privacy`;

/**
 * where "log in" points: the landing page with its log-in dialog open. On a
 * page that wears the header the dialog opens in place; from the docs and the
 * blog, or with script off, the link goes to the landing page.
 */
export const LOGIN_URL = "/?login";

/* one "/" then not another, no backslash, no control character: a path on the online app, never another host */
function isSameSitePath(path: string) {
  const control = [...path].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f);
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") && !control;
}

/**
 * The online app's GitHub sign-in start. `next` is where the online app returns
 * the person after signing in; it is kept only when it is a path on that app.
 */
export function githubSignInUrl(next?: string | null) {
  const start = `${ONLINE_URL}/auth/start?provider=github`;
  return next && isSameSitePath(next) ? `${start}&next=${encodeURIComponent(next)}` : start;
}

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

/**
 * The call to action every page ends with, at the top of the footer. Install
 * points at the landing's install section: in place on the landing, across from
 * any other page.
 */
export const FOOTER_CTA = {
  line: "try peasant on your own agent sessions",
  primary: { label: "install now", href: "/#install", landingHref: "#install" },
  secondary: { label: "read our docs", href: "/docs" },
} as const;

export type SiteNavSection = (typeof SITE_NAV)[number];
