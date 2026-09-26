import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TranscriptWireInput } from "@peasant-labs/fairtrade/ui";

/**
 * The interactive metadata explorer on /projects: for one invented mock session
 * it shows the raw native records each harness writes and the unified wire
 * session peasant lowers them into, with the record-to-turn links made explicit.
 *
 * This module is the only reader of `testdata/metadata/*.json`. Its runtime
 * imports are `node:fs`, `node:path`, and a type-only fairtrade import, so the
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

export const OUTCOMES = [
  "text",
  "tool_call",
  "tool_result",
  "control",
  "ignored",
  "opaque",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

/** the BrandMark names fairtrade accepts; `pi` has no mark and carries null. */
export const BRAND_NAMES = [
  "claude",
  "openai",
  "cursor",
  "opencode",
  "strike",
] as const;
export type BrandName = (typeof BRAND_NAMES)[number];

export const UNIFIED_OUTCOMES = ["resolved", "partial", "failed"] as const;

export type RawRecord = {
  /** unique within the sample, kebab-case. */
  id: string;
  /** the provider's own kind label, for example "assistant". */
  kind: string;
  /** what the parser concluded about this record. */
  outcome: Outcome;
  /** one or two sentences: what this record is and where it lands. */
  note: string;
  /** the native record object, exactly as the harness writes it. */
  raw: unknown;
  /** unified turn indexes this record produced; [] for control/ignored/opaque. */
  mapsTo: number[];
};

export type HarnessSample = {
  id: HarnessId;
  /** lowercase display name, for example "claude code". */
  label: string;
  brand: BrandName | null;
  native: { path: string; format: string; note: string };
  /** one sentence: where this harness keeps sessions. */
  intro: string;
  records: RawRecord[];
  /** flat payload, the same shape as lib/demo-session.ts. */
  unified: TranscriptWireInput;
};

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

function requireInteger(value: unknown, location: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(location, `expected an integer, found ${describe(value)}`, "supply a whole number");
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

function parseRecord(value: unknown, location: string, turnCount: number): RawRecord {
  const record = requireObject(value, location);
  if (!("raw" in record)) {
    fail(`${location}.raw`, "missing native record", "include the provider's own record object");
  }
  const mapsToValue = record.mapsTo;
  if (!Array.isArray(mapsToValue)) {
    fail(`${location}.mapsTo`, `expected an array, found ${describe(mapsToValue)}`, "use [] or turn indexes");
  }
  const mapsTo = mapsToValue.map((entry, index) => {
    const turn = requireInteger(entry, `${location}.mapsTo[${index}]`);
    if (turn < 0 || turn >= turnCount) {
      fail(
        `${location}.mapsTo[${index}]`,
        `turn index ${turn} is outside 0..${turnCount - 1}`,
        "point the record at a real unified turn, or use [] when it writes none",
      );
    }
    return turn;
  });

  return {
    id: requireString(record.id, `${location}.id`),
    kind: requireString(record.kind, `${location}.kind`),
    outcome: requireEnum(record.outcome, OUTCOMES, `${location}.outcome`),
    note: requireString(record.note, `${location}.note`),
    raw: record.raw,
    mapsTo,
  };
}

function validateUnified(
  value: unknown,
  sampleId: HarnessId,
  location: string,
): TranscriptWireInput {
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
  return unified as unknown as TranscriptWireInput;
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

  const native = requireObject(sample.native, `${location}.native`);
  const nativePath = requireString(native.path, `${location}.native.path`);
  const nativeFormat = requireString(native.format, `${location}.native.format`);
  const nativeNote = requireString(native.note, `${location}.native.note`);

  const recordsValue = sample.records;
  if (!Array.isArray(recordsValue) || recordsValue.length === 0) {
    fail(`${location}.records`, "expected a non-empty array", "supply the native records");
  }

  const unified = validateUnified(sample.unified, id, `${location}.unified`);
  const turnCount = Array.isArray((unified as { turns?: unknown }).turns)
    ? ((unified as { turns: unknown[] }).turns.length as number)
    : 0;

  const records = recordsValue.map((record, index) =>
    parseRecord(record, `${location}.records[${index}]`, turnCount),
  );
  const recordIds = new Set<string>();
  for (const record of records) {
    if (recordIds.has(record.id)) {
      fail(
        `${location}.records`,
        `duplicate record id ${describe(record.id)}`,
        "give every record in a sample a unique id",
      );
    }
    recordIds.add(record.id);
  }

  return {
    id,
    label: requireString(sample.label, `${location}.label`),
    brand: brand as BrandName | null,
    native: { path: nativePath, format: nativeFormat, note: nativeNote },
    intro: requireString(sample.intro, `${location}.intro`),
    records,
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
 * structural, identity, or lowering mistake so a stale fixture cannot render.
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
