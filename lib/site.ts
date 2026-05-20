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
