"use client";

import { SITE_NAV, type SiteNavSection } from "@/lib/site";
import { GraphSectionNav } from "@peasant-labs/fairtrade/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The header's destination list. It reuses fairtrade's section-nav chrome —
 * the same `.iu-subnav-item` treatment the in-use shells give their section
 * links — so the current page is marked with the system's amber fill rather
 * than a second bespoke style invented for the marketing header.
 */
export function SiteNav() {
  const pathname = usePathname();
  // "/" would prefix-match every route, so home is the only exact comparison.
  const active = SITE_NAV.find((section) =>
    section.href === "/" ? pathname === "/" : pathname.startsWith(section.href),
  );

  return (
    <GraphSectionNav
      sections={SITE_NAV}
      activeId={active?.id}
      hrefFor={(section: SiteNavSection) => section.href}
      LinkComponent={Link}
      className="pj-nav"
      ariaLabel="site"
    />
  );
}
