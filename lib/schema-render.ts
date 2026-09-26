import { codeToTokens } from "shiki";
import type { ThemedToken } from "shiki";
import { buildJsonLines, groupLines } from "@/lib/json-lines";
import type { FieldGroup, HarnessSample } from "@/lib/metadata-explorer";
import { parseSelector } from "@/lib/schema-selector";

/**
 * Server-only: turn each schema-explorer document into highlighted, line-addressable
 * json with shiki, the code highlighter the site already depends on. The client
 * receives structured tokens and renders them through React; no html string is
 * ever injected. Both themes are tokenized once so the window can follow the
 * site theme without shipping shiki to the browser.
 */

export type ShikiToken = {
  content: string;
  color?: string;
  fontStyle?: number;
};

export type RenderedLine = {
  groups: string[];
  dark: ShikiToken[];
  light: ShikiToken[];
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

const THEME_DARK = "github-dark";
const THEME_LIGHT = "github-light";

function toShikiTokens(tokens: ThemedToken[] | undefined): ShikiToken[] {
  if (!tokens) {
    return [];
  }
  return tokens.map((token) => ({
    content: token.content,
    color: token.color,
    fontStyle: token.fontStyle,
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

  const dark = await codeToTokens(text, { lang: "json", theme: THEME_DARK });
  const light = await codeToTokens(text, { lang: "json", theme: THEME_LIGHT });

  const rendered: RenderedLine[] = lines.map((_, index) => ({
    groups: lineGroups[index] ?? [],
    dark: toShikiTokens(dark.tokens[index]),
    light: toShikiTokens(light.tokens[index]),
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
