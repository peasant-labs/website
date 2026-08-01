import { SiteHeader } from "@/components/site-header";

/**
 * The fairtrade-themed page frame: header on top, the route's own `<main>`
 * below. `/projects` gets it from its layout; the standalone routes the header
 * links to mount it directly, so every destination in the nav shares one shell.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="project-shell" data-project-shell>
      <SiteHeader />
      {children}
    </div>
  );
}
