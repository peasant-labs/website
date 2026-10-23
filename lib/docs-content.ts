import type { Art } from "@/lib/landing";
import type { RedactionCategory } from "@peasant-labs/fairtrade/ui";

/**
 * The docs copy. Every command and claim is taken from the product's own
 * sources, and the source is noted beside it so a change there has an obvious
 * place to land here:
 *   - peasant: README, docs/KICKSTART.md, docs/NETWORK.md, docs/pull.md,
 *     docs/cli/*.md (the generated `--help` text), internal/ingest/adapter.go
 *   - village: the collective, settings, review and pull-request pages
 *   - peasant-plugins: README (the Claude Code plugin)
 *   - this repository: scripts/install.sh and scripts/install.ps1
 */

function art(name: string, alt: string): Art {
  return { light: `/art/${name}-light.png`, dark: `/art/${name}-dark.png`, alt, width: 704, height: 528 };
}

export const DOCS_GUIDES = [
  {
    id: "evals",
    href: "/docs/guides/evals",
    title: "run an agent eval",
    summary: "Collect real sessions from many people into one collective, then pull the approved set.",
    art: art("uc-evals", "an open book with a quill in an inkwell"),
  },
  {
    id: "reviews",
    href: "/docs/guides/reviews",
    title: "review pull requests",
    summary: "Show reviewers the agent sessions behind a change, from the pull request.",
    art: art("uc-review", "two parchment pages with three lines marked in amber"),
  },
] as const;

/** the overview's starting points: the two guides, and the two sections most people look for first */
export const DOCS_START = [
  {
    id: "publish",
    href: "/docs#publish",
    title: "publish your first session",
    summary: "From Claude Code with `/peasant`, or from the terminal.",
    art: art("uc-push", "a carrier pigeon carrying a small scroll"),
  },
  DOCS_GUIDES[0],
  DOCS_GUIDES[1],
  {
    id: "access",
    href: "/docs#access",
    title: "collectives and access",
    summary: "Who can publish to a collective, and who can read it.",
    art: art("uc-learn", "a long table with one amber mug among the others"),
  },
] as const;

type Brand = "claude" | "codex" | "opencode" | "cursor" | "pi" | "strike";

