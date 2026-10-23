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
  art: art("hero2", "five wheat sheaves in a row, the tallest in the middle in amber", 1200, 512),
} as const;

export type UseCaseCta = Readonly<{ label: string; href: string }>;

/** the drawn icon beside a capability in the caption; the component maps each to a lucide mark */
export type CapabilityIcon =
  | "check"
  | "chart"
  | "class"
  | "pull-request"
  | "history"
  | "conversation"
  | "search"
  | "link"
  | "send"
  | "lock"
  | "code";

export type Capability = Readonly<{ text: string; icon: CapabilityIcon }>;

export type UseCase = Readonly<{
  id: string;
  label: string;
  sentence: string;
  art: Art;
  capabilities: readonly [Capability, Capability, Capability];
  cta: UseCaseCta;
}>;

const SIGN_UP: UseCaseCta = { label: "sign up free", href: LOGIN_URL };

/*
 * The sentences only claim what the product does today: collectives can be
 * members-only and curated, pull requests link to their transcripts through
 * village's check and comment, peasant reads six agents, a collective can admit
 * by GitHub organization, peasant's redaction takes custom patterns, and
 * village is open source and hosted at village.peasantlabs.org.
 */
export const USE_CASES = {
  title: "find your use case",
  /* how long a slide stays before the carousel moves on, and each capability within it */
  slideMs: 6000,
  captionMs: 2000,
  slides: [
    {
      id: "researchers",
      label: "researchers",
      sentence:
        "Build evals and studies from real agent work, shared with consent. Start a private collective for your lab or class.",
      art: art("uc-researchers", "an open book with a quill in an inkwell", 704, 528),
      capabilities: [
        { text: "build evals from real work", icon: "check" },
        { text: "study how agents are used", icon: "chart" },
        { text: "run a class on agents", icon: "class" },
      ],
      cta: SIGN_UP,
    },
    {
      id: "teams",
      label: "teams",
      sentence: "Read the sessions behind a pull request, redacted, one click from the diff.",
      art: art("uc-teams", "a round table with three mugs", 704, 528),
      capabilities: [
        { text: "review the work behind a diff", icon: "pull-request" },
        { text: "onboard from real history", icon: "history" },
        { text: "learn from each other's prompts", icon: "conversation" },
      ],
      cta: SIGN_UP,
    },
    {
      id: "developers",
      label: "developers",
      sentence:
        "Every session with your coding agent, searchable on your computer. Works with Claude Code, Codex, Cursor, OpenCode, Pi and Strike.",
      art: art("uc-developers", "an enchanted quill writing on a floating scroll", 704, 528),
      capabilities: [
        { text: "find any past session", icon: "search" },
        { text: "explain a change in one comment", icon: "link" },
        { text: "publish on every push", icon: "send" },
      ],
      cta: { label: "install now", href: "#install" },
    },
    {
      id: "companies",
      label: "companies",
      sentence:
        "Access can follow your GitHub organization, with redaction rules for your own names. Village is open source, and we host it for you.",
      art: art("uc-companies", "a small two-tower castle with a padlocked gate", 704, 528),
      capabilities: [
        { text: "keep agent data in-house", icon: "lock" },
        { text: "see which commits agents wrote", icon: "code" },
        { text: "usage across teams", icon: "chart" },
      ],
      cta: { label: "talk to us", href: "/contact" },
    },
  ] satisfies readonly UseCase[],
} as const;

export const HOW = {
  title: "how it works",
  /* the window's footnote: the scenes are the real components, trimmed to what each step needs */
  footnote: "simplified view",
  steps: [
    {
      id: "record",
      title: "record",
      body: "Peasant indexes coding agent sessions on your computer. Type /peasant in your harness to open the session in the browser.",
      scene:
        "in Claude Code, /peasant opens the session and peasant answers that it is not published; the sessions list on this computer then shows it at the top",
    },
    {
      id: "review",
      title: "review",
      body: "Before anything leaves, peasant hides secrets, personal details, file paths and internal names, and shows you exactly what it hid.",
      scene:
        "the redaction review finds an AWS key, an email address and a home folder path, and shows each as it will leave, replaced by its placeholder: 3 matches",
    },
    {
      id: "publish",
      title: "publish",
      body: "Share transcripts for code review, radical openness, or transparent research processes.",
      scene:
        "in the publish window, the eval-crowd collective is added to who can read it and publish is pressed; the session is published to eval-crowd",
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
  art: art(
    "vision2",
    "three thatched cottages with three peasants and bundles of wheat between them",
    1200,
    512,
  ),
} as const;
