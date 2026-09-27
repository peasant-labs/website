import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  collectNodePaths,
  matchSelector,
  parseSelector,
} from "./schema-selector";

export {
  collectNodePaths,
  matchSelector,
  nodeInGroup,
  parseSelector,
} from "./schema-selector";

/**
 * The schema explorer on /projects: for one invented mock session it shows the
 * raw native document each harness writes, line by line, beside the unified wire
 * session peasant lowers it into. Every rendered field group is linked to a
 * labelled region of the document.
 *
 * Both views render the same categories — the unified session's field groups.
 * The native view maps each category to the native fields that feed it, the
 * unified view to the lowered fields, so the reader follows one schema and sees
 * where each harness's shape lands in it.
 *
 * This module is the only reader of `testdata/metadata/*.json`. Its runtime
 * imports are `node:fs`, `node:path`, and the pure selector parser, so the
 * Playwright spec can import the loader and the validator directly without
 * pulling the design system or the React runtime into the test process.
 */

export const HARNESS_IDS = [
  "claude-code",
  "codex",
  "cursor",
  "strike",
  "opencode",
  "pi",
] as const;
export type HarnessId = (typeof HARNESS_IDS)[number];

export const ACCENTS = [
  "olive",
  "teal",
  "clay",
  "group-y",
  "red",
  "amber",
] as const;
export type Accent = (typeof ACCENTS)[number];

export type FieldNote = { key: string; note: string };

export type FieldGroup = {
  id: string;
  /** lowercase chrome, for example "record envelope". */
  title: string;
  /** the section's accent bar. */
  accent: Accent;
  /** one sentence. */
  summary: string;
  /** JSON path selectors; see lib/schema-selector.ts. */
  selectors: string[];
  /** line-by-line notes, keyed by JSON key name. */
  fields: FieldNote[];
  /** the parent category id for a nested level; omitted at the top level. */
  parent?: string;
};

/**
 * A native view's mapping into one unified category: the category id plus the
 * selectors and notes for the native document. The category's title, summary,
 * and accent come from `UNIFIED_GROUPS`, so both views always render the same
 * categories.
 */
export type GroupMapping = {
  id: string;
  selectors: string[];
  fields: FieldNote[];
};

export type SchemaView = {
  id: "native" | "unified";
  /** "native metadata" | "unified session". */
  label: string;
  /** for example "claude-code.jsonl" / "session.json". */
  filename: string;
  /** "jsonl" | "json". */
  format: string;
  /** the JSON to render. */
  document: unknown;
  groups: FieldGroup[];
};

export type HarnessSample = {
  id: HarnessId;
  /** lowercase display name, for example "claude code". */
  label: string;
  brand: BrandName | null;
  /** one sentence: where this harness keeps sessions. */
  intro: string;
  native: SchemaView;
  unified: SchemaView;
};

/** the BrandMark names fairtrade accepts; `pi` and `strike` have no mark. */
export const BRAND_NAMES = [
  "claude",
  "openai",
  "cursor",
  "opencode",
  "strike",
] as const;
export type BrandName = (typeof BRAND_NAMES)[number];

export const UNIFIED_OUTCOMES = ["resolved", "partial", "failed"] as const;

/**
 * The unified wire schema is identical for every harness, so its field groups
 * are the shared category list. Both views render these categories: the unified
 * view uses the selectors and notes below, while a native view supplies its own
 * selectors and notes per category (see `GroupMapping`). Fixtures leave
 * `unified.groups` empty and the loader substitutes this list.
 *
 * The `group-y` and `red` accent identifiers have no matching colour token in
 * fairtrade 0.0.9, so `app/globals.css` maps them onto the nearest canonical
 * tokens rather than inventing new colours.
 */
