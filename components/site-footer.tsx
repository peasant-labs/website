import { InstallLine } from "@/components/landing/get-started";
import { Mark } from "@/components/mark";
import { FOOTER_CTA, FOOTER_NAV } from "@/lib/site";
import Link from "next/link";

/**
 * The footer: first the call to action every page ends with, then the mark and
 * every destination that is not in the header.
 *
 * Other pages end on a compact row. The landing ends on a destination: the
 * mark, the line at display size, install with its first command to copy in
 * place, and the docs, with room above it and below it before the footer's
 * links.
 */
export function SiteFooter({ landing = false }: { landing?: boolean }) {
  const size = landing ? "site-btn-xl" : "site-btn-lg";
  return (
    <footer className="site-foot">
      <div className={`site-foot-cta-row${landing ? " site-foot-close" : ""}`} data-footer-cta>
        <div className="site-wrap site-foot-cta">
          {landing ? <Mark className="site-foot-close-mark" /> : null}
          <p className="site-foot-line">{FOOTER_CTA.line}</p>
          <div className="site-foot-actions">
            <a
              className={`btn btn-primary site-btn ${size}`}
              href={landing ? FOOTER_CTA.primary.landingHref : FOOTER_CTA.primary.href}
            >
              {FOOTER_CTA.primary.label}
            </a>
            {landing ? <InstallLine /> : null}
            <Link className={`btn btn-secondary site-btn ${size}`} href={FOOTER_CTA.secondary.href}>
              {FOOTER_CTA.secondary.label}
            </Link>
          </div>
        </div>
      </div>
      <div className="site-wrap site-foot-inner">
        <Link className="site-brand site-foot-brand" href="/">
          <Mark className="site-brand-mark" />
          peasant
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
