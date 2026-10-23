"use client";

import { currentDocsItem, DOCS_NAV, type DocsIcon } from "@/lib/docs";
import { LOGIN_URL } from "@/lib/site";
import { applyTheme, currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { BookOpen, FileText, FlaskConical, GitPullRequest } from "@peasant-labs/fairtrade/icons";
import { AppSidebar, APP_SIDEBAR_APPS, type AppSidebarGroup } from "@peasant-labs/fairtrade/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentType } from "react";
import { OnlineAccount } from "@/components/online-link";

const ICONS: Record<DocsIcon, ComponentType> = {
  overview: BookOpen,
  evals: FlaskConical,
  reviews: GitPullRequest,
  blog: FileText,
};

/* where each app lives; the docs are this one */
const APP_HREFS: Record<string, string> = {
  online: "https://village.peasantlabs.org",
  local: "http://localhost:8690",
  docs: "/docs",
};

/* the other apps, then a place that does not exist yet; fairtrade leaves the current app out */
const APPS = [
  ...APP_SIDEBAR_APPS.map((app) => ({ ...app, href: APP_HREFS[app.id] })),
  { id: "community", label: "community", tag: "soon" },
];

/**
 * The docs app's sidebar: fairtrade's shared AppSidebar in its one order, the
 * same as the online and local apps: the mark, the docs pages, the switcher to
 * the other apps, then the footer with the theme toggle and the account row,
 * which is "log in", or "open online" for a reader signed in there. fairtrade
 * draws the phone top bar and drawer. A page's own sections are in its "on
 * this page" list, not here.
 */
export function DocsSidebar() {
  const pathname = usePathname();
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");

  const groups: AppSidebarGroup[] = DOCS_NAV.map((group) => ({
    id: group.id,
    label: group.label ?? undefined,
    ariaLabel: group.ariaLabel,
    items: group.items.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: ICONS[item.icon],
    })),
  }));

  return (
    <AppSidebar
      app="docs"
      apps={APPS}
      groups={groups}
      currentId={currentDocsItem(pathname) ?? undefined}
      homeHref="/"
      brand="peasant"
      label="docs"
      theme={theme}
      onThemeChange={(next: Theme) => applyTheme(next, { persist: true })}
      LinkComponent={Link}
      accountSlot={
        <>
          <a className="dx-login site-login" href={LOGIN_URL}>
            log in
          </a>
          <OnlineAccount />
        </>
      }
    />
  );
}
