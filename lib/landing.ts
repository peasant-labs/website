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

/*
 * The hero says the mission in the owner's words: the open-source commons for
 * agent transcripts. The tags name the four promises the product stands on by
 * what backs each one: sessions stay on the computer, peasant and village are
 * Apache-2.0, the same flow serves every harness peasant reads, and harvesting
 * skips sessions that have not changed. The lede claims that nothing leaves
 * until it is published, and that a contributor's handle shows on their
 * transcripts unless they turn that off.
 */
export const HERO = {
  title: "the open-source commons for agent transcripts",
  lede: "Peasant keeps your coding agent sessions on your computer. When you publish one, it is redacted there first and shared under your handle, only with the collectives you pick.",
  pillars: [
    { text: "local first", icon: "laptop" },
    { text: "open source", icon: "code" },
    { text: "agent-agnostic", icon: "bot" },
    { text: "incremental indexing", icon: "layers" },
  ],
  primary: { label: "install now", href: "#install" },
  secondary: { label: "learn more", href: "#how" },
  /*
   * The picture under the buttons tells its story without words, so its
   * accessible name says it: a card lifts out of the laptop, a sieve turns its
   * secret amber, a stamp marks it published, and it settles on the shared
   * stack where a small group stands. There is no reputation score: the one
   * who lights up as it lands is the person it is credited to.
   */
  flow: {
    label:
      "A transcript card lifts out of a laptop running Claude Code, Codex, Cursor, OpenCode, Pi and Strike, glides through a sieve that turns its secret line amber, is stamped as you publish it, and settles on a shared stack beside a small group of people: the commons. As it lands, one of them, you, lights up amber.",
    agents: [
      { mark: "claude", name: "Claude Code" },
      { mark: "codex", name: "Codex" },
      { mark: "cursor", name: "Cursor" },
      { mark: "opencode", name: "OpenCode" },
      { mark: "pi", name: "Pi" },
      { mark: "strike", name: "Strike" },
    ],
    pause: "pause the animation",
    play: "play the animation",
  },
} as const;

/*
 * The band under the hero: the harnesses peasant reads, each led by its mark.
 * The names are the products' own; the list is what peasant ingests today.
 */
export const AGENTS = {
  label: "works with",
  list: [
    { mark: "claude", name: "Claude Code" },
    { mark: "codex", name: "Codex" },
    { mark: "cursor", name: "Cursor" },
    { mark: "opencode", name: "OpenCode" },
    { mark: "pi", name: "Pi" },
    { mark: "strike", name: "Strike" },
  ],
} as const;

export type UseCaseCta = Readonly<{ label: string; href: string }>;

/** a drawn icon beside an audience, a capability or a step; components/landing/icons maps each to a lucide mark */
export type LandingIconName =
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
  | "code"
  | "research"
  | "team"
  | "terminal"
  | "company"
  | "record"
  | "review"
  | "laptop"
  | "bot"
  | "layers";

/** a capability: its headline, one or two sentences on what it is, and its own picture, which shows while it does */
export type Capability = Readonly<{ text: string; detail: string; icon: LandingIconName; art: Art }>;

export type UseCase = Readonly<{
  id: string;
  label: string;
  icon: LandingIconName;
  capabilities: readonly [Capability, Capability, Capability];
  cta: UseCaseCta;
}>;

const SIGN_UP: UseCaseCta = { label: "sign up free", href: LOGIN_URL };

/* every use-case picture is drawn on the same 704 by 528 grid */
function capabilityArt(name: string, alt: string): Art {
  return art(name, alt, 704, 528);
}

/*
 * Each audience leads with what it can do, one capability at a time; the
 * capabilities only claim what the product does today. The audience is a
 * label, and its one action closes the card.
 */
