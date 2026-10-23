"use client";

import { REVEAL_CLASS } from "@/lib/theme";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* the dot reveal's length, with room to spare before the fallback clears the mask */
const DOTS_MS = 700;
const STAGGER_MS = 60;

/**
 * Reveals what scrolls into view, once: dithered pictures grow their dots in
 * (app/site.css, `.art`) and marked headings and copy fade up (`[data-fade]`).
 * It only runs when the head script allowed motion; otherwise nothing waits.
 * Several things arriving together start a beat apart.
 */
export function RevealOnView() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains(REVEAL_CLASS)) return;

    const finish = (art: HTMLElement) => {
      art.dataset.revealed = "done";
    };

    const observer = new IntersectionObserver(
      (entries) => {
        let batch = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          observer.unobserve(element);
          const delay = batch * STAGGER_MS;
          batch += 1;
          if (element.classList.contains("art")) {
            element.style.setProperty("--reveal-delay", `${delay}ms`);
            element.dataset.revealed = "run";
            element.addEventListener("transitionend", () => finish(element), { once: true });
            window.setTimeout(() => finish(element), DOTS_MS + delay + 400);
          } else {
            element.dataset.shown = "true";
          }
        }
      },
      { threshold: 0.15 },
    );

    const watch = () => {
      document
        .querySelectorAll<HTMLElement>(".art:not([data-revealed]), [data-fade]:not([data-shown])")
        .forEach((target) => observer.observe(target));
    };
    watch();

    // Something that mounts after this ran (a late client render, a hot reload)
    // would otherwise wait hidden forever; it is watched as soon as it lands.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        watch();
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
