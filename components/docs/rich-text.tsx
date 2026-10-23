import { Fragment } from "react";

const SPANS = /(`[^`]+`|\*\*[^*]+\*\*)/;

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
 * Docs copy is plain strings with `backticks` around code and **stars** around
 * the name of a control on screen, the way the product's own docs are written.
 * This renders those spans as <code> and <strong> and leaves everything else
 * as text, so nothing in the copy is ever parsed as HTML.
 */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(SPANS).map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
          return <InlineCode key={index} code={part.slice(1, -1)} />;
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
