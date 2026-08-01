/**
 * single source of truth for site-wide metadata — consumed by the root
 * layout (head tags) and the generated og / twitter images, so the
 * shared link card and the embedded text never drift apart.
 */
export const site = {
  name: "peasant",
  url: "https://peasantlabs.org",
  title: "Reclaiming Data Autonomy as a Peasant",
  description:
    "an upcoming editorial on the quiet enclosure of the transcript commons, and why the harvest belongs to the hands that sowed it.",
  /* the short, punchy line used on social cards */
  tagline: "forthcoming — on the quiet enclosure of the transcript commons.",
} as const;

/**
 * the header's destinations, in the order they are read. `contact` is last
 * because the header pushes the final entry to the right edge — it is the one
 * link a reader goes looking for rather than browses into.
 */
export const SITE_NAV = [
  { id: "home", label: "home", href: "/" },
  { id: "blog", label: "blog", href: "/blog" },
  { id: "about", label: "about", href: "/about" },
  { id: "contact", label: "contact", href: "/contact" },
] as const;

export type SiteNavSection = (typeof SITE_NAV)[number];
