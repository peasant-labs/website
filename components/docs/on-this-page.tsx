"use client";

import type { TocItem } from "@/lib/docs-content";
import { useEffect, useState } from "react";

/**
 * The "on this page" list beside a docs page or a post. It marks the part being
 * read: the last one whose heading has passed the top third of the window.
 */
export function OnThisPage({ items }: { items: readonly TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      () => {
        const line = window.innerHeight / 3;
        let current = targets[0]!.id;
        for (const target of targets) {
          if (target.getBoundingClientRect().top <= line) current = target.id;
        }
        setActive(current);
      },
      { rootMargin: "0px 0px -66% 0px", threshold: [0, 1] },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
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
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
