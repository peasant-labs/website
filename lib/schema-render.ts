import { codeToTokens, type ThemeRegistrationRaw } from "shiki";
import { DS_COLOR, isDsColor, type DsColor } from "@/lib/design-tokens";
import { buildJsonLines, groupLines } from "@/lib/json-lines";
import type { FieldGroup, HarnessSample } from "@/lib/metadata-explorer";
import { parseSelector } from "@/lib/schema-selector";

/**
 * Server-only: turn each schema-explorer document into highlighted, line-addressable
 * json with shiki, the code highlighter the site already depends on.
 *
 * The theme is written in fairtrade design tokens, not borrowed colours: every
 * foreground is a `var(--...)` reference, so the window re-themes with the rest
 * of the site and no second tokenization is needed. The client receives
 * structured tokens and renders them through React; no html string is ever
 * injected.
 */

export type ShikiToken = {
  content: string;
  color?: DsColor;
};

export type RenderedLine = {
  groups: string[];
  tokens: ShikiToken[];
};

export type RenderedView = {
  text: string;
  lines: RenderedLine[];
  groupFirstLine: Record<string, number>;
};

export type RenderedSamples = Record<
  string,
  { native: RenderedView; unified: RenderedView }
>;

/**
 * The textmate scopes the json grammar emits for the parts a reader distinguishes.
 * Named here rather than spelled inline, so the theme below reads as a table.
 */
const JSON_SCOPE = {
  propertyName: "support.type.property-name",
  string: "string",
  numeric: "constant.numeric",
  language: "constant.language",
  punctuation: "punctuation",
} as const;

/**
 * A shiki theme whose colours are fairtrade tokens. `type` only sets shiki's
 * default foreground for whitespace, which is never seen; every visible scope is
 * named here.
 */
const SYNTAX_THEME: ThemeRegistrationRaw = {
  name: "fairtrade-syntax",
  type: "dark",
  colors: {},
  settings: [
    { scope: [JSON_SCOPE.propertyName], settings: { foreground: DS_COLOR.ink2 } },
    { scope: [JSON_SCOPE.string], settings: { foreground: DS_COLOR.olive } },
    { scope: [JSON_SCOPE.numeric], settings: { foreground: DS_COLOR.clay } },
    { scope: [JSON_SCOPE.language], settings: { foreground: DS_COLOR.teal } },
    { scope: [JSON_SCOPE.punctuation], settings: { foreground: DS_COLOR.ink3 } },
  ],
};

function toShikiTokens(tokens: { content: string; color?: string }[] | undefined): ShikiToken[] {
  if (!tokens) {
    return [];
  }
  return tokens.map((token) => ({
    content: token.content,
    color: isDsColor(token.color) ? token.color : undefined,
  }));
}

async function renderDocument(
  document: unknown,
  groups: FieldGroup[],
): Promise<RenderedView> {
  const { text, lines, nodeLines } = buildJsonLines(document);
  const perGroup = groupLines(document, groups, nodeLines);

  // A line can belong to a shallow group and a nested one (a tool call is inside
  // a turn; a content block is inside a message). Order each line's groups most
  // specific first, so hovering a line activates the tightest group that covers
  // it.
  const depthOf = (group: FieldGroup) =>
    Math.max(...group.selectors.map((selector) => parseSelector(selector).length));
  const ordered = [...groups].sort((a, b) => depthOf(b) - depthOf(a));

  const lineGroups: string[][] = lines.map(() => []);
  for (const group of ordered) {
    const entry = perGroup.get(group.id);
    if (!entry) {
      continue;
    }
    for (const index of entry.indexes) {
      lineGroups[index]?.push(group.id);
    }
  }

  const highlighted = await codeToTokens(text, { lang: "json", theme: SYNTAX_THEME });

  const rendered: RenderedLine[] = lines.map((_, index) => ({
    groups: lineGroups[index] ?? [],
    tokens: toShikiTokens(highlighted.tokens[index]),
  }));

  const groupFirstLine: Record<string, number> = {};
  for (const [id, entry] of perGroup) {
    groupFirstLine[id] = entry.first;
  }

  return { text, lines: rendered, groupFirstLine };
}

export async function renderHarnessSamples(
  samples: HarnessSample[],
): Promise<RenderedSamples> {
  const rendered: RenderedSamples = {};
  for (const sample of samples) {
    rendered[sample.id] = {
      native: await renderDocument(sample.native.document, sample.native.groups),
      unified: await renderDocument(sample.unified.document, sample.unified.groups),
    };
  }
  return rendered;
}
