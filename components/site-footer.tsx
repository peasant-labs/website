import { Mark } from "@/components/mark";
import { FOOTER_NAV } from "@/lib/site";
import Link from "next/link";

/** The footer: the mark, then every destination that is not in the header. */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="site-wrap site-foot-inner">
        <Link className="site-brand site-foot-brand" href="/">
          <Mark className="site-brand-mark" />
          peasant labs
        </Link>
        <nav className="site-foot-nav" aria-label="footer">
          {FOOTER_NAV.map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.id} href={item.href}>
                {item.label}
              </Link>
            ) : (
              <a key={item.id} href={item.href}>
                {item.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
