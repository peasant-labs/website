"use client";

import { CommandBlock } from "@/components/fairtrade-client";
import { useEffect, useRef } from "react";

/* after "//" and after each path "/", where an address may wrap */
const BREAK_AFTER = /(?<=\/\/)|(?<=[^/]\/)(?=[^/\s])/;

/* a run that keeps to one line, breaking inside only when it alone is wider than the line */
function held(...nodes: Array<Node | string>) {
  const whole = document.createElement("span");
  whole.style.cssText = "display: inline-block; max-width: 100%; overflow-wrap: anywhere";
  whole.append(...nodes);
  return whole;
}

/**
 * Lets the drawn command wrap after an address's slashes, as well as at its
 * spaces: a <wbr> goes in at each such point. A hyphen is not a place to wrap
 * ("peasant-plugins", "--collective"), so each piece with one is held whole,
 * and a pipe is held with the word after it, so a line never ends on a bare
 * "|".
 * Only markup is added: copy takes the exact command, and so does a selection.
 * The block is keyed by its command, so React never rewrites this text in
 * place.
 */
function markBreaks(code: HTMLElement) {
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const text of texts) {
    const drawn = document.createDocumentFragment();
    for (const word of (text.nodeValue ?? "").split(/(\s+)/)) {
      if (!word) continue;
      word.split(BREAK_AFTER).forEach((piece, index) => {
        if (index > 0) drawn.append(document.createElement("wbr"));
        drawn.append(piece.includes("-") ? held(piece) : piece);
      });
    }
    text.replaceWith(drawn);
  }
  for (const pipe of code.querySelectorAll(".cli-tok")) {
    const space = pipe.nextSibling;
    const next = space?.nextSibling;
    if (pipe.textContent === "|" && space?.nodeType === Node.TEXT_NODE && space.nodeValue === " " && next) {
      const whole = held();
      pipe.before(whole);
      whole.append(pipe, space, next);
    }
  }
}

/**
 * A copyable command, wrapped: it breaks at spaces and after an address's
 * slashes, so a flag, a date or a package name stays whole, and only a token
 * wider than the line breaks inside it. Nothing scrolls out of sight.
 */
export function DocCommand({ command, label }: { command: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const code = ref.current?.querySelector<HTMLElement>(".cli-cmd-line code");
    if (code && !code.dataset.breaks) {
      code.dataset.breaks = "marked";
      markBreaks(code);
    }
  }, [command]);

  return (
    <div ref={ref} className="dx-cmd">
      <CommandBlock key={command} command={command} label={label ?? command} wrap />
    </div>
  );
}