export const UNIFIED_GROUPS: FieldGroup[] = [
  {
    id: "identity",
    title: "identity",
    accent: "teal",
    summary: "what the session is and which model recorded it",
    selectors: ["id", "harness", "model"],
    fields: [
      { key: "id", note: "the stable session id" },
      { key: "harness", note: "which harness recorded the session" },
      { key: "model", note: "the model that answered" },
    ],
  },
  {
    id: "session",
    title: "session & timing",
    accent: "olive",
    summary: "outcome, project, working directory, and when it ran",
    selectors: [
      "outcome",
      "project",
      "workingDirectory",
      "startTime",
      "endTime",
      "durationMins",
    ],
    fields: [
      { key: "outcome", note: "resolved, partial, or failed" },
      { key: "project", note: "the project the session belongs to" },
      { key: "workingDirectory", note: "where the harness ran" },
      { key: "startTime", note: "when the session started" },
      { key: "endTime", note: "when it ended" },
      { key: "durationMins", note: "wall-clock minutes" },
    ],
  },
  {
    id: "usage",
    title: "usage",
    accent: "clay",
    summary: "the counts a reader scans first",
    selectors: [
      "turnCount",
      "toolCallCount",
      "totalTokens",
      "tokensIn",
      "tokensOut",
    ],
    fields: [
      { key: "turnCount", note: "turns after normalisation" },
      { key: "toolCallCount", note: "tool calls across every turn" },
      { key: "totalTokens", note: "total tokens" },
      { key: "tokensIn", note: "input tokens" },
      { key: "tokensOut", note: "output tokens" },
    ],
  },
  {
    id: "git",
    title: "git context",
    accent: "group-y",
    summary: "the branch, remote, and commits the session is bound to",
    selectors: ["gitBranch", "gitContext"],
    fields: [
      { key: "gitBranch", note: "the branch the session ran on" },
      { key: "gitContext.remote", note: "the origin remote" },
      { key: "gitContext.user", note: "the local git user" },
      { key: "gitContext.commits", note: "the commits bound to the session" },
    ],
  },
  {
    id: "turns",
    title: "turns",
    accent: "amber",
    summary: "the conversation, one turn per index",
    selectors: ["turns"],
    fields: [
      { key: "role", note: "user, assistant, tool, or system" },
      {
        key: "entryType",
        note: "text, tool_use, tool_result, thinking, system, error, result",
      },
      { key: "content", note: "the turn's reader-visible text" },
      { key: "depth", note: "0 for a message turn, 1 for a content part" },
      { key: "stopReason", note: "why the model stopped, when it did" },
    ],
  },
  {
    id: "tool-calls",
    title: "tool calls",
    parent: "turns",
    accent: "red",
    summary: "each call attached to a turn",
    selectors: ["turns[*].toolCalls"],
    fields: [
      { key: "id", note: "the call id, matched by its result" },
      { key: "name", note: "the tool's own name" },
      {
        key: "toolKind",
        note: "the normalised kind: read, edit, search, execute, ...",
      },
      { key: "filePath", note: "the file the call touched, when it did" },
      { key: "arguments", note: "the call input, as a JSON string" },
      {
        key: "result",
        note: "what the tool returned, as text or a JSON string",
      },
    ],
  },
  {
    id: "turn-identity",
    title: "turn identity",
    parent: "turns",
    accent: "teal",
    summary: "the model that produced each turn, and the subagent when one did",
    selectors: ["turns[*].observedModel", "turns[*].agentName"],
    fields: [
      { key: "observedModel", note: "the exact model that produced the turn" },
      { key: "agentName", note: "the subagent that produced the turn, when a launch did" },
    ],
  },
  {
    id: "turn-usage",
    title: "turn usage",
    parent: "turns",
    accent: "clay",
    summary: "the tokens each turn spent, repeating the session totals",
    selectors: ["turns[*].tokensIn", "turns[*].tokensOut"],
    fields: [
      { key: "tokensIn", note: "input tokens for the turn" },
      { key: "tokensOut", note: "output tokens for the turn" },
    ],
  },
];

const METADATA_DIR = resolve("testdata/metadata");