export const DOCS_HOME = {
  title: "docs",
  lede: "Install peasant, publish a session, then pick a guide.",

  // scripts/install.sh header and platform checks; scripts/install.ps1 header and arch checks
  install: {
    title: "install",
    intro:
      "Peasant is one program for macOS and Linux, on Intel or Arm, and for Windows on x64. The installer shows its plan and waits for your yes, checks the download against the release checksums, and installs `peasant` to `~/.local/bin`. It never asks for admin rights and never edits your shell profile; if the folder is not on your PATH, it prints the line to add.",
    platforms: [
      { label: "macos, linux and wsl", command: "curl -fsSL https://peasantlabs.org/install | bash" },
      { label: "windows powershell", command: "irm https://peasantlabs.org/install.ps1 | iex" },
    ],
    windows:
      "On Windows, `peasant.exe` goes to `%USERPROFILE%\\.local\\bin`, and Arm devices run the x64 build. In WSL, use the first command; it installs the Linux build.",
  },

  // peasant docs/KICKSTART.md; internal/tui/kickstart
  kickstart: {
    title: "set up with kickstart",
    command: "peasant kickstart",
    intro:
      "Run it once. It finds the sessions your agents recorded on this computer, then walks you through:",
    steps: [
      "Connecting to village, which signs you in with GitHub. It is optional; `peasant village login` works later.",
      "What to track: everything, or narrowed by project, branch or session.",
      "Whether you keep sessions local or publish later, and whether to publish automatically. These are saved answers only.",
      "Standard redaction, shown on examples.",
      "A default license (none unless you pick one) and a default visibility (private).",
      "If you use Claude Code, how long Claude Code keeps its own transcript files.",
      "A review screen. Saving imports the sessions you chose.",
    ],
    never:
      "Kickstart never publishes, never installs a git hook and never saves an auto-publish rule. It does not install the Claude Code plugin.",
  },

  // peasant-plugins README; peasant `open --help`; fairtrade Publish (the publish window)
  publish: {
    title: "publish a session",
    claude: {
      title: "from claude code",
      plugin: "Install the plugin once. It needs `peasant` on your PATH.",
      commands: [
        "/plugin marketplace add peasant-labs/peasant-plugins",
        "/plugin install peasant@peasant-plugins",
      ],
      body: [
        "Type `/peasant` in a session. Peasant records that session, starts the local dashboard if it is not running, and opens the session in your browser. Claude does not reply, so no tokens are spent.",
        "On the session page, choose **publish**. The window shows what leaves your computer, the redaction check and its matches, and who can read it, the collectives you add. Nothing leaves until you press publish. A publish from here is private, carries no license, and can be read by the collectives you chose.",
      ],
    },
    others: {
      title: "from other agents",
      body: "`/peasant` is for Claude Code. For other agents, run `peasant web start`, open the session, and publish from its page.",
    },
    // `peasant village push --help`
    terminal: {
      title: "from the terminal",
      commands: ["peasant village login", "peasant village push --dry-run", "peasant village push"],
      body: [
        "This publishes your selected sessions, redacted and private. A terminal push does not pick collectives: add them in the publish window, or on village from the transcript's **manage access**.",
        "Useful flags: `--repository <path>`, `--visibility private|public` (public asks you to confirm), `--license CC0-1.0|CC-BY-4.0|CC-BY-SA-4.0`, `--dry-run` and `--yes`.",
      ],
    },
  },

  // peasant internal/ingest/adapter.go (the reader registry) and internal/config defaults
  agents: {
    title: "agents",
    intro: "Peasant reads the sessions these coding agents keep on your computer:",
    list: [
      { name: "Claude Code", brand: "claude", note: null },
      { name: "Codex", brand: "codex", note: null },
      { name: "OpenCode", brand: "opencode", note: null },
      { name: "Cursor", brand: "cursor", note: null },
      { name: "Pi", brand: "pi", note: null },
      { name: "Strike", brand: "strike", note: "off by default" },
    ] satisfies readonly { name: string; brand: Brand; note: string | null }[],
    outro: "Gemini CLI is not supported yet.",
  },

  // peasant docs/NETWORK.md; the redact engine's rules; internal/config/policy.go
  redaction: {
    title: "redaction",
    intro:
      "Peasant redacts on your computer, before anything is uploaded. Each match is replaced with a placeholder such as `<EMAIL>`. The publish window names each category the way it is shown here.",
    categories: [
      { category: "secrets", name: "secrets", covers: "API keys, tokens and other credentials." },
      { category: "pii", name: "personal data", covers: "Email addresses, phone numbers and similar." },
      { category: "paths", name: "paths", covers: "User names in file paths, as in `/Users/<USER>/…`" },
      {
        category: "project",
        name: "project identity",
        covers: "Import paths, package and container image references, and CI project variables.",
      },
    ] satisfies readonly { category: RedactionCategory; name: string; covers: string }[],
    body: [
      "Standard is the only level offered. It keeps git remote URLs and branch names, and by default your repository name and git remote are sent with the transcript; turn them off under `push.fields` in your settings.",
      "Redaction is pattern matching, and it cannot promise it found everything, so leave out any session you do not want published. Village also scans each transcript for secrets and refuses a publish that contains them.",
    ],
  },

  // village collective settings and handlers; peasant `village push --help`, `village auto --help`
  access: {
    title: "collectives and access",
    intro: "A collective is a group that can read the transcripts its members publish to it.",
    terms: [
      {
        name: "roles",
        items: [
          "Owner: manages the settings and the members.",
          "Member: reads and publishes.",
          "Contributor: publishes, and reads only if the collective allows it.",
        ],
      },
      {
        name: "who can publish",
        items: [
          "Open: anyone can join, and transcripts are approved automatically.",
          "Verified only: members of the linked GitHub org.",
          "Curated: by invitation, and the owner approves each transcript before it appears.",
        ],
      },
      {
        name: "who can read",
        items: ["Members only, or members and contributors."],
      },
      {
        name: "visibility",
        items: [
          "Private: only you.",
          "Shared: set for you when you add a transcript to a collective.",
          "Public: anyone with the link.",
        ],
      },
      {
        name: "licenses",
        items: [
          "None by default, or CC0-1.0, CC-BY-4.0 or CC-BY-SA-4.0. A terminal push attaches your kickstart default or the license you pass with `--license`; publishing from the browser or automatically attaches none.",
          "A license you granted can be changed to another one but not removed: Creative Commons grants cannot be withdrawn.",
        ],
      },
    ],
  },

  // the Short line of each command in peasant docs/cli/*.md
  cli: {
    title: "cli",
    intro: "Every command explains itself: run `peasant <command> --help`. These are the ones most people need.",
    commands: [
      { command: "peasant kickstart", does: "Run the first-time setup wizard." },
      { command: "peasant open", does: "Record one session and open its transcript in the web dashboard." },
      { command: "peasant web start", does: "Start the web dashboard server. `peasant web stop` stops it." },
      { command: "peasant village login", does: "Log in to village with GitHub." },
      { command: "peasant village push", does: "Publish your selected sessions to village." },
      {
        command: "peasant village auto",
        does: "Publish this repository's sessions on every git push, to the collectives you published to last.",
      },
      { command: "peasant village hooks", does: "Install, inspect and remove the repository's village upload hooks." },
      {
        command: "peasant village transcripts pull",
        does: "Pull one transcript, or a collective's transcripts, from village.",
      },
      { command: "peasant redact", does: "Redact local transcripts." },
      { command: "peasant prune", does: "Remove sessions from the local store and database." },
      { command: "peasant config", does: "Edit peasant's configuration." },
      { command: "peasant upgrade", does: "Upgrade peasant." },
    ],
  },
} as const;
