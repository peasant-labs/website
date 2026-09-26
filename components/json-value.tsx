import type { ReactNode } from "react";

/**
 * A pure, structured renderer for JSON data.
 *
 * Every value is written as a React text node, never as HTML, so transcript and
 * tool-output strings stay escaped by the framework. Primitive leaves render
 * inside `<code>`: they are data, not authored page copy, and the site's
 * lowercase-copy scan treats code the same way it treats the other demos.
 */

export type JsonValueProps = {
  value: unknown;
  name?: string;
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

function Label({ name }: { name?: string }): ReactNode {
  if (name === undefined) {
    return null;
  }
  return <span className="mx-json-key">{name}</span>;
}

export function JsonValue({ value, name }: JsonValueProps): ReactNode {
  if (Array.isArray(value)) {
    return (
      <div className="mx-json mx-json-array">
        <Label name={name} />
        <span className="mx-json-punct">[</span>
        <div className="mx-json-children">
          {value.map((item, index) => (
            <div className="mx-json-row" key={index}>
              <JsonValue value={item} name={String(index)} />
            </div>
          ))}
        </div>
        <span className="mx-json-punct">]</span>
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <div className="mx-json mx-json-object">
        <Label name={name} />
        <span className="mx-json-punct">{"{"}</span>
        <div className="mx-json-children">
          {Object.entries(value).map(([key, item]) => (
            <div className="mx-json-row" key={key}>
              <JsonValue value={item} name={key} />
            </div>
          ))}
        </div>
        <span className="mx-json-punct">{"}"}</span>
      </div>
    );
  }

  return (
    <>
      <Label name={name} />
      <Primitive value={value} />
    </>
  );
}
