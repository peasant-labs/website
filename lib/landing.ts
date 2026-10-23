import { LOGIN_URL } from "@/lib/site";

/**
 * Every word and destination on the landing page, in reading order. The
 * components own layout and behaviour; this module owns what they say, so the
 * copy can be reviewed in one place and the tests can read it back.
 */

/** A pair of illustrations, one per theme. Both carry the same alt text. */
export type Art = Readonly<{
  light: string;
  dark: string;
  alt: string;
  width: number;
  height: number;
}>;

function art(name: string, alt: string, width: number, height: number): Art {
  return { light: `/art/${name}-light.png`, dark: `/art/${name}-dark.png`, alt, width, height };
}

export const HERO = {
  title: "data commons built by commoners",
  lede: "Record, publish, and share agent sessions with people you trust.",
  primary: { label: "install now", href: "#install" },
  secondary: { label: "learn more", href: "#how" },
  art: art("hero", "a dithered wheat field, one stalk lit amber among the rest", 1200, 512),
} as const;

export type UseCaseCta = Readonly<{ label: string; href: string }>;

export type UseCase = Readonly<{
  id: string;
  label: string;
  art: Art;
  capabilities: readonly [string, string, string];
  cta: UseCaseCta;
}>;

const SIGN_UP: UseCaseCta = { label: "sign up free", href: LOGIN_URL };

export const USE_CASES = {
  title: "find your use case",
  /* how long each capability holds the caption before the next one fades in */
  captionMs: 3500,
  slides: [
    {
      id: "researchers",
      label: "researchers",
      art: art("uc-researchers", "an open book with a quill resting on it", 704, 528),
      capabilities: [
        "build evals from real work",
        "study how agents are used",
        "run a class on agents",
      ],
      cta: SIGN_UP,
    },
    {
      id: "teams",
      label: "teams",
      art: art("uc-teams", "a round table set with mugs", 704, 528),
      capabilities: [
        "review the work behind a diff",
        "onboard from real history",
        "learn from each other's prompts",
      ],
      cta: SIGN_UP,
    },
    {
      id: "developers",
      label: "developers",
      art: art("uc-developers", "an enchanted quill writing on a floating scroll", 704, 528),
      capabilities: [
        "find any past session",
        "explain a change in one comment",
        "publish on every push",
      ],
      cta: { label: "install now", href: "#install" },
    },
    {
      id: "companies",
      label: "companies",
      art: art("uc-companies", "a small stone castle", 704, 528),
      capabilities: [
        "keep agent data in-house",
        "see which commits agents wrote",
        "usage across teams",
      ],
      cta: { label: "talk to us", href: "/contact" },
    },
  ] satisfies readonly UseCase[],
} as const;

export const HOW = {
  title: "how it works",
  /* the window's footnote: the scenes are drawings of the product, not captures of it */
  footnote: "simplified view",
  steps: [
    {
      id: "record",
      title: "record",
      body: "Peasant indexes coding agent sessions on your computer. Type /peasant in your harness to open the session in the browser.",
      window: "terminal",
      scene:
        "a terminal runs peasant harvest and indexes 3 sessions on this computer with nothing uploaded, then /peasant opens the session in the browser",
    },
    {
      id: "review",
      title: "review",
      body: "Before anything leaves, peasant hides secrets, personal details, file paths and internal names, and shows you exactly what it hid.",
      window: "peasant on this computer",
      scene:
        "a scan passes over three lines; an api key, an email address and a file path become blocks labelled secrets, pii and paths, and a badge counts 3 hidden",
    },
    {
      id: "publish",
      title: "publish",
      body: "Share transcripts for code review, radical openness, or transparent research processes.",
      window: "peasant on this computer",
      scene:
        "in the publish dialog the cursor picks the eval-crowd collective, ticks share it (redacted) and presses publish; a row confirms published to eval-crowd",
    },
  ],
} as const;

/** The two commands, exactly as the installer scripts document themselves. */
export const INSTALL = {
  title: "get started in two commands",
  guide: { label: "read the install guide", href: "/docs#install" },
  platforms: [
    {
      id: "unix",
      label: "macos and linux",
      command: "curl -fsSL https://peasantlabs.org/install | bash",
    },
    {
      id: "windows",
      label: "windows",
      command: "irm https://peasantlabs.org/install.ps1 | iex",
    },
  ],
  kickstart: "peasant kickstart",
} as const;

export const SESSION = {
  title: "what a reviewer reads",
  label: "sample session in the transcript viewer",
  note: "Sample session, not a real record. Values peasant redacted show as markers like <EMAIL>.",
} as const;

export const VISION = {
  line: "We are building a sustainable, respectful ecosystem where people have a stake in their data.",
  cta: { label: "about us", href: "/about" },
  art: art("vision", "a small feudal village where peasants farm a shared field", 1200, 512),
} as const;
