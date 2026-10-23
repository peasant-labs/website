import { Fragment, type ReactNode } from "react";

const SPANS = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

/*
 * Inline code stays on one line so a flag is never split. Longer than this, it
 * may wrap, but only after a space, a slash or a bar, never inside a name.
 */
const KEEP_WHOLE = 28;
const WRAP_AFTER = /(?<=[ /|])/;

function InlineCode({ code }: { code: string }) {
  if (code.length <= KEEP_WHOLE) return <code>{code}</code>;
  return (
    <code className="dx-code-wrap">
      {code.split(WRAP_AFTER).map((piece, index) => (
        <Fragment key={index}>
          {index > 0 ? <wbr /> : null}
          <span>{piece}</span>
        </Fragment>
      ))}
    </code>
  );
}

/**
 * Docs copy is plain strings with `backticks` around code, **stars** around
 * the name of a control on screen, and [label](href) for a link, the way the
 * product's own docs are written. This renders those spans as <code>, <strong>
 * and <a> and leaves everything else as text, so nothing in the copy is ever
 * parsed as HTML.
 */
/* punctuation that belongs to the span before it, and must not wrap onto a line of its own */
const TRAILING = /^[.,;:!?)\]…]+/;
const GLUE_MAX = 32;

function Span({ part }: { part: string }) {
  if (part.startsWith("`") && part.endsWith("`") && part.length > 1) return <InlineCode code={part.slice(1, -1)} />;
  const link = LINK.exec(part);
  if (link) {
    const external = /^https?:/.test(link[2]);
    return (
      <a className="dx-link" href={link[2]} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {link[1]}
      </a>
    );
  }
  if (part.startsWith("**") && part.endsWith("**") && part.length > 3) return <strong>{part.slice(2, -2)}</strong>;
  return part;
}

export function Rich({ text }: { text: string }) {
  const parts = text.split(SPANS);
  const out: ReactNode[] = [];
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]!;
    if (index % 2 === 0) {
      out.push(<Fragment key={index}>{part}</Fragment>);
      continue;
    }
    // a short span keeps the punctuation right after it, so "`/peasant`," never leaves the
    // comma alone; a long one may still wrap inside, so it is left as it is
    const next = parts[index + 1] ?? "";
    const tail = part.length <= GLUE_MAX ? TRAILING.exec(next)?.[0] : undefined;
    if (tail) {
      parts[index + 1] = next.slice(tail.length);
      out.push(
        <span key={index} className="dx-nowrap">
          <Span part={part} />
          {tail}
        </span>,
      );
    } else {
      out.push(
        <Fragment key={index}>
          <Span part={part} />
        </Fragment>,
      );
    }
  }
  return <>{out}</>;
}
