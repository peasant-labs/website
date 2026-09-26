/**
 * The pure path language shared by the metadata explorer renderer, its loader,
 * and its tests.
 *
 * A selector is a path into a JSON document: keys joined with `.`, array
 * indexes written `[0]`, and `[*]` matching any index. A rendered node is in a
 * group when its path equals a selector path or is a descendant of one. Keeping
 * this module free of `node:` imports lets a client component import the matcher
 * directly without dragging the fixture loader into the browser bundle.
 */

export type PathToken = string | number;
type SelectorSegment = { key: string } | { index: number | "*" };

function fail(selector: string, problem: string): never {
  throw new Error(`Invalid selector ${JSON.stringify(selector)}: ${problem}.`);
}

/**
 * Parse a selector into ordered segments, throwing on any malformed input so a
 * stale selector is caught when the fixture loads rather than rendering wrong.
 */
export function parseSelector(selector: string): SelectorSegment[] {
  if (typeof selector !== "string" || selector.trim() === "") {
    fail(String(selector), "selectors must be non-empty strings");
  }
  const segments: SelectorSegment[] = [];
  const length = selector.length;
  let cursor = 0;

  function readKey(): string {
    const start = cursor;
    while (
      cursor < length &&
      selector[cursor] !== "." &&
      selector[cursor] !== "["
    ) {
      cursor += 1;
    }
    if (cursor === start) {
      fail(selector, "expected a key before this point");
    }
    return selector.slice(start, cursor);
  }

  segments.push({ key: readKey() });
  while (cursor < length) {
    const character = selector[cursor];
    if (character === ".") {
      cursor += 1;
      segments.push({ key: readKey() });
      continue;
    }
    if (character === "[") {
      const start = cursor + 1;
      cursor += 1;
      while (cursor < length && selector[cursor] !== "]") {
        cursor += 1;
      }
      if (cursor >= length) {
        fail(selector, "an array step is missing its closing ]");
      }
      const inner = selector.slice(start, cursor);
      cursor += 1;
      if (inner === "*") {
        segments.push({ index: "*" });
      } else if (/^\d+$/.test(inner)) {
        segments.push({ index: Number(inner) });
      } else {
        fail(selector, `array steps must be [0] or [*], found [${inner}]`);
      }
      continue;
    }
    fail(selector, `unexpected character ${JSON.stringify(character)}`);
  }

  return segments;
}

function segmentMatches(segment: SelectorSegment, token: PathToken): boolean {
  if ("key" in segment) {
    return typeof token === "string" && token === segment.key;
  }
  if (segment.index === "*") {
    return typeof token === "number";
  }
  return token === segment.index;
}

/** True when the path is exactly the selector's target node. */
export function matchSelector(selector: string, path: PathToken[]): boolean {
  const segments = parseSelector(selector);
  if (segments.length !== path.length) {
    return false;
  }
  return segments.every((segment, index) =>
    segmentMatches(segment, path[index]),
  );
}

/** True when the path is the selector's target node or a descendant of it. */
export function nodeInGroup(selector: string, path: PathToken[]): boolean {
  const segments = parseSelector(selector);
  if (segments.length > path.length) {
    return false;
  }
  return segments.every((segment, index) =>
    segmentMatches(segment, path[index]),
  );
}

/**
 * Every path in a document, root first, in document order. The loader uses this
 * to prove each selector still matches at least one node.
 */
export function collectNodePaths(
  value: unknown,
  base: PathToken[] = [],
): PathToken[][] {
  const paths: PathToken[][] = [base];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      paths.push(...collectNodePaths(item, [...base, index]));
    });
    return paths;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      paths.push(...collectNodePaths(item, [...base, key]));
    }
  }
  return paths;
}
