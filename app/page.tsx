import { Art } from "@/components/art";
import { AgentMarquee } from "@/components/landing/agent-marquee";
import { GetStarted } from "@/components/landing/get-started";
import { HeroFlow } from "@/components/landing/hero-flow";
import { LandingIcon } from "@/components/landing/icons";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SessionWindows } from "@/components/landing/session-windows";
import { SessionPhone } from "@/components/landing/session-phone";
import { SessionViewer } from "@/components/landing/session-viewer";
import { UseCases } from "@/components/landing/use-cases";
import { XThread } from "@/components/landing/x-thread";
import { SafariWindow } from "@/components/mac";
import { SiteShell } from "@/components/site-shell";
import { HERO, HOW, INSTALL, SESSION, VISION } from "@/lib/landing";
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
    <SiteShell landing>
      <main id="content" className="lp" tabIndex={-1}>
        <section className="lp-sec lp-hero" aria-labelledby="hero-title">
          <div className="site-wrap lp-hero-inner">
            <h1 id="hero-title" data-fade>
              {/* a hyphenated word stays on one line: "open-" never ends a line on a phone */}
              {HERO.title.split(/(\S+-\S+)/).map((part, index) =>
                index % 2 ? (
                  <span key={part} className="lp-nowrap">
                    {part}
                  </span>
                ) : (
                  part
                ),
              )}
            </h1>
            <p className="lp-lede" data-fade style={fade(1)}>
              {HERO.lede}
            </p>
            <div className="lp-ctas" data-fade style={fade(2)}>
              <a className="btn btn-primary site-btn site-btn-xl" href={HERO.primary.href}>
                {HERO.primary.label}
              </a>
              <a className="btn btn-secondary site-btn site-btn-xl" href={HERO.secondary.href}>
                {HERO.secondary.label}
              </a>
            </div>
            <ul className="lp-pillars" data-fade style={fade(3)}>
              {HERO.pillars.map((pillar) => (
                <li key={pillar.text}>
                  <LandingIcon name={pillar.icon} className="lp-pillar-ic" />
                  {pillar.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="site-wrap lp-hero-flow" data-fade style={fade(4)}>
            <HeroFlow />
          </div>
        </section>

        <AgentMarquee />

        <section id="install" className="lp-sec" aria-labelledby="install-title">
          <div className="site-wrap">
            <div className="lp-head">
              <h2 id="install-title" className="lp-title" data-fade>
                {INSTALL.title}
              </h2>
              <Link className="site-link lp-install-guide" href={INSTALL.guide.href}>
                {INSTALL.guide.label}
              </Link>
            </div>
            <GetStarted />
          </div>
        </section>

        <section id="uses" className="lp-sec" aria-labelledby="uses-title">
          <UseCases />
        </section>

        <section id="how" className="lp-sec lp-how" aria-labelledby="how-title">
          <HowItWorks title={HOW.title} />
        </section>

        <section id="session" className="lp-sec" aria-labelledby="session-title">
          <div className="site-wrap lp-session">
            <div className="lp-head">
              <h2 id="session-title" className="lp-title" data-fade>
                {SESSION.title}
              </h2>
            </div>
            {/* from a tablet's width, the windows; on a phone, a short slice of the session at the column's width */}
            <div className="lp-session-body">
              <div className="lp-session-wide">
                <SessionWindows>
                  <SafariWindow secure className="lp-session-win">
                    <SessionViewer
                      label={SESSION.label}
                      session={SAMPLE_SESSION}
                      title={SESSION.sessionTitle}
                    />
                  </SafariWindow>
                </SessionWindows>
                <div className="lp-session-x">
                  <XThread />
                </div>
              </div>
              <SessionPhone
                label={SESSION.label}
                session={SAMPLE_SESSION}
                prompt={SESSION.phone.prompt}
                turn={SESSION.phone.turn}
                tool={SESSION.phone.tool}
              />
            </div>
          </div>
        </section>

        <section className="lp-sec lp-vision" aria-labelledby="vision-line">
          {/* the statement's own panel: the picture beside the words */}
          <div className="site-wrap">
            <div className="lp-vision-inner">
              <div className="lp-vision-scene">
                <Art art={VISION.art} className="lp-vision-art" />
              </div>
              <div className="lp-vision-words">
                <p id="vision-line" className="lp-vision-line" data-fade>
                  {VISION.line}
                </p>
                {VISION.story.map((paragraph) => (
                  <p key={paragraph} className="lp-vision-story">
                    {paragraph}
                  </p>
                ))}
                <Link
                  className="btn btn-secondary site-btn site-btn-lg lp-vision-cta"
                  href={VISION.cta.href}
                  data-fade
                  style={fade(1)}
                >
                  {VISION.cta.label}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
