import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * The marketing page frame: header on top, the route's own `<main>` between,
 * footer below. `/projects` gets it from its layout; the standalone routes
 * mount it directly, so every page outside the docs shares one frame.
 */
export function SiteShell({
  children,
  landing = false,
}: {
  children: React.ReactNode;
  /** the landing page: the footer's install stays on the page */
  landing?: boolean;
}) {
  return (
    <div className="project-shell site-shell" data-project-shell>
      <SiteHeader />
      {children}
      <SiteFooter landing={landing} />
    </div>
  );
}
