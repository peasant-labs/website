"use client";

import { currentDocsItem, DOCS_NAV, type DocsIcon } from "@/lib/docs";
import { LOGIN_URL } from "@/lib/site";
import { applyTheme, currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import {
  BookOpen,
  Code,
  Download,
  EyeOff,
  FileText,
  FlaskConical,
  GitPullRequest,
  Lock,
  Moon,
  Plug,
  Send,
  Sun,
  Terminal,
} from "@peasant-labs/fairtrade/icons";
import { AppSidebar, APP_SIDEBAR_APPS, type AppSidebarGroup } from "@peasant-labs/fairtrade/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentType } from "react";

const ICONS: Record<DocsIcon, ComponentType> = {
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

/* where each app lives; the docs are this one */
const APP_HREFS: Record<string, string> = {
  online: "https://village.peasantlabs.org",
  local: "http://localhost:8690",
  docs: "/docs",
};

const APPS = APP_SIDEBAR_APPS.map((app) => ({ ...app, href: APP_HREFS[app.id] }));

/**
 * The docs app's sidebar: fairtrade's shared AppSidebar with the docs app
 * current, the docs destinations grouped, the theme control, and sign-in on
 * village where an app would show the account. fairtrade draws the phone top
 * bar and drawer.
 */
export function DocsSidebar() {
  const pathname = usePathname();
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");
  const next: Theme = theme === "dark" ? "light" : "dark";

  const groups: AppSidebarGroup[] = [
    ...DOCS_NAV.map((group) => ({
      id: group.id,
      label: group.label ?? undefined,
      ariaLabel: group.label ?? "more",
      items: group.items.map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: ICONS[item.icon],
      })),
    })),
    {
      id: "tools",
      ariaLabel: "theme",
      items: [
        {
          id: "theme",
          label: `${next} mode`,
          title: `use ${next} theme`,
          icon: next === "light" ? Sun : Moon,
          onSelect: () => applyTheme(next, { persist: true }),
        },
      ],
    },
  ];

  return (
    <AppSidebar
      app="docs"
      apps={APPS}
      groups={groups}
      currentId={currentDocsItem(pathname) ?? undefined}
      homeHref="/"
      brand="peasant"
      label="docs"
      LinkComponent={Link}
      accountSlot={
        <a className="dx-login" href={LOGIN_URL}>
          log in
        </a>
      }
    />
  );
}
