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

/*
 * One drifting word's lane, pace and starting point, fixed by its place in the list so the server and the
 * browser draw the same field: lanes spread top to bottom, alternate lanes run the other way, and each word
 * starts part-way through its crossing so the field is already full when the section comes into view.
 */
/* the smallest step of 2 or more that visits every lane once before repeating (it shares no factor with the count) */
function laneStep(lanes: number) {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  let step = 2;
  while (step < lanes && gcd(step, lanes) !== 1) step += 1;
  return step < lanes ? step : 1;
}

function drift(index: number) {
  // two words share each lane, half a crossing apart, so every lane always carries one in view
  const lanes = Math.ceil(VISION.drift.length / 2);
  const lane = index % lanes;
  const reverse = lane % 2 === 1;
  // where across the section the word starts: lanes spread by the golden ratio, the lane's second word half a lap on
  const across = ((lane * 0.618) % 1 + (index >= lanes ? 0.5 : 0)) % 1;
  // a reversed animation runs its progress backwards, so its starting progress is the mirror of its place
  const progress = reverse ? 1 - across : across;
  return {
    // lanes in an interleaved order top to bottom, so neighbouring lanes do not hold neighbouring words
    "--lane": `${((lane * laneStep(lanes)) % lanes) / (lanes - 1)}`,
    "--pace": `${80 + ((lane * 37) % 50)}s`,
    "--start": `${-progress.toFixed(3)}`,
    "--size": `${[1.1, 1.6, 1.3, 2, 1.2, 1.45, 1.75, 1.15][lane % 8]}`,
    "--way": reverse ? "reverse" : "normal",
  } as CSSProperties;
}

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
              {HERO.titlePhrases.map((phrase, index) => (
                <span key={phrase} className="lp-hero-phrase">
                  {index > 0 ? " " : ""}{phrase}
                </span>
              ))}
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
            {/* from a tablet's width, the windows; on a phone, a short slice of the session and then the thread that
                shared it, each at the column's width */}
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
              </div>
              <SessionPhone
                label={SESSION.label}
                session={SAMPLE_SESSION}
                prompt={SESSION.phone.prompt}
                turn={SESSION.phone.turn}
                tool={SESSION.phone.tool}
              />
              <XThread chrome={false} className="lp-phone-x" />
            </div>
          </div>
        </section>

        <section className="lp-sec lp-vision" aria-labelledby="vision-line">
          {/* the ideas behind the statement drift faintly across the section, behind everything else */}
          <div className="lp-vision-drift" aria-hidden="true">
            {VISION.drift.map((word, index) => (
              <span key={word} className="lp-drift-word" style={drift(index)}>
                {word}
              </span>
            ))}
          </div>
          {/* the statement and its explanation read together beside the illustration */}
          <div className="site-wrap">
            <div className="lp-vision-inner">
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
              <div className="lp-vision-scene">
                <Art art={VISION.art} className="lp-vision-art" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