export const USE_CASES = {
  title: "find your use case",
  /* how long each capability, its words and its picture, shows before its audience moves on to the next */
  captionMs: 6000,
  slides: [
    {
      id: "researchers",
      label: "researchers",
      icon: "research",
      capabilities: [
        {
          text: "build evals from real work",
          detail:
            "Gather redacted transcripts of real coding work in a private collective, as source material for your evals.",
          icon: "check",
          art: capabilityArt("uc-balance", "a balance scale with an amber weight in its right pan"),
        },
        {
          text: "study how agents are used",
          detail:
            "Read how people prompt, steer and correct their agents in the transcripts published to your collective.",
          icon: "chart",
          art: capabilityArt("uc-book", "an open book on a stand with an amber ribbon bookmark"),
        },
        {
          text: "run a class on agents",
          detail:
            "Students publish their sessions to your class's collective, so you can see how each worked with an agent.",
          icon: "class",
          art: capabilityArt("uc-slate", "a slate on an easel with an amber apple on its ledge"),
        },
      ],
      cta: SIGN_UP,
    },
    {
      id: "teams",
      label: "teams",
      icon: "team",
      capabilities: [
        {
          text: "review the work behind a diff",
          detail:
            "Link the transcripts behind a pull request's commits, so reviewers in your collective read how it was made.",
          icon: "pull-request",
          art: capabilityArt("uc-lens", "an amber magnifying glass held up to a page"),
        },
        {
          text: "onboard from real history",
          detail:
            "New teammates read the transcripts behind past pull requests to learn how and why the code got this way.",
          icon: "history",
          art: capabilityArt("uc-signpost", "a signpost with three arrows, the top one amber"),
        },
        {
          text: "learn from each other's prompts",
          detail:
            "See how teammates prompt and steer their agents, and reuse what works.",
          icon: "conversation",
          art: capabilityArt("uc-candles", "one candle leaning over to light another, both flames amber"),
        },
      ],
      cta: SIGN_UP,
    },
    {
      id: "developers",
      label: "developers",
      icon: "terminal",
      capabilities: [
        {
          text: "find any past session",
          detail:
            "Peasant indexes sessions from the agents it supports on this computer, so you can search them and open one.",
          icon: "search",
          art: capabilityArt("uc-lantern", "a lantern with amber glass"),
        },
        {
          text: "explain a change in one comment",
          detail:
            "Comment /peasant attach on a pull request, then confirm, to link your transcripts that match its commits.",
          icon: "link",
          art: capabilityArt("uc-door", "an arched door with an amber note pinned to it"),
        },
        {
          text: "publish on every push",
          detail:
            "Each time you push, a git hook publishes the repository's sessions, redacted, to the collectives you chose.",
          icon: "send",
          art: capabilityArt("uc-bell", "an amber town crier's handbell"),
        },
      ],
      cta: { label: "install now", href: "#install" },
    },
    {
      id: "companies",
      label: "companies",
      icon: "company",
      capabilities: [
        {
          text: "keep agent data in-house",
          detail:
            "Only your collective's members can read its transcripts, and joining can be limited to your GitHub org.",
          icon: "lock",
          art: capabilityArt("uc-chest", "a closed chest with an amber padlock"),
        },
        {
          text: "see which commits agents wrote",
          detail:
            "Peasant links a session to the commits made while it ran, so a change traces back to its transcript.",
          icon: "code",
          art: capabilityArt("uc-scroll", "a written scroll with an amber wax seal"),
        },
        {
          text: "usage across teams",
          detail:
            "A collective lists each transcript's contributor, agent and turns, with token and pull request totals.",
          icon: "chart",
          art: capabilityArt("uc-sacks", "three tied sacks rising in height like a bar chart, the tallest amber"),
        },
      ],
      cta: { label: "talk to us", href: "mailto:hello@peasantlabs.org" },
    },
  ] satisfies readonly UseCase[],
} as const;