function describe(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function fail(location: string, problem: string, fix: string): never {
  throw new Error(
    `Metadata explorer fixture validation failed at ${location}: ${problem}. Fix: ${fix}.`,
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireObject(value: unknown, location: string): Record<string, unknown> {
  if (!isObject(value)) {
    fail(location, `expected a mapping, found ${describe(value)}`, "supply the documented object");
  }
  return value;
}

function requireString(value: unknown, location: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(location, `expected a non-empty string, found ${describe(value)}`, "supply a literal value");
  }
  return value;
}

function requireEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  location: string,
): T[number] {
  const candidate = requireString(value, location);
  if (!allowed.includes(candidate)) {
    fail(
      location,
      `unsupported value ${describe(candidate)}`,
      `use exactly one of ${allowed.join(" | ")}`,
    );
  }
  return candidate as T[number];
}

function validateGroupMapping(value: unknown, location: string): GroupMapping {
  const group = requireObject(value, location);
  const id = requireString(group.id, `${location}.id`);

  const selectorsValue = group.selectors;
  if (!Array.isArray(selectorsValue) || selectorsValue.length === 0) {
    fail(`${location}.selectors`, "expected a non-empty array", "point at least one selector at the native document");
  }
  const selectors = selectorsValue.map((entry, index) => {
    const selector = requireString(entry, `${location}.selectors[${index}]`);
    try {
      parseSelector(selector);
    } catch (error) {
      fail(
        `${location}.selectors[${index}]`,
        `invalid selector: ${String(error)}`,
        "use keys joined with . and array steps like [0] or [*]",
      );
    }
    return selector;
  });

  const fieldsValue = group.fields;
  if (!Array.isArray(fieldsValue) || fieldsValue.length === 0) {
    fail(`${location}.fields`, "expected a non-empty array", "supply the line-by-line notes");
  }
  const fields = fieldsValue.map((entry, index) => {
    const field = requireObject(entry, `${location}.fields[${index}]`);
    return {
      key: requireString(field.key, `${location}.fields[${index}].key`),
      note: requireString(field.note, `${location}.fields[${index}].note`),
    };
  });

  return { id, selectors, fields };
}

/**
 * Both views render the same categories. A native view supplies a mapping per
 * unified category; compose each with the category's shared title, summary, and
 * accent, and refuse a fixture that misses or invents a category.
 */
function composeNativeGroups(mappings: GroupMapping[], location: string): FieldGroup[] {
  const byId = new Map(mappings.map((mapping) => [mapping.id, mapping]));
  if (byId.size !== mappings.length) {
    fail(`${location}.groups`, "a category id is repeated", "give each unified category exactly one mapping");
  }
  const groups = UNIFIED_GROUPS.map((category) => {
    const mapping = byId.get(category.id);
    if (!mapping) {
      fail(
        `${location}.groups`,
        `missing the ${describe(category.id)} category`,
        `map every unified category: ${UNIFIED_GROUPS.map((group) => group.id).join(" | ")}`,
      );
    }
    byId.delete(category.id);
    return { ...category, selectors: mapping.selectors, fields: mapping.fields };
  });
  if (byId.size > 0) {
    fail(
      `${location}.groups`,
      `unknown categories ${[...byId.keys()].map(describe).join(", ")}`,
      `use only ${UNIFIED_GROUPS.map((group) => group.id).join(" | ")}`,
    );
  }
  return groups;
}

function validateUnifiedDocument(
  value: unknown,
  sampleId: HarnessId,
  location: string,
): void {
  const unified = requireObject(value, location);
  if (unified.harness !== sampleId) {
    fail(
      `${location}.harness`,
      `expected ${describe(sampleId)}, found ${describe(unified.harness)}`,
      "match the unified harness to the sample id",
    );
  }
  const turnsValue = unified.turns;
  if (!Array.isArray(turnsValue) || turnsValue.length === 0) {
    fail(`${location}.turns`, "expected a non-empty array", "supply the lowered turns");
  }
  let toolCallCount = 0;
  turnsValue.forEach((turnValue, index) => {
    const turn = requireObject(turnValue, `${location}.turns[${index}]`);
    if (turn.index !== index) {
      fail(
        `${location}.turns[${index}].index`,
        `expected ${index}, found ${describe(turn.index)}`,
        "number the turns 0..n-1 in order",
      );
    }
    if (Array.isArray(turn.toolCalls)) {
      toolCallCount += turn.toolCalls.length;
    }
  });
  if (unified.turnCount !== turnsValue.length) {
    fail(
      `${location}.turnCount`,
      `expected ${turnsValue.length}, found ${describe(unified.turnCount)}`,
      "match turnCount to the number of turns",
    );
  }
  if (unified.toolCallCount !== toolCallCount) {
    fail(
      `${location}.toolCallCount`,
      `expected ${toolCallCount}, found ${describe(unified.toolCallCount)}`,
      "match toolCallCount to the tool calls across every turn",
    );
  }
  requireEnum(unified.outcome, UNIFIED_OUTCOMES, `${location}.outcome`);
}

function validateSchemaView(
  value: unknown,
  location: string,
  harnessId: HarnessId,
): SchemaView {
  const view = requireObject(value, location);
  const id = requireEnum(view.id, ["native", "unified"] as const, `${location}.id`);
  const label = requireString(view.label, `${location}.label`);
  const filename = requireString(view.filename, `${location}.filename`);
  const format = requireString(view.format, `${location}.format`);
  if (!("document" in view) || view.document === undefined) {
    fail(`${location}.document`, "missing document", "include the JSON to render");
  }

  const groupsValue = view.groups;
  let groups: FieldGroup[];
  if (id === "unified") {
    // The categories are shared. A fixture leaves them empty; a loaded sample
    // (re-validated in tests) already carries the canonical list, so accept that
    // too, and refuse anything else.
    if (Array.isArray(groupsValue) && groupsValue.length > 0) {
      const ids = groupsValue.map(
        (entry, index) => requireObject(entry, `${location}.groups[${index}]`).id,
      );
      const canonical = UNIFIED_GROUPS.map((group) => group.id);
      if (
        ids.length !== canonical.length ||
        ids.some((value, index) => value !== canonical[index])
      ) {
        fail(
          `${location}.groups`,
          "the unified categories are shared, not authored per fixture",
          "leave the unified groups empty; the loader substitutes the canonical list",
        );
      }
    }
    groups = UNIFIED_GROUPS;
  } else if (Array.isArray(groupsValue) && groupsValue.length > 0) {
    const mappings = groupsValue.map((entry, index) =>
      validateGroupMapping(entry, `${location}.groups[${index}]`),
    );
    groups = composeNativeGroups(mappings, location);
  } else {
    fail(
      `${location}.groups`,
      `expected a non-empty array, found ${describe(groupsValue)}`,
      "map every unified category for this native document",
    );
  }

  if (id === "unified") {
    validateUnifiedDocument(view.document, harnessId, `${location}.document`);
  }

  const paths = collectNodePaths(view.document);
  for (const group of groups) {
    for (const selector of group.selectors) {
      if (!paths.some((path) => matchSelector(selector, path))) {
        fail(
          `${location}.groups.${group.id}.selectors`,
          `selector ${describe(selector)} matches no node in the document`,
          "point the selector at a key the document actually carries",
        );
      }
    }
  }

  return { id, label, filename, format, document: view.document, groups };
}

function validateSample(value: unknown, location: string): HarnessSample {
  const sample = requireObject(value, location);
  const id = requireEnum(sample.id, HARNESS_IDS, `${location}.id`);

  const brand = sample.brand;
  if (brand !== null && !BRAND_NAMES.includes(brand as BrandName)) {
    fail(
      `${location}.brand`,
      `unsupported brand ${describe(brand)}`,
      `use null or one of ${BRAND_NAMES.join(" | ")}`,
    );
  }

  const native = validateSchemaView(sample.native, `${location}.native`, id);
  if (native.id !== "native") {
    fail(`${location}.native.id`, `expected "native", found ${describe(native.id)}`, 'set the native view id to "native"');
  }
  const unified = validateSchemaView(sample.unified, `${location}.unified`, id);
  if (unified.id !== "unified") {
    fail(`${location}.unified.id`, `expected "unified", found ${describe(unified.id)}`, 'set the unified view id to "unified"');
  }

  return {
    id,
    label: requireString(sample.label, `${location}.label`),
    brand: brand as BrandName | null,
    intro: requireString(sample.intro, `${location}.intro`),
    native,
    unified,
  };
}

function orderSamples(samples: HarnessSample[]): HarnessSample[] {
  return HARNESS_IDS.map((id) => {
    const sample = samples.find((candidate) => candidate.id === id);
    if (!sample) {
      fail("samples", `missing harness ${describe(id)}`, "supply exactly one sample per harness");
    }
    return sample;
  });
}

/**
 * Validate a decoded fixture array, throwing an actionable Error on any
 * structural, identity, lowering, or selector mistake so a stale fixture cannot
 * render.
 */
export function validateHarnessSamples(raw: unknown): HarnessSample[] {
  if (!Array.isArray(raw)) {
    fail("samples", `expected an array, found ${describe(raw)}`, "decode every fixture file");
  }
  if (raw.length !== HARNESS_IDS.length) {
    fail(
      "samples",
      `expected ${HARNESS_IDS.length} samples, found ${raw.length}`,
      "supply exactly one sample per harness",
    );
  }
  const samples = raw.map((value, index) => validateSample(value, `samples[${index}]`));
  const ids = new Set(samples.map((sample) => sample.id));
  if (ids.size !== HARNESS_IDS.length) {
    fail("samples", "sample ids are not unique", "give every harness exactly one sample");
  }
  return samples;
}

/**
 * Read and validate every fixture, returning them in `HARNESS_IDS` order. The
 * Playwright spec runs from the repo root, so the relative resolve matches.
 */
export function loadHarnessSamples(): HarnessSample[] {
  const decoded = HARNESS_IDS.map((id) => {
    const path = resolve(METADATA_DIR, `${id}.json`);
    let source: string;
    try {
      source = readFileSync(path, "utf8");
    } catch (error) {
      fail(`testdata/metadata/${id}.json`, `could not read fixture: ${String(error)}`, "restore the fixture file");
    }
    try {
      return JSON.parse(source) as unknown;
    } catch (error) {
      fail(`testdata/metadata/${id}.json`, `invalid JSON: ${String(error)}`, "correct the fixture JSON");
    }
  });
  return orderSamples(validateHarnessSamples(decoded));
}
