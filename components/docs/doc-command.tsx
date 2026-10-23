"use client";

import { CommandBlock } from "@/components/fairtrade-client";
import { useEffect, useRef } from "react";

/* after "//" and after each path "/", where an address may wrap */
const BREAK_AFTER = /(?<=\/\/)|(?<=[^/]\/)(?=[^/\s])/g;

/**
 * Lets the drawn command wrap after an address's slashes, as well as at its
 * spaces: a <wbr> goes in at each such point. Copy still takes the exact
 * command. The block is keyed by its command, so React never rewrites this
 * text in place.
 */
function markBreaks(code: HTMLElement) {
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const text of texts) {
    const points = [...(text.nodeValue ?? "").matchAll(BREAK_AFTER)].map((match) => match.index!).filter(Boolean);
    let node = text;
    let consumed = 0;
    for (const point of points) {
      const rest = node.splitText(point - consumed);
      rest.before(document.createElement("wbr"));
      node = rest;
      consumed = point;
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
    if (code && !code.querySelector("wbr")) markBreaks(code);
  }, [command]);

  return (
    <div ref={ref} className="dx-cmd">
      <CommandBlock key={command} command={command} label={label ?? command} wrap />
    </div>
  );
}
