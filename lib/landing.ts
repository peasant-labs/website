
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
 * agent transcripts. Everything under it is in plain words. The tags name the
 * four promises the product stands on: a session is shared only with the
 * people its owner permits, peasant and village are Apache-2.0, peasant reads
 * six agents' sessions, and a published session stays credited to the person
 * who made it. The
 * lede says where the sessions come from (the agents write them, peasant
 * gathers them) and that secrets and personal details are hidden on the
 * computer before a session is shared.
 */
export const HERO = {
  title: "the open-source commons for agent transcripts",
  titlePhrases: ["the open-source", "commons for", "agent transcripts"],
  lede: "Peasant gathers the sessions your coding agents save on your computer. Before you share one, Peasant hides its secrets and personal details.",
  pillars: [
    { text: "permissioned sharing", icon: "lock" },
    { text: "open source", icon: "code" },
    { text: "works with many agents", icon: "bot" },
    { text: "data attribution", icon: "stamp" },
  ],
  primary: { label: "install now", href: "#install" },
  secondary: { label: "learn more", href: "#how" },
  /* The accessible description follows the computer-to-printing-workshop scene. */
  flow: {
    label:
      "A modern computer cycles through the Claude Code, Codex and Cursor logos. One transcript forms on its screen, travels into a medieval timber printing press and is stamped by a printer beside two village readers.",
    agents: [
      { mark: "claude", name: "Claude Code" },
      { mark: "codex", name: "Codex" },
      { mark: "cursor", name: "Cursor" },
    ],
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
  | "bot"
  | "zap"
  | "book"
  | "stamp";

/** a capability: its headline, one or two sentences on what it is, and its own picture, which shows while it does */
export type Capability = Readonly<{ text: string; detail: string; icon: LandingIconName; art: Art }>;

export type UseCase = Readonly<{
  id: string;
  label: string;
  icon: LandingIconName;
  capabilities: readonly Capability[];
}>;

/* every use-case picture is drawn on the same 704 by 528 grid */
function capabilityArt(name: string, alt: string): Art {
  return art(name, alt, 704, 528);
}

/*
 * Each capability is a card of its own in one row, tagged with its audience;
 * the capabilities only claim what the product does today. Only the last card,
 * the one that leads on to the docs, carries an action.
 */
export const USE_CASES = {
  title: "find your use case",
  /* the row of capabilities, as assistive technology names it */
  label: "use cases",
  /*
   * how far the row drifts on its own, in pixels a second: slow enough to read a card as it passes,
   * and half a pixel a frame at 60 frames a second, so it moves on an even beat on any screen
   */
  speed: 30,
  /* after the capabilities, one card that leads on to the docs, in the same shape */
  more: {
    tag: "docs",
    icon: "book",
    text: "explore more in the docs",
    detail: "Set up Peasant and explore guides for evals and pull request reviews.",
    cta: { label: "read our docs", href: "/docs" },
    art: capabilityArt("uc-docs", "an open book with written pages, one line in amber"),
  },
  slides: [
    {
      id: "researchers",
      label: "researchers",
      icon: "research",
      capabilities: [
        {
          text: "build evals from real work",
          detail:
            "Collect real coding transcripts and turn them into evaluation suites.",
          icon: "check",
          art: capabilityArt("uc-balance", "a balance scale with an amber weight in its right pan"),
        },
        {
          text: "study how agents are used",
          detail:
            "Review how people actually talk to their agents.",
          icon: "chart",
          art: capabilityArt("uc-book", "an open book on a stand with an amber ribbon bookmark"),
        },
        {
          text: "run a class with open agent use",
          detail:
            "Students publish their sessions to your class's collective, so you can see how each worked with an agent.",
          icon: "class",
          art: capabilityArt("uc-slate", "a slate on an easel with an amber apple on its ledge"),
        },
      ],
    },
    {
      id: "teams",
      label: "teams",
      icon: "team",
      capabilities: [
        {
          text: "explain the work behind a PR",
          detail:
            "Attach the prompts behind your pull request, so your team can read how the change was made.",
          icon: "pull-request",
          art: capabilityArt("uc-lens", "an amber magnifying glass held up to a page"),
        },
        {
          text: "onboard from real history",
          detail:
            "Agents of new teammates read transcripts behind past pull requests to learn why the code looks the way it does.",
          icon: "history",
          art: capabilityArt("uc-signpost", "a signpost with three arrows, the top one amber"),
        },
        {
          text: "learn from each other's prompts",
          detail:
            "Read how your teammates used their agents in the transcripts they share, and reuse what works.",
          icon: "conversation",
          art: capabilityArt("uc-candles", "one candle leaning over to light another, both flames amber"),
        },
      ],
    },
    {
      id: "developers",
      label: "developers",
      icon: "terminal",
      capabilities: [
        {
          text: "find any past session",
          detail:
            "Search and open your past sessions from supported agents, all kept on your computer.",
          icon: "search",
          art: capabilityArt("uc-lantern", "a lantern with amber glass"),
        },
        {
          text: "license your work",
          detail: "Attach licenses to your transcripts under CC0, CC BY, CC BY-SA, or other.",
          icon: "stamp",
          art: capabilityArt("uc-scroll", "a written scroll with an amber wax seal"),
        },
      ],
    },
    {
      id: "auditors",
      label: "auditors",
      icon: "search",
      capabilities: [
        {
          text: "see where the human is",
          detail:
            "Inspect prompts, corrections, and steering for safety and evaluation purposes.",
          icon: "review",
          art: capabilityArt("uc-bell", "an amber town crier's handbell"),
        },
      ],
    },
    {
      id: "enterprise",
      label: "enterprise",
      icon: "company",
      capabilities: [
        {
          text: "start a private collective",
          detail:
            "Create a private collective for your development team, class or lab.",
          icon: "lock",
          art: capabilityArt("uc-chest", "a closed chest with an amber padlock"),
        },
        {
          text: "host it yourself",
          detail: "Self-host village on your own servers, so your transcripts never leave infrastructure you control.",
          icon: "company",
          art: capabilityArt("uc-door", "an arched door with an amber note pinned to it"),
        },
      ],
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
      body: "Peasant reads coding agent sessions on your computer.",
      scene:
        "in Claude Code in Terminal, /peasant is typed and peasant answers that it opened the session, not published; Safari then comes forward on the session's page, with publish as its one action",
    },
    {
      id: "review",
      title: "review",
      icon: "review",
      body: "Before anything leaves your computer, peasant hides keys, personal details, file paths and project names, and shows you what it hid.",
      scene:
        "the redaction review finds an AWS key, an email address and a home folder path, and shows each as it will leave, replaced by its placeholder: 3 matches",
    },
    {
      id: "publish",
      title: "publish",
      icon: "send",
      body: "Pick who can read it, like your team or a research group, and publish. Nothing leaves until you do.",
      scene:
        "on the session's page, publish opens the publish window; the eval-crowd collective is added to who can read it and publish is pressed; the window closes and the session is published to eval-crowd",
    },
  ],
} as const;

/** Install and start local setup, then ask the agent to open the session locally. */
export const INSTALL = {
  title: "install, then open a session",
  guide: { label: "more ways to install and run", href: "/docs#install" },
  platforms: [
    { id: "unix", label: "macos and linux", command: "curl -fsSL https://peasantlabs.org/install | bash -s -- --kickstart", note: "installs Peasant and starts setup" },
    { id: "windows", label: "windows", command: "irm https://peasantlabs.org/install.ps1 | iex", note: "then run the kickstart command printed in your terminal" },
  ],
  prompt: "Open this session in Peasant.",
  actions: ["paste in your terminal", "ask your agent"],
} as const;

/*
 * One session in three windows: Claude Code where it was recorded, the
 * published transcript in front, and the pull request's check over its corner.
 * The check's name and summary are village's own
 * (backend/internal/digest/render.go), for this sample's one transcript and its
 * one commit.
 */
export const SESSION = {
  title: "a new standard for transcript sharing, viewing, and attribution",
  /* the short title the transcript browser shows for the sample, the way a curated page names a session */
  sessionTitle: "rewrite billing retries",
  /* how long before the reader arrived the sample ended, so its relative times read as today's work */
  endedAgoMinutes: 50,
  label: "a sample session",
  /*
   * On a phone, the session's slice instead of the windows: the prompt, the
   * turn that read .env with that tool call open on its redacted key (by its
   * id), then the commit (lib/sample-session.ts).
   */
  phone: { prompt: 0, turn: 1, tool: "tc_read_env" },
  terminal: "billing — claude — 80×24",
} as const;

/*
 * The thread beside the windows, drawn as X draws it: mira posts a benchmark
 * of the sample's three models, a reply asks for the prompt, and her answer is
 * only the transcript's link preview. The chart's bars are the pass rates in
 * the sample's own results table (lib/sample-session.ts), oldest model first.
 * Counts are as X shows them: none beside an action nobody took. Each time is
 * the post's age, newer down the thread, and every post comes after the
 * sample ended (SESSION.endedAgoMinutes).
 */
export const THREAD = {
  /* how assistive technology names the whole thread */
  label: "a thread on X sharing the transcript",
  posts: [
    {
      name: "mira",
      handle: "@mira_builds",
      time: "40m",
      text: "I ran some experiments with the new Opus 5.5. here's how it did vs the last two models",
      counts: { reply: "24", repost: "31", like: "412", views: "18K" },
    },
    {
      name: "doofus",
      handle: "@doofuslord69",
      time: "25m",
      text: "wat prompt did u use",
      counts: { reply: "1", repost: "", like: "57", views: "3.2K" },
    },
    {
      name: "mira",
      handle: "@mira_builds",
      time: "18m",
      text: "",
      counts: { reply: "3", repost: "9", like: "96", views: "2.4K" },
    },
  ],
  chart: {
    title: "billing retry suite, pass rate",
    bars: [
      { label: "model A", value: 71 },
      { label: "model B", value: 83 },
      { label: "Opus 5.5", value: 94 },
    ],
  },
  /* the line X writes under a link's card */
  from: "From village.peasantlabs.org",
} as const;

/*
 * The owner's statement, word for word, in three paragraphs: the first is the
 * lead line; the other two say why. Short contexts keep only the lead line.
 */
export const VISION = {
  line: "We are building a sustainable, respectful ecosystem where people have a stake in the data they produce.",
  story: [
    "Peasants once worked shared land, until it was fenced off and sold. The work we do with AI is being fenced off the same way: every question, fix and judgment you make with an agent is becoming part of someone else's capital.",
    "We think the work also belongs to the people who did it: everyone. Using Peasant, what you choose to give goes into a commons others can use. Help us build a traceable, open research ecosystem!",
  ],
  cta: { label: "about us", href: "/about" },
  art: art(
    "vision3",
    "two peasants carrying a basket of grain between them, its rim in amber, in front of a cottage, with a wheat sheaf beside them",
    880,
    880,
  ),
} as const;

/** The landing's closing invitation, followed only by installation and docs. */
export const CLOSE = {
  line: "you’ve already done the work. now decide where it goes.",
} as const;
