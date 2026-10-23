import { Fragment, type ReactNode } from "react";

/*
 * Copy marks a command it names with backticks: `/peasant`. It is set as code
 * and never breaks across lines, and the punctuation right after it stays on
 * its line with it.
 */
const COMMAND = /`([^`]+)`([.,;:!?)]*)/g;

/** Landing copy with its `commands` set as code that does not wrap. */
export function withCommands(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(COMMAND)) {
    const at = match.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(
      <span key={at} className="lp-nowrap">
        <code className="lp-cmd">{match[1]}</code>
        {match[2]}
      </span>,
    );
    last = at + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : <Fragment>{parts}</Fragment>;
}

/** The same copy as plain text, for an attribute or a description. */
export function plainCommands(text: string) {
  return text.replace(COMMAND, "$1$2");
}
