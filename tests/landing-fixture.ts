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
    tagRows: Array<{ width: number; rows: number[] }>;
    flow: { agents: string[]; groundedFrames: number[]; journeyFrames: Array<{ name: string; time: number }>; layouts: Array<{ name: string; interaction: boolean; width: number; colorScheme: "light" | "dark"; raisedGap: number; frontDepth: number; titleLines: string[]; missionBeside: boolean; missionArtMax: number }> };
    primary: { label: string; target: string };
    secondary: { label: string; target: string };
  };
  agents: { label: string; names: string[] };
  sections: Array<{ id: string; heading: string }>;
  removed: string[];
  useCases: {
    shape: Array<{ width: number; card: [number, number]; headline: number }>;
    detailLines: number;
    more: { tag: string; text: string; detail: string; picture: string; cta: Link };
    slides: Array<{
      id: string;
      label: string;
      capabilities: string[];
      details: string[];
      pictures: string[];
    }>;
  };
  how: {
    steps: Array<{ title: string; body: string }>;
    publishLabel: string;
    readable: { wide: number; phone: number };
    finals: Array<{ scene: string; texts: string[] }>;
  };
  install: {
    platforms: Array<{ label: string; command: string }>;
    kickstart: string;
    push: string;
    notes: string[];
    guide: Link;
    installGuide: Link;
    phoneWidths: number[];
  };
  session: {
    windows: { widths: number[]; frontMinRatio: number; frontMaxRatio: number; terminalExposedMin: number; socialOverlapMax: number };
    terminalBodyMin: number;
    terminalTextMin: number;
    sharedBodyMin: number;
    label: string;
    title: string;
    sessionId: string;
    author: string;
    endedAgo: string;
    terminal: string;
    firstAsk: string;
    figures: { model: string; inputSubmissionCount: number; totalTokens: number };
    phone: {
      widths: number[];
      headingLevel: number;
      prompt: string;
      tool: string;
      key: string;
      marker: string;
      commit: string;
      stat: string;
    };
    tabs: string[];
    markers: string[];
  };
  card: { figures: { prompts: number; tokens: number } };
  graphs: Array<{ name: string; path: string; selector: string; width: number; theme: "light" | "dark" }>;
  thread: {
    label: string;
    posts: Array<{ name: string; handle: string; time: string; text: string }>;
    actions: string[];
    face: string;
    chart: Array<{ label: string; value: number }>;
    from: string;
    phone: { postText: number; cardPrompt: number; promptWord: string };
  };
  vision: { line: string; story: string[]; cta: Link; artMax: number };
  docsNav: Link[];
  posts: Array<{ slug: string; title: string }>;
};

/** testdata/landing/landing.yaml, the landing's independent oracle */
export function loadLandingFixture(): LandingFixture {
  const root = parse(readFileSync(resolve("testdata/landing/landing.yaml"), "utf8")) as LandingFixture;
  if (root?.version !== 1) {
    throw new Error("testdata/landing/landing.yaml: expected version 1; update the loader with the fixture.");
  }
  const requiredJourneyFrames = ["screen", "scan", "flight", "crest", "landed", "settled"];
  const requiredGraphs = ["landing-light", "landing-dark", "projects-light", "projects-dark"];
  if (JSON.stringify(root.graphs?.map((graph) => graph.name)) !== JSON.stringify(requiredGraphs)) {
    throw new Error("The graph fixture must retain both real viewer hosts in both themes.");
  }
  if (JSON.stringify(root.hero.flow.journeyFrames?.map((frame) => frame.name)) !== JSON.stringify(requiredJourneyFrames)) {
    throw new Error("The hero fixture must retain every named stage of the card journey.");
  }
  const requiredHeroLayouts = ["phone-light", "phone-dark", "tablet-light", "tablet-dark", "desktop-light", "desktop-dark"];
  if (JSON.stringify(root.hero.flow.layouts.map((layout) => layout.name)) !== JSON.stringify(requiredHeroLayouts)) {
    throw new Error("The hero fixture must retain both themes on phone, tablet and desktop.");
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
