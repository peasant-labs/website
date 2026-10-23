import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

export type Link = { label: string; href: string };

export type LandingFixture = {
  version: 1;
  header: { nav: Link[]; login: Link; menu: Link[]; install: Link };
  footer: Link[];
  hero: {
    title: string;
    lede: string;
    pillars: string[];
    primary: { label: string; target: string };
    secondary: { label: string; target: string };
  };
  sections: Array<{ id: string; heading: string }>;
  removed: string[];
  useCases: {
    slideMs: number;
    captionMs: number;
    slides: Array<{ id: string; label: string; sentence: string; capabilities: string[]; cta: Link }>;
  };
  how: {
    steps: Array<{ title: string; body: string }>;
    publishLabel: string;
    finals: Array<{ scene: string; texts: string[] }>;
  };
  install: { platforms: Array<{ label: string; command: string }>; kickstart: string; guide: Link };
  session: { label: string; sessionId: string; note: string; markers: string[] };
  vision: { line: string; cta: Link };
  docsNav: Link[];
  posts: Array<{ slug: string; title: string }>;
};

/** testdata/landing/landing.yaml, the landing's independent oracle */
export function loadLandingFixture(): LandingFixture {
  const root = parse(readFileSync(resolve("testdata/landing/landing.yaml"), "utf8")) as LandingFixture;
  if (root?.version !== 1) {
    throw new Error("testdata/landing/landing.yaml: expected version 1; update the loader with the fixture.");
  }
  for (const slide of root.useCases.slides) {
    if (slide.capabilities.length !== 3) {
      throw new Error(`useCases.slides.${slide.id}: a slide carries exactly three capabilities.`);
    }
  }
  return root;
}

/* the slide the carousel shows: the others, and the copies at the track's ends, are inert */
export function visibleSlide(page: Page) {
  return page.locator('.uc-panel[data-active="true"]');
}

/** a phone, touch and all */
export const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } as const;
