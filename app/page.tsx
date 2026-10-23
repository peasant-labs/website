import { Art } from "@/components/art";
import { GetStarted } from "@/components/landing/get-started";
import { HeroFlow } from "@/components/landing/hero-flow";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCases } from "@/components/landing/use-cases";
import { MacWindow } from "@/components/mac";
import { SiteShell } from "@/components/site-shell";
import { TranscriptDemo } from "@/components/transcript-demo";
import { HERO, HOW, INSTALL, SESSION, USE_CASES, VISION } from "@/lib/landing";
import { SAMPLE_SESSION } from "@/lib/sample-session";
import { site } from "@/lib/site";
import "./landing.css";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

/* the place of a revealed element among its siblings: each starts a beat after the last */
function fade(order: number) {
  return { "--fade-i": order } as CSSProperties;
}

export const metadata: Metadata = {
  title: { absolute: site.title },
  description: site.description,
  alternates: { canonical: "/" },
};

/**
 * The landing page, in reading order: what this is, who it is for, how it
 * works, how to start, what a published session looks like, and why.
 */
export default function Home() {
  return (
    <SiteShell>
      <main id="content" className="lp" tabIndex={-1}>
        <section className="lp-sec lp-hero" aria-labelledby="hero-title">
          <div className="site-wrap lp-hero-inner">
            <h1 id="hero-title" data-fade>
              {HERO.title}
            </h1>
            <p className="lp-lede" data-fade style={fade(1)}>
              {HERO.lede}
            </p>
            <div className="lp-ctas" data-fade style={fade(2)}>
              <a className="btn btn-primary site-btn site-btn-xl" href={HERO.primary.href} data-hero-install>
                {HERO.primary.label}
              </a>
              <a className="btn btn-secondary site-btn site-btn-xl" href={HERO.secondary.href}>
                {HERO.secondary.label}
              </a>
            </div>
            <ul className="lp-pillars" data-fade style={fade(3)}>
              {HERO.pillars.map((pillar) => (
                <li key={pillar}>{pillar}</li>
              ))}
            </ul>
          </div>
          <div className="site-wrap lp-hero-flow" data-fade style={fade(4)}>
            <HeroFlow />
          </div>
        </section>

        <section id="uses" className="lp-sec" aria-labelledby="uses-title">
          <div className="site-wrap lp-stack">
            <h2 id="uses-title" data-fade>
              {USE_CASES.title}
            </h2>
            <UseCases />
          </div>
        </section>

        <section id="how" className="lp-sec lp-how" aria-labelledby="how-title">
          <HowItWorks title={HOW.title} />
        </section>

        <section id="install" className="lp-sec" aria-labelledby="install-title">
          <div className="site-wrap lp-stack lp-install">
            <h2 id="install-title" data-fade>
              {INSTALL.title}
            </h2>
            <div className="lp-install-body">
              <GetStarted />
              <Link className="site-link lp-install-guide" href={INSTALL.guide.href}>
                {INSTALL.guide.label}
              </Link>
            </div>
          </div>
        </section>

        <section id="session" className="lp-sec" aria-labelledby="session-title">
          <div className="site-wrap lp-stack lp-session">
            <h2 id="session-title" data-fade>
              {SESSION.title}
            </h2>
            <MacWindow kind="browser" url={`${SESSION.host}/transcripts/${SAMPLE_SESSION.id}`} className="lp-session-win">
              <TranscriptDemo label={SESSION.label} session={SAMPLE_SESSION} />
            </MacWindow>
            <p className="lp-note">{SESSION.note}</p>
          </div>
        </section>

        <section className="lp-sec lp-vision" aria-labelledby="vision-line">
          <Art art={VISION.art} className="lp-vision-art" />
          <div className="site-wrap lp-vision-inner">
            <p id="vision-line" className="lp-vision-line" data-fade>
              {VISION.line}
            </p>
            <Link
              className="btn btn-primary site-btn site-btn-xl"
              href={VISION.cta.href}
              data-fade
              style={fade(1)}
            >
              {VISION.cta.label}
            </Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
