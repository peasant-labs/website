import { Fragment } from "react";

const SPANS = /(`[^`]+`|\*\*[^*]+\*\*)/;

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
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
