import type { Art } from "@/lib/landing";
import type { RedactionCategory } from "@peasant-labs/fairtrade/ui";

/**
 * The docs copy. Every command and claim is taken from the product's own
 * sources, and the source is noted beside it so a change there has an obvious
 * place to land here:
 *   - peasant: README, docs/KICKSTART.md, docs/NETWORK.md, docs/pull.md,
 *     docs/cli/*.md (the generated `--help` text), internal/ingest/adapter.go
 *   - village (peasant online): the collective, settings, review and
 *     pull-request pages
 *   - peasant-plugins: README (the Claude Code plugin)
 *   - this repository: scripts/install.sh and scripts/install.ps1
 *
 * The copy is written to be scanned: one idea per paragraph, procedures as
 * numbered steps, and commands in their own blocks. The hosted app is
 * "peasant online" in prose; "village" stays only in commands and paths.
 *
 * Every section id here is a public address: the online and local apps link
 * to them instead of teaching how-to in the app. Add ids freely; never rename
 * or remove one (testdata/docs/anchors.yaml guards them).
 */

function art(name: string, alt: string): Art {
  return { light: `/art/${name}-light.png`, dark: `/art/${name}-dark.png`, alt, width: 704, height: 528 };
}

export const DOCS_GUIDES = [
  {
    id: "evals",
    href: "/docs/guides/evals",
    title: "run an agent eval",
    summary: "Run a repeatable coding task, score it, and collect the sessions behind the results.",
    art: art("docs-evals", "a round glass flask half full of amber liquid, on a ring stand"),
  },
  {
    id: "reviews",
    href: "/docs/guides/reviews",
    title: "review pull requests",
    summary: "Show reviewers the agent sessions behind a change, from the pull request.",
    art: art("docs-reviews", "a pair of round reading spectacles with amber frames"),
  },
  {
    id: "classroom", href: "/docs/guides/classroom", title: "run a class with agent use",
    summary: "Collect assignment sessions, review a student's decisions, and keep submissions private.",
    art: art("uc-slate", "a slate on an easel with an amber apple on its ledge"),
  },
  {
    id: "onboarding", href: "/docs/guides/onboarding", title: "onboard from real history",
    summary: "Trace a past pull request through its prompts, decisions and tests.",
    art: art("uc-signpost", "a signpost with three arrows, the top one amber"),
  },
  {
    id: "find-sessions", href: "/docs/guides/find-sessions", title: "find a past session",
    summary: "Recover the context behind a change from sessions kept on your computer.",
    art: art("uc-lantern", "a lantern with amber glass"),
  },
] as const;

/** the overview's next steps: the use-case guides and the two sections most people look for */
export const DOCS_START = [
  {
    id: "publish",
    href: "/docs#publish",
    title: "publish your first session",
    summary: "From Claude Code with `/peasant`, or from the terminal.",
    art: art("docs-publish", "a pole flying a swallow-tailed amber banner"),
  },
  ...DOCS_GUIDES,
  {
    id: "access",
    href: "/docs#access",
    title: "collectives and access",
    summary: "Who can publish to a collective, and who can read it.",
    art: art("docs-access", "a crenellated castle wall with an arched gateway and its amber portcullis half raised"),
  },
] as const;

type Brand = "claude" | "codex" | "opencode" | "cursor" | "pi" | "strike";

/** One numbered step of a procedure: what to do, and the commands that do it. */
export type DocStep = Readonly<{ text: string; commands: readonly string[] }>;

