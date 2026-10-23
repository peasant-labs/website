"use client";

import { SITE_NAV } from "@/lib/site";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The header's destinations. The current section carries `aria-current` and
 * the amber underline, so where you are never rides on colour alone.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav" aria-label="site">
      {SITE_NAV.map((section) => {
        const current = pathname === section.href || pathname.startsWith(`${section.href}/`);
        return (
          <Link
            key={section.id}
            href={section.href}
            className="site-nav-link"
            aria-current={current ? "page" : undefined}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
