"use client";

import { CommandBlock } from "@/components/fairtrade-client";
import { useEffect, useRef } from "react";

/**
 * A copyable command. On a phone a long one stays on one line and scrolls
 * sideways inside its block, so a flag or an address never breaks mid-word,
 * and the copy button stays put. While the line scrolls it takes keyboard
 * focus, so it can be scrolled without a pointer; when it fits, it is not a
 * tab stop.
 */
export function DocCommand({ command, label }: { command: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const line = ref.current?.querySelector<HTMLElement>(".cli-cmd-line");
    if (!line) return;
    const update = () => {
      const scrolls = line.scrollWidth > line.clientWidth + 1;
      if (scrolls) {
        line.tabIndex = 0;
        line.setAttribute("role", "group");
        line.setAttribute("aria-label", `command: ${command}`);
      } else {
        line.removeAttribute("tabindex");
        line.removeAttribute("role");
        line.removeAttribute("aria-label");
      }
    };
    update();
    // the line's box and its text's width both change: on a resize, and when the font arrives
    const observer = new ResizeObserver(update);
    observer.observe(line);
    const code = line.querySelector("code");
    if (code) observer.observe(code);
    let live = true;
    document.fonts?.ready.then(() => live && update());
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [command]);

  return (
    <div ref={ref} className="dx-cmd" data-contained-overflow>
      <CommandBlock command={command} label={label ?? command} />
    </div>
  );
}
