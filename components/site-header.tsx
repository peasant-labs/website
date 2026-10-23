import { Mark } from "@/components/mark";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LOGIN_URL } from "@/lib/site";
import { BrandMark } from "@/components/fairtrade-client";
import Link from "next/link";

/**
 * The one header every marketing route wears: the mark and name, the two
 * sections, the theme control, and sign-in. Sign-in lives on the hosted app,
 * so "log in" leaves this site for it.
 */
export function SiteHeader() {
  return (
    <header className="site-bar">
      <div className="site-wrap site-bar-inner">
        <Link className="site-brand" href="/">
          <Mark className="site-brand-mark" />
          peasant labs
        </Link>
        <SiteNav />
        <div className="site-bar-actions">
          <ThemeToggle />
          <a className="btn btn-secondary site-btn site-login" href={LOGIN_URL}>
            <BrandMark name="github" />
            log in
          </a>
        </div>
      </div>
    </header>
  );
}
