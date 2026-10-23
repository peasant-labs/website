"use client";

import { Mark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentDocsItem, DOCS_NAV, type DocsIcon } from "@/lib/docs";
import {
  BookOpen,
  Code,
  Download,
  EyeOff,
  FileText,
  FlaskConical,
  GitPullRequest,
  Lock,
  Menu,
  Plug,
  Send,
  Terminal,
  X,
} from "@peasant-labs/fairtrade/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type SVGProps } from "react";

const ICONS: Record<DocsIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  overview: BookOpen,
  install: Download,
  kickstart: Terminal,
  publish: Send,
  evals: FlaskConical,
  reviews: GitPullRequest,
  cli: Code,
  agents: Plug,
  redaction: EyeOff,
  access: Lock,
  blog: FileText,
};

/**
 * The docs app's sidebar: the mark (home), the grouped destinations with the
 * current page marked, and the theme control at the foot. On a phone it folds
 * into a bar with a menu button that opens the same list in place.
 */
export function DocsSidebar() {
  const pathname = usePathname();
  const current = currentDocsItem(pathname);
  const [open, setOpen] = useState(false);

  return (
    <aside className="dx-side" aria-label="docs" data-open={open ? "true" : "false"}>
      <div className="dx-top">
        <Link className="site-brand dx-brand" href="/">
          <Mark className="site-brand-mark" />
          peasant labs
        </Link>
        <ThemeToggle className="site-icon-btn dx-theme" />
        <button
          type="button"
          className="site-icon-btn dx-menu"
          aria-expanded={open}
          aria-controls="dx-groups"
          aria-label={open ? "close the docs menu" : "open the docs menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X aria-hidden="true" focusable="false" />
          ) : (
            <Menu aria-hidden="true" focusable="false" />
          )}
        </button>
      </div>
      <div className="dx-groups" id="dx-groups">
        {DOCS_NAV.map((group) => (
          <nav key={group.id} className="dx-group" aria-label={group.label ?? "more"}>
            {group.label ? <span className="dx-glabel">{group.label}</span> : null}
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const on = item.id === current;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="dx-item"
                  aria-current={on ? "page" : undefined}
                  // picking a destination closes the phone menu
                  onClick={() => setOpen(false)}
                >
                  <Icon className="dx-ic" aria-hidden="true" focusable="false" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ))}
      </div>
    </aside>
  );
}
