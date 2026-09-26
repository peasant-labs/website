/**
 * The fairtrade colour tokens the schema explorer's json theme is allowed to
 * name. A named closed set, so a syntax scope can only carry a design-system
 * token and never a raw css colour, and a typo cannot reach the theme.
 */
export const DS_COLOR = {
  ink: "var(--ink)",
  ink2: "var(--ink-2)",
  ink3: "var(--ink-3)",
  inkStrong: "var(--ink-strong)",
  olive: "var(--olive)",
  clay: "var(--clay)",
  teal: "var(--teal)",
  amber: "var(--amber)",
} as const;

export type DsColor = (typeof DS_COLOR)[keyof typeof DS_COLOR];

const DS_COLOR_VALUES: readonly string[] = Object.values(DS_COLOR);

/** Narrow a raw colour string to a design-system token at the boundary. */
export function isDsColor(value: unknown): value is DsColor {
  return typeof value === "string" && DS_COLOR_VALUES.includes(value);
}
