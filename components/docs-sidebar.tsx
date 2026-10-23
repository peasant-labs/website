"use client";

import { currentDocsItem, DOCS_NAV, type DocsIcon } from "@/lib/docs";
import { LOGIN_URL } from "@/lib/site";
import { applyTheme, currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { BookOpen, FileText, FlaskConical, GitPullRequest } from "@peasant-labs/fairtrade/icons";
import { AppSidebar, type AppSidebarGroup } from "@peasant-labs/fairtrade/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentType } from "react";
import { useDocsSearch } from "@/components/docs/docs-search";
import { OnlineAccount } from "@/components/online-link";

const ICONS: Record<DocsIcon, ComponentType> = {
  overview: BookOpen,
  evals: FlaskConical,
  reviews: GitPullRequest,
  blog: FileText,
};

/**
 * The docs app's sidebar: fairtrade's shared AppSidebar in its one order, the
 * same as the online and local apps: the mark, the shortcuts (search, then the
 * switcher, where fairtrade lists no other app, only community as soon), the
 * docs pages, then the footer with the account row, which is "log in", or
 * "dashboard" for a reader signed in there, and the theme toggle. fairtrade
 * draws the phone top bar and drawer. A page's own sections are in its "on
 * this page" list, not here.
 */
export function DocsSidebar() {
  const pathname = usePathname();
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");
  const search = useDocsSearch();

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
      groups={groups}
      currentId={currentDocsItem(pathname) ?? undefined}
      homeHref="/"
      brand="peasant"
      label="docs"
      search={{ onOpen: search.open, label: "search", shortcut: "⌘K", keyShortcuts: "Meta+K Control+K /" }}
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
