"use client";

import { Button, CommandBlock } from "@peasant-labs/fairtrade/ui";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type ComponentType,
} from "react";

type Theme = "dark" | "light";

const THEME_KEY = "peasant-labs-theme";
const ROUTE_FOCUS_KEY = "peasant-labs-project-route-focus";
const THEME_EVENT = "peasant-labs-theme-change";

type InteractiveButtonProps = Parameters<typeof Button>[0] &
  ButtonHTMLAttributes<HTMLButtonElement>;

const InteractiveButton = Button as ComponentType<InteractiveButtonProps>;

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_EVENT, onStoreChange);
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ProjectInteractions() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, () => "dark");

  useEffect(() => {
    const markProjectNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname.startsWith("/projects")
      ) {
        window.sessionStorage.setItem(ROUTE_FOCUS_KEY, "true");
      }
    };

    document.addEventListener("click", markProjectNavigation, true);
    return () => document.removeEventListener("click", markProjectNavigation, true);
  }, []);

  useEffect(() => {
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;
    const navigationRequested =
      window.sessionStorage.getItem(ROUTE_FOCUS_KEY) === "true";
    if (!pathChanged && !navigationRequested) return;

    window.sessionStorage.removeItem(ROUTE_FOCUS_KEY);
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#project-heading")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <InteractiveButton
      type="button"
      variant="ghost"
      size="sm"
      pressed={theme === "light"}
      data-theme-toggle
      onClick={() => {
        document.documentElement.dataset.theme = nextTheme;
        window.localStorage.setItem(THEME_KEY, nextTheme);
        window.dispatchEvent(new Event(THEME_EVENT));
      }}
      aria-label={`use ${nextTheme} theme`}
    >
      {nextTheme} theme
    </InteractiveButton>
  );
}

export function ProjectCommand({ command, label }: { command: string; label: string }) {
  return (
    <div
      className="pj-command-scroll"
      data-command-scroll
      data-contained-overflow
      role="region"
      aria-label={`${label} command`}
      tabIndex={0}
    >
      <CommandBlock command={command} label={label} />
    </div>
  );
}
