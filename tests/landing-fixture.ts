import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

export type Link = { label: string; href: string };

export type LandingFixture = {
  version: 1;
  header: { nav: Link[]; login: Link; menu: Link[] };
  footer: {
    cta: { line: string; primary: Link & { landingHref: string }; secondary: Link };
    nav: Link[];
  };
  hero: {
    title: string;
    lede: string;
    pillars: string[];
    flow: { agents: string[]; pause: string; play: string };
    primary: { label: string; target: string };
    secondary: { label: string; target: string };
  };
  agents: { label: string; names: string[] };
  sections: Array<{ id: string; heading: string }>;
  removed: string[];
  useCases: {
    slides: Array<{
      id: string;
      label: string;
      capabilities: string[];
      details: string[];
      pictures: string[];
      cta: Link;
    }>;
  };
  how: {
    steps: Array<{ title: string; body: string }>;
    publishLabel: string;
    finals: Array<{ scene: string; texts: string[] }>;
  };
  install: {
    platforms: Array<{ label: string; command: string }>;
    kickstart: string;
    push: string;
    notes: string[];
    guide: Link;
  };
  session: {
    label: string;
    title: string;
    sessionId: string;
    tabs: string[];
    tour: { tool: string; marker: string };
    check: { name: string; summary: string };
    markers: string[];
  };
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
  const pictures = new Set<string>();
  for (const slide of root.useCases.slides) {
    if (slide.capabilities.length !== 3) {
      throw new Error(`useCases.slides.${slide.id}: a slide carries exactly three capabilities.`);
    }
    if (slide.details?.length !== slide.capabilities.length) {
      throw new Error(`useCases.slides.${slide.id}: each capability carries its own words.`);
    }
    if (slide.pictures?.length !== slide.capabilities.length) {
      throw new Error(`useCases.slides.${slide.id}: each capability names its own picture.`);
    }
    for (const picture of slide.pictures) {
      if (pictures.has(picture)) throw new Error(`useCases.slides.${slide.id}: ${picture} is used twice.`);
      pictures.add(picture);
    }
  }
  return root;
}



/** a phone, touch and all */
export const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } as const;