export const DOCS_HOME = {
  title: "docs",
  lede: "Install peasant, open a local session, then pick a guide.",

  quickstart: {
    id: "quickstart",
    title: "install, then open a session",
    platforms: [
      { label: "macos, linux and wsl", command: "curl -fsSL https://peasantlabs.org/install | bash -s -- --kickstart" },
      { label: "windows powershell", command: "irm https://peasantlabs.org/install.ps1 | iex" },
    ],
    windows: "On Windows, follow the installer's PATH instructions, then run `peasant kickstart`. The PowerShell installer does not start setup for you.",
    setup: "In kickstart, choose the projects to track and save. Your sessions stay local. Then ask your coding agent:",
    prompt: "Open this session in Peasant.",
    after: "Opening a session is local. Read it first; choose **publish** when you want to review redaction and pick the collectives that can read it. If your agent needs help opening it, use [the agent and terminal instructions](#publish).",
    details: "The detailed installation and setup reference follows below.",
  },

  // scripts/install.sh header and platform checks; scripts/install.ps1 header and arch checks
  install: {
    id: "install",
    title: "install",
    intro: "Peasant is one program for macOS and Linux, on Intel or Arm, and for Windows on x64.",
    platforms: [
      { label: "macos, linux and wsl", command: "curl -fsSL https://peasantlabs.org/install | bash" },
      { label: "windows powershell", command: "irm https://peasantlabs.org/install.ps1 | iex" },
    ],
    installerIntro: "The installer:",
    installer: [
      "Shows its plan and waits for your yes.",
      "Checks the download against the release checksums.",
      "Installs `peasant` to `~/.local/bin`.",
      "Never asks for admin rights and never edits your shell profile. If the folder is not on your PATH, it prints the line to add.",
    ],
    windows: [
      "On Windows, `peasant.exe` goes to `%USERPROFILE%\\.local\\bin`. Arm devices run the x64 build.",
      "In WSL, use the first command. It installs the Linux build.",
    ],
  },

  // peasant docs/KICKSTART.md; internal/tui/kickstart
  kickstart: {
    id: "kickstart",
    title: "set up with kickstart",
    command: "peasant kickstart",
    intro:
      "Run it once. It finds the sessions your agents recorded on this computer, then walks you through:",
    steps: [
      "Connecting to peasant online, which signs you in with GitHub. You can skip it and [sign in](#sign-in) later.",
      "What to track: everything, or narrowed by project, branch or session.",
      "Whether you keep sessions local or publish later, and whether to publish automatically. It only saves your answers.",
      "Standard redaction, shown on examples.",
      "A default license (none unless you pick one) and a default visibility (private).",
      "If you use Claude Code: how long Claude Code keeps its own transcript files.",
      "A review screen. Saving imports the sessions you chose.",
    ],
    never:
      "Kickstart never publishes, never installs a git hook and never saves an auto-publish rule. It does not install the Claude Code plugin.",
  },

  // peasant docs/cli/peasant_harvest.md; internal/config/config.go (Strike off by default);
  // internal/defaults/config.go (default folders); cmd/peasant/cmd_harvest.go (selection scope)
  record: {
    id: "record",
    title: "record sessions",
    intro: [
      "`peasant harvest` finds the sessions your agents keep on this computer and adds them to peasant, ready to browse and search. Kickstart runs it when you save. `peasant ingest` is the same command.",
    ],
    command: "peasant harvest",
    flags: [
      "`--since 2w`: only sessions from the last two weeks (or `7d`, `3m`).",
      "`--dry-run`: show what would be processed, without writing.",
      "`--all`: process every session again.",
    ],
    single: "`/peasant` in Claude Code and `peasant open` record one session.",
    emptyIntro: "If nothing shows up:",
    empty: [
      "Strike is off by default. Turn an agent on in the local web's **settings**, under **sources**.",
      "Peasant reads each agent's default folder: `~/.claude/projects`, `~/.local/share/opencode`, `~/.codex/sessions`, `~/.cursor/projects`, `~/.strike/sessions` and `~/.pi/agent/sessions`. For another folder, pass `--source-harness <agent> --source-path <folder>`.",
      "A saved selection records only the projects it admits. Run `peasant kickstart` to change it.",
    ],
  },

  // peasant cmd_login.go, cmd_logout.go, internal/auth (credentials.json, logout revokes the key);
  // local web VillageAccountRow (log out is local only); fairtrade SignIn; village settings (connections)
  signIn: {
    id: "sign-in",
    toc: "sign in",
    title: "sign in to peasant online",
    intro: "Sign in with GitHub:",
    command: "peasant village login",
    body: [
      "Peasant keeps a key in `credentials.json` in your [config folder](#configuration).",
      "Or sign in from the publish window: choose **continue with GitHub**.",
    ],
    logout: "To sign this computer out and revoke its key on peasant online:",
    logoutCommand: "peasant village logout",
    note: "**log out** in the local web's settings removes the key from this computer only. To sign out every computer, use **sign out everywhere** in your settings on peasant online, under **connections**.",
  },

  // peasant-plugins README; peasant `open --help`; fairtrade Publish (the publish window)
  publish: {
    id: "publish",
    title: "publish a session",
    before: [
      "Before you publish: [install peasant](#install), run [kickstart](#kickstart) and [sign in](#sign-in).",
      "Read [peasant online's privacy notice](https://village.peasantlabs.org/privacy).",
    ],
    claude: {
      title: "from claude code",
      steps: [
        {
          text: "Install the plugin once. It needs `peasant` on your PATH.",
          commands: [
            "/plugin marketplace add peasant-labs/peasant-plugins",
            "/plugin install peasant@peasant-plugins",
          ],
        },
        {
          text: "Type `/peasant` in a session. Peasant records it, starts the local dashboard if it is not running, and opens the session in your browser. Claude does not reply, so no tokens are spent.",
          commands: [],
        },
        {
          text: "On the session page, choose **publish**. The window shows what leaves your computer, the redaction check and its matches, and who can read it: the collectives you add.",
          commands: [],
        },
        {
          text: "Press **publish**. Nothing leaves your computer until you do.",
          commands: [],
        },
      ] satisfies readonly DocStep[],
      after: "A publish from here is private, carries no license, and can be read by the collectives you chose.",
    },
    others: {
      title: "from other agents",
      body: "`/peasant` is for Claude Code. With other agents, run `peasant web start`, open the session, and publish from its page.",
    },
    // `peasant village login --help`, `peasant village push --help`
    terminal: {
      title: "from the terminal",
      steps: [
        { text: "Log in to peasant online with GitHub.", commands: ["peasant village login"] },
        { text: "See what would be published, without uploading.", commands: ["peasant village push --dry-run"] },
        { text: "Publish your selected sessions, redacted and private.", commands: ["peasant village push"] },
      ] satisfies readonly DocStep[],
      body: [
        "A terminal push does not pick collectives. Add them in the publish window, or on peasant online from the transcript's **manage access**.",
      ],
      flagsIntro: "Useful flags:",
      flags: [
        "`--repository <path>`: only this repository's sessions.",
        "`--visibility private|public`: the visibility for this run. Public asks you to confirm.",
        "`--license CC0-1.0|CC-BY-4.0|CC-BY-SA-4.0`: the license for this run.",
        "`--dry-run`: show what would be published, without uploading.",
        "`--yes`: run without the wizard or the public-consent prompt.",
      ],
    },
  },

  // peasant `village auto --help`, `village hooks --help` and its subcommands; internal/autopublish
  // (hooks.yaml, paused rules); local web AutoPublishRules; fairtrade Publish; peasant-plugins (/peasant auto)
  autoPublish: {
    id: "auto-publish",
    title: "publish automatically",
    intro: [
      "Automatic publishing sends a repository's sessions to your collectives when you push, or on each commit if its rule says so. Each one goes up private and with no license, with secrets and personal details hidden, and skips review.",
      "A failed upload never fails the push.",
    ],
    waysIntro: "Turn it on in one of three ways:",
    ways: [
      { text: "In the publish window, tick **publish this repo automatically on git push**.", commands: [] },
      { text: "In Claude Code, type `/peasant auto`.", commands: [] },
      {
        text: "In the repository, run this. It uses the collectives you published to last, saves a rule and installs the git hook in this repository only.",
        commands: ["peasant village auto"],
      },
    ] satisfies readonly DocStep[],
    rules: [
      "A rule binds a folder or a git remote to collectives. Rules live in `hooks.yaml` in your [config folder](#configuration).",
      "Edit or pause rules in the local web's **settings**, under **automatic publishing**. A paused rule publishes nothing.",
    ],
    hooksIntro: "Saving a rule there installs no hook. Manage a repository's hooks with:",
    hooks: [
      "peasant village hooks install --event pre-push",
      "peasant village hooks status",
      "peasant village hooks uninstall",
    ],
    hooksNotes: [
      "`--event pre-push` runs before git contacts the remote; `--event post-commit` runs after each commit.",
      "A hook installs only into an empty hook slot, and `uninstall` removes only the hooks peasant wrote.",
      "Without a rule, a hook publishes with your configured `push.visibility`.",
    ],
  },

  // local web map page and fairtrade CodeMap legend; peasant web/src/lib/glossary.ts
  codeMap: {
    id: "code-map",
    title: "read the code map",
    intro: "The local web's map shows a project's code as boxes and lines.",
    legend: [
      "**Box**: a code area, a folder or a file.",
      "**Line**: one area uses another.",
      "**Brightness**: brighter means more of it was built with AI on record. A dim box has no saved conversation behind it.",
      "**Red**: a tangle. Two areas use each other, or one points against the project's layering.",
    ],
    actions: [
      "Click an area to see what it connects to, its AI-built files, the conversations that built it, what usually changes with it and its effort totals.",
      "Double-click a folder to open its files.",
    ],
  },

  // fairtrade Changes (the local web's changes page)
  changes: {
    id: "changes",
    title: "read changes",
    intro: "The local web's **changes** page draws a project's git history. Each line of work (a branch) is a lane, and each row is a commit.",
    legend: [
      "A star marks a recorded session. Select its commit to open it.",
      "**sessions not linked to a commit** and **sessions linked outside this visible commit window** list the rest.",
      "**show older** loads more history.",
    ],
  },

  // peasant internal/ingest/adapter.go (the reader registry) and internal/config defaults
  agents: {
    id: "agents",
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
    id: "redaction",
    title: "redaction",
    intro: [
      "Peasant hides secrets and personal details on your computer, before anything is uploaded.",
      "Each match is replaced with a placeholder such as `<EMAIL>`. The publish window names each category as shown here.",
    ],
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
      "**Standard** is the only level offered. It keeps git remote URLs and branch names.",
      "By default, your repository name and git remote are sent with the transcript. Turn them off under `push.fields` in your settings.",
    ],
    caution:
      "Redaction is pattern matching, and it cannot promise it found everything. Leave out any session you do not want published.",
    server: "Peasant online also scans each transcript for secrets and refuses a publish that contains them.",
  },

  // village collective settings and handlers; peasant `village push --help`, `village auto --help`
  access: {
    id: "access",
    title: "collectives and access",
    intro: "A collective is a group that can read the transcripts its members publish to it.",
    terms: [
      {
        name: "roles",
        items: [
          "**Owner**: manages the settings and the members.",
          "**Member**: reads and publishes.",
          "**Contributor**: publishes, and reads only if the collective allows it.",
        ],
      },
      {
        name: "who can publish",
        items: [
          "**Open**: anyone can join, and transcripts are approved automatically.",
          "**Verified only**: members of the linked GitHub org.",
          "**Curated**: by invitation. The owner approves each transcript before it appears.",
        ],
      },
      {
        name: "who can read",
        items: ["Members only, or members and contributors."],
      },
      {
        name: "visibility",
        items: [
          "**Private**: only you.",
          "**Shared**: set for you when you add a transcript to a collective.",
          "**Public**: anyone with the link.",
        ],
      },
      {
        name: "licenses",
        items: [
          "None by default, or CC0-1.0, CC-BY-4.0 or CC-BY-SA-4.0.",
          "A terminal push attaches your kickstart default, or the license you pass with `--license`.",
          "Publishing from the browser or automatically attaches none.",
          "A license you granted can be changed to another one but not removed: Creative Commons grants cannot be withdrawn.",
        ],
      },
    ],
  },

  // peasant docs/cli/peasant_prune.md, cmd_prune.go, internal/store/prune.go; docs/KICKSTART.md
  // (a selection never deletes); cmd_kickstart.go (--reset)
  prune: {
    id: "prune",
    toc: "remove sessions",
    title: "remove recorded sessions",
    intro: [
      "`peasant prune` permanently deletes sessions from this computer: their database rows and their files. It needs at least one filter and asks before it deletes.",
    ],
    command: "peasant prune --before 2026-01-01 --dry-run",
    filters: [
      "`--session <id>`, `--project <hash>` or `--harness <agent>`.",
      "`--before` or `--after` a date (YYYY-MM-DD).",
      "`--unselected`: the sessions your saved selection leaves out.",
      "`--all`: every session.",
      "`--dry-run` shows what would go; `--confirm` skips the question, for scripts.",
    ],
    notes: [
      "Prune deletes nothing online: published transcripts stay.",
      "A saved selection never deletes. It only filters lists and search.",
      "`peasant kickstart --reset` also deletes the database and recorded files, along with your settings and key.",
    ],
  },

  // peasant internal/defaults (config home, XDG_CONFIG_HOME), docs/cli/peasant.md (--config, --config-dir),
  // cmd_config.go, internal/api/settings_catalog.go (settings the web page leaves read-only)
  configuration: {
    id: "configuration",
    title: "settings files",
    intro: "Peasant keeps its settings in `~/.config/peasant/`, or `$XDG_CONFIG_HOME/peasant/` when that is set:",
    files: [
      "`config.yaml`: every setting.",
      "`hooks.yaml`: the [automatic publishing](#auto-publish) rules.",
      "`credentials.json`: your peasant online key.",
    ],
    flags: [
      "`--config <file>` reads another `config.yaml`.",
      "`--config-dir <dir>` moves the whole folder to `<dir>/peasant`. `hooks.yaml` and `credentials.json` follow the folder, not `--config`.",
    ],
    editors: [
      "Edit settings in the local web's **settings**, or in the terminal with `peasant config`.",
      "Your project selection changes only with `peasant kickstart` or `peasant config`.",
    ],
  },

  // the Short line of each command in peasant docs/cli/*.md
  cli: {
    id: "cli",
    title: "cli",
    intro: "These are the commands most people need. For any of them, run `peasant <command> --help`.",
    commands: [
      { command: "peasant kickstart", does: "Run the first-time setup wizard." },
      { command: "peasant harvest", does: "[Record](#record) the sessions on this computer." },
      { command: "peasant open", does: "Record one session and open its transcript in the web dashboard." },
      { command: "peasant web start", does: "Start the web dashboard server. `peasant web stop` stops it." },
      { command: "peasant village login", does: "Log in to peasant online with GitHub." },
      { command: "peasant village logout", does: "Log out, and revoke this computer's key online." },
      { command: "peasant village push", does: "Publish your selected sessions to peasant online." },
      {
        command: "peasant village auto",
        does: "Publish this repository's sessions on every git push, to the collectives you published to last.",
      },
      { command: "peasant village hooks", does: "Install, inspect and remove the repository's upload hooks." },
      {
        command: "peasant village transcripts pull",
        does: "Pull one transcript, or a collective's transcripts, from peasant online.",
      },
      { command: "peasant redact", does: "Redact local transcripts." },
      { command: "peasant prune", does: "[Remove sessions](#prune) from the local store and database." },
      { command: "peasant config", does: "Edit peasant's configuration." },
      { command: "peasant upgrade", does: "Upgrade peasant." },
    ],
  },
} as const;

