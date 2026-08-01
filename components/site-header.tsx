import { ProjectInteractions } from "@/components/project-client";
import { SiteNav } from "@/components/site-nav";
import Link from "next/link";

/**
 * The one header every non-editorial route wears: the wordmark, the site
 * destinations, and the theme control. It lives in a component rather than a
 * layout so routes outside /projects can mount the same bar.
 */
export function SiteHeader() {
  return (
    <header className="pj-header">
      <div className="pj-header-inner">
        <Link className="pj-brand" href="/projects">
          peasant labs
        </Link>
        <SiteNav />
        <ProjectInteractions />
      </div>
    </header>
  );
}
