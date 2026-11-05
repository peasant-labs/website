"use client";

import type { TocItem } from "@/lib/docs-content";
import { useEffect, useRef, useState } from "react";

/**
 * The "on this page" list beside a docs page or a post. It marks the part being
 * read: the last one whose heading has passed the top third of the window. A
 * short last part may never get its heading that high, so once the page is
 * scrolled to its end the last part is marked. A part chosen from the list is
 * marked at once and stays marked until the reader scrolls on their own.
 */
export function OnThisPage({ items }: { items: readonly TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const chosen = useRef<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      if (chosen.current) return setActive(chosen.current);
      const root = document.documentElement;
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
        return setActive(targets[targets.length - 1]!.id);
      }
      const line = window.innerHeight / 3;
      let current = targets[0]!.id;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) current = target.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // the reader's own scrolling releases a part chosen from the list
    const release = () => {
      chosen.current = null;
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    for (const event of ["wheel", "touchstart", "keydown"] as const) {
      window.addEventListener(event, release, { passive: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      for (const event of ["wheel", "touchstart", "keydown"] as const) window.removeEventListener(event, release);
    };
  }, [items]);

  return (
    <nav className="dx-toc" aria-label="on this page">
      <span className="dx-glabel">on this page</span>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={item.sub ? "dx-toc-item dx-toc-sub" : "dx-toc-item"}
          aria-current={item.id === active ? "location" : undefined}
          onClick={() => {
            chosen.current = item.id;
            setActive(item.id);
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