/** the overview's sections, in reading order: the page, its "on this page" list and search all follow it */
export const DOCS_HOME_SECTIONS = [
  DOCS_HOME.quickstart,
  DOCS_HOME.install,
  DOCS_HOME.kickstart,
  DOCS_HOME.record,
  DOCS_HOME.signIn,
  DOCS_HOME.publish,
  DOCS_HOME.autoPublish,
  DOCS_HOME.codeMap,
  DOCS_HOME.changes,
  DOCS_HOME.agents,
  DOCS_HOME.redaction,
  DOCS_HOME.access,
  DOCS_HOME.prune,
  DOCS_HOME.configuration,
  DOCS_HOME.cli,
] as const;

/** the overview's cards to the guides and the sections most people look for, after install and set up */
export const DOCS_NEXT = { id: "guides", title: "next steps" } as const;

/** one line of an "on this page" list: a heading's anchor and its label; `sub` marks an h3 under an h2 */
export type TocItem = Readonly<{ id: string; label: string; sub?: boolean }>;

/** the overview's "on this page" list, in page order: a section's short label where it has one */
export const DOCS_HOME_TOC: readonly TocItem[] = DOCS_HOME_SECTIONS.flatMap((section) => [
  { id: section.id, label: "toc" in section ? section.toc : section.title },
  ...(section.id === "kickstart" ? [{ id: DOCS_NEXT.id, label: DOCS_NEXT.title }] : []),
]);
