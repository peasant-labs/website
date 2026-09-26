import type { FieldGroup } from "@/lib/metadata-explorer";
import {
  collectNodePaths,
  matchSelector,
  type PathToken,
} from "@/lib/schema-selector";

/**
 * Canonical JSON lines.
 *
 * The explorer shows the document exactly as `JSON.stringify(value, null, 2)`
 * would, so the window reads like the json it is. One walk emits both the text
 * and the line range of every node, which is what links a field group to the
 * lines it covers. `buildJsonLines(value).text` is asserted equal to
 * `JSON.stringify(value, null, 2)` in the explorer test, so this can never drift
 * into a private format.
 */

export type JsonLines = {
  text: string;
  lines: string[];
  nodeLines: Map<string, [number, number]>;
};

function pathKey(path: PathToken[]): string {
  return JSON.stringify(path);
}

function isScalar(value: unknown): boolean {
  return value === null || typeof value !== "object";
}

function emit(
  value: unknown,
  path: PathToken[],
  indent: number,
  lines: string[],
  nodeLines: Map<string, [number, number]>,
): number {
  const pad = " ".repeat(indent);
  const start = lines.length;

  if (isScalar(value)) {
    lines.push(pad + JSON.stringify(value));
    nodeLines.set(pathKey(path), [start, start]);
    return start;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(pad + "[]");
      nodeLines.set(pathKey(path), [start, start]);
      return start;
    }
    lines.push(pad + "[");
    value.forEach((item, index) => {
      emit(item, [...path, index], indent + 2, lines, nodeLines);
      if (index < value.length - 1) {
        lines[lines.length - 1] += ",";
      }
    });
    lines.push(pad + "]");
    nodeLines.set(pathKey(path), [start, lines.length - 1]);
    return start;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    lines.push(pad + "{}");
    nodeLines.set(pathKey(path), [start, start]);
    return start;
  }
  const childPad = " ".repeat(indent + 2);
  lines.push(pad + "{");
  entries.forEach(([key, item], index) => {
    const childStart = emit(item, [...path, key], indent + 2, lines, nodeLines);
    lines[childStart] =
      childPad + JSON.stringify(key) + ": " + lines[childStart].slice(childPad.length);
    if (index < entries.length - 1) {
      lines[lines.length - 1] += ",";
    }
  });
  lines.push(pad + "}");
  nodeLines.set(pathKey(path), [start, lines.length - 1]);
  return start;
}

export function buildJsonLines(value: unknown): JsonLines {
  const lines: string[] = [];
  const nodeLines = new Map<string, [number, number]>();
  emit(value, [], 0, lines, nodeLines);
  return { text: lines.join("\n"), lines, nodeLines };
}

export type GroupLines = { indexes: Set<number>; first: number };

/**
 * The line indexes each field group covers, and the first line to scroll to.
 * A group covers every line of every node its selectors match.
 */
export function groupLines(
  value: unknown,
  groups: FieldGroup[],
  nodeLines: Map<string, [number, number]>,
): Map<string, GroupLines> {
  const paths = collectNodePaths(value);
  const result = new Map<string, GroupLines>();
  for (const group of groups) {
    const indexes = new Set<number>();
    for (const selector of group.selectors) {
      for (const path of paths) {
        if (!matchSelector(selector, path)) {
          continue;
        }
        const range = nodeLines.get(pathKey(path));
        if (!range) {
          continue;
        }
        for (let line = range[0]; line <= range[1]; line++) {
          indexes.add(line);
        }
      }
    }
    result.set(group.id, {
      indexes,
      first: indexes.size > 0 ? Math.min(...indexes) : 0,
    });
  }
  return result;
}
