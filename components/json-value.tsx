import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { FieldGroup } from "@/lib/metadata-explorer";
import { matchSelector, nodeInGroup } from "@/lib/schema-selector";

/**
 * A pure, structured renderer for JSON data.
 *
 * Every value is written as a React text node, never as HTML, so transcript and
 * tool-output strings stay escaped by the framework. Primitive leaves render
 * inside `<code>`: they are data, not authored page copy, and the site's
 * lowercase-copy scan treats code the same way it treats the other demos.
 *
 * Objects render `key: value` members, arrays render their elements without an
 * index label, and every member carries a trailing comma, so the document reads
 * like the JSON it is. When `groups` is supplied each node carries the ids of
 * the field groups that cover it (`data-groups`); a node whose path is exactly a
 * selector root is a linkable region (`data-region`) and activates its group on
 * pointer input. Regions are pointer affordances only: the section list is the
 * keyboard control, so no region takes focus or a button role.
 */

export type JsonValueProps = {
  value: unknown;
  name?: string;
  path?: (string | number)[];
  groups?: FieldGroup[];
  activeGroup?: string | null;
  onActivate?: (id: string) => void;
  /** Append a trailing comma, so a member reads like ordinary JSON. */
  comma?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function primitiveClass(value: unknown): string {
  if (value === null) {
    return "mx-json-null";
  }
  switch (typeof value) {
    case "string":
      return "mx-json-string";
    case "number":
      return "mx-json-number";
    case "boolean":
      return "mx-json-bool";
    default:
      return "mx-json-null";
  }
}

function Primitive({ value }: { value: unknown }): ReactNode {
  return (
    <code className={primitiveClass(value)}>
      {value === null ? "null" : String(value)}
    </code>
  );
}

/**
 * An object member's name. The non-breaking space keeps the value off the
 * name's closing colon even when the line wraps, so the pair never reads as one
 * token.
 */
function Label({ name }: { name?: string }): ReactNode {
  if (name === undefined) {
    return null;
  }
  return (
    <>
      <span className="mx-json-key">{name}</span>
      <span className="mx-json-punct">{":\u00A0"}</span>
    </>
  );
}

function Comma(): ReactNode {
  return <span className="mx-json-punct">,</span>;
}

export function JsonValue({
  value,
  name,
  path = [],
  groups = [],
  activeGroup = null,
  onActivate,
  comma = false,
}: JsonValueProps): ReactNode {
  const groupIds = groups
    .filter((group) => group.selectors.some((selector) => nodeInGroup(selector, path)))
    .map((group) => group.id);
  const regionIds = groups
    .filter((group) => group.selectors.some((selector) => matchSelector(selector, path)))
    .map((group) => group.id);
  const active = activeGroup !== null && regionIds.includes(activeGroup);
  const region = regionIds.length > 0;

  const regionAttributes = {
    "data-region": region ? regionIds.join(" ") : undefined,
    "data-active": active ? "true" : undefined,
    onMouseEnter: region ? () => onActivate?.(regionIds[0]) : undefined,
    onClick: region
      ? (event: ReactMouseEvent<HTMLElement>) => {
          // Nested regions bubble their click here after the inner node has
          // already activated; only the closest region wins.
          const target = event.target as HTMLElement | null;
          const closest = target?.closest<HTMLElement>("[data-region]");
          if (closest !== event.currentTarget) {
            return;
          }
          onActivate?.(regionIds[0]);
        }
      : undefined,
  };

  const common = {
    "data-groups": groupIds.length > 0 ? groupIds.join(" ") : undefined,
    ...regionAttributes,
  };

  if (Array.isArray(value)) {
    return (
      <div className="mx-json mx-json-array" {...common}>
        <Label name={name} />
        <span className="mx-json-punct">[</span>
        <div className="mx-json-children">
          {value.map((item, index) => (
            <div className="mx-json-row" key={index}>
              <JsonValue
                value={item}
                path={[...path, index]}
                groups={groups}
                activeGroup={activeGroup}
                onActivate={onActivate}
                comma
              />
            </div>
          ))}
        </div>
        <span className="mx-json-punct">]</span>
        {comma ? <Comma /> : null}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <div className="mx-json mx-json-object" {...common}>
        <Label name={name} />
        <span className="mx-json-punct">{"{"}</span>
        <div className="mx-json-children">
          {Object.entries(value).map(([key, item]) => (
            <div className="mx-json-row" key={key}>
              <JsonValue
                value={item}
                name={key}
                path={[...path, key]}
                groups={groups}
                activeGroup={activeGroup}
                onActivate={onActivate}
                comma
              />
            </div>
          ))}
        </div>
        <span className="mx-json-punct">{"}"}</span>
        {comma ? <Comma /> : null}
      </div>
    );
  }

  return (
    <span className="mx-json-leaf" {...common}>
      <Label name={name} />
      <Primitive value={value} />
      {comma ? <Comma /> : null}
    </span>
  );
}