export const HOW = {
  title: "how it works",
  steps: [
    {
      id: "record",
      title: "record",
      icon: "record",
      body: "Peasant indexes coding agent sessions on your computer. Type /peasant in your harness to open the session in the browser.",
      scene:
        "in Claude Code in Terminal, /peasant is typed and peasant answers that it opened the session, not published; Safari then comes forward on the session's page, with publish as its one action",
    },
    {
      id: "review",
      title: "review",
      icon: "review",
      body: "Before anything leaves, peasant hides secrets, personal details, file paths and internal names, and shows you exactly what it hid.",
      scene:
        "the redaction review finds an AWS key, an email address and a home folder path, and shows each as it will leave, replaced by its placeholder: 3 matches",
    },
    {
      id: "publish",
      title: "publish",
      icon: "send",
      body: "Share transcripts for code review, radical openness, or transparent research processes.",
      scene:
        "on the session's page, publish opens the publish window; the eval-crowd collective is added to who can read it and publish is pressed; the window closes and the session is published to eval-crowd",
    },
  ],
} as const;

/** The two commands, exactly as the installer scripts document themselves. */
export const INSTALL = {
  title: "get started in two commands",
  guide: { label: "read our docs", href: "/docs" },
  /* each platform's commands are typed at its own shell's prompt, in a Terminal window titled for that shell */
  platforms: [
    {
      id: "unix",
      label: "macos and linux",
      command: "curl -fsSL https://peasantlabs.org/install | bash",
      title: "you — -zsh — 80×24",
      prompt: "you@macbook ~ %",
    },
    {
      id: "windows",
      label: "windows",
      command: "irm https://peasantlabs.org/install.ps1 | iex",
      title: "you — pwsh — 80×24",
      prompt: "PS C:\\Users\\you>",
    },
  ],
  kickstart: "peasant kickstart",
} as const;

/*
 * One session in three windows: Claude Code where it was recorded, the
 * published transcript in front, and the pull request's check over its corner.
 * The check's name and summary are village's own
 * (backend/internal/digest/render.go), for this sample's one transcript and its
 * one commit.
 */
export const SESSION = {
  title: "what a reviewer reads",
  /* the short title the reel shows for the sample, the way a curated page names a session */
  sessionTitle: "fix the staging 403",
  /*
   * The reel's beats, read from the sample session (lib/sample-session.ts): the
   * ask, the tool call whose result carries a redaction marker, the edit and the
   * commit it became, and the answer it ended on with the session's outcome.
   * `point` is where the reel's pointer rests on each. Each description says what
   * the beat shows, for the one image the stage is to assistive technology.
   */
  reel: [
    {
      id: "prompt",
      label: "the prompt",
      turn: 0,
      point: "a 403",
      description: "the prompt: Uploads to staging fail with a 403 since this morning. Can you find out why?",
    },
    {
      id: "tool",
      label: "a tool call",
      turn: 1,
      tool: "tc_read_env",
      point: "<AWS_ACCESS_KEY>",
      description: "a tool call: Claude reads .env, and the access key in it shows as <AWS_ACCESS_KEY>, redacted",
    },
    {
      id: "change",
      label: "the change",
      turn: 3,
      tool: "tc_edit_upload",
      with: "commit",
      point: ".reel-commit",
      description:
        "the change: scripts/upload.ts signs with a profile per environment, committed as use a per-environment aws profile for build uploads",
    },
    {
      id: "outcome",
      label: "the outcome",
      turn: 6,
      with: "outcome",
      point: ".reel-outcome",
      description: "the outcome, resolved: rotate the old key in the production account and remove it from .env",
    },
  ],
  label: "a sample session, beat by beat",
  terminal: "shop — claude — 80×24",
  check: {
    label: "the pull request's peasant check",
    name: "peasant / prompts",
    summary: "1 transcript traces 1 of 1 commits",
  },
} as const;

export const VISION = {
  line: "We are building a sustainable, respectful ecosystem where people have a stake in their data.",
  cta: { label: "about us", href: "/about" },
  art: art(
    "vision3",
    "a cottage beside two peasants who carry one basket of grain between them, the basket in amber",
    1200,
    512,
  ),
} as const;

/*
 * The picture that closes the landing, beside its last line and its two
 * buttons: an open gate, in the same dithered family as the use-case pictures.
 */
export const CLOSE = {
  art: art("p-open", "an open wooden gate with an amber latch", 704, 528),
} as const;
