import { DOCS_GUIDES, type DocStep } from "@/lib/docs-content";

/**
 * The guides' copy, as data: each step is a list of blocks the guide page
 * draws and the docs search indexes, so the two can never disagree. Text uses
 * the same `code`, **control** and [link](href) marks as lib/docs-content.ts.
 *
 * Every step id is a public address (testdata/docs/anchors.yaml): add ids
 * freely, never rename or remove one.
 */
export type DocBlock =
  | Readonly<{ p: string }>
  | Readonly<{ ol: readonly string[] }>
  | Readonly<{ ul: readonly string[] }>
  | Readonly<{ cmds: readonly string[] }>
  | Readonly<{ captioned: readonly Readonly<{ caption: string; command: string }>[] }>
  | Readonly<{ options: readonly DocStep[] }>
  | Readonly<{ note: string }>
  | Readonly<{ path: string }>;

export type GuideStepData = Readonly<{ id: string; title: string; toc: string; body: readonly DocBlock[] }>;

export type GuideData = Readonly<{
  id: (typeof DOCS_GUIDES)[number]["id"];
  lede: string;
  steps: readonly GuideStepData[];
}>;

/*
 * Sources: village's new-collective form, collective settings (members) and
 * review page; fairtrade's publish window; peasant `village transcripts list
 * --help`, `village transcripts pull --help` and docs/pull.md.
 */
export const EVALS_GUIDE: GuideData = {
  id: "evals",
  lede: "Collect real coding-agent sessions from many people into one collective, with secrets and personal details hidden on each computer. Then pull the approved set to yours.",
  steps: [
    {
      id: "collective",
      title: "make a collective",
      toc: "make a collective",
      body: [
        {
          ol: [
            "On peasant online, open **collectives** and choose **new collective**.",
            "Give it a name and a purpose.",
            "Set **who can publish** to **curated**, so each transcript waits for your approval.",
            "Set **who can read** to **members only**.",
            "Choose **create collective**.",
          ],
        },
      ],
    },
    {
      id: "install",
      title: "ask contributors to install peasant",
      toc: "install peasant",
      body: [
        { p: "Each contributor runs:" },
        { cmds: ["curl -fsSL https://peasantlabs.org/install | bash", "peasant kickstart"] },
        {
          p: "In kickstart they connect to peasant online, which signs them in with GitHub, and choose the projects to track.",
        },
        { p: "Claude Code users also add the plugin:" },
        { cmds: ["/plugin marketplace add peasant-labs/peasant-plugins", "/plugin install peasant@peasant-plugins"] },
      ],
    },
    {
      id: "invite",
      title: "invite them",
      toc: "invite them",
      body: [
        { p: "A curated collective is invite-only. Once a contributor has signed in:" },
        { ol: ["Open the collective's settings.", "Under **members**, choose **invite by github username**."] },
        {
          p: "They join as members. To keep contributors from reading each other's sessions, change their role to **contributor**.",
        },
      ],
    },
    {
      id: "publish",
      title: "contributors publish",
      toc: "contributors publish",
      body: [
        { p: "In Claude Code, `/peasant` opens the session in the browser. There they:" },
        {
          ol: [
            "Choose **publish**.",
            "Check what leaves their computer and who can read it.",
            "Add your collective, and publish.",
          ],
        },
        {
          p: "The session then waits for your approval, because the collective is curated. They see it on their peasant online home under **waiting for approval**.",
        },
        {
          note: "Redaction runs on each contributor's computer before anything is sent. Credentials, personal details, paths and project identifiers are replaced with placeholders.",
        },
      ],
    },
    {
      id: "approve",
      title: "approve what goes in",
      toc: "approve what goes in",
      body: [
        {
          ol: [
            "On the collective's page, open the more menu and choose **review transcripts**.",
            "Select contributions.",
            "Choose **approve selected** or **reject selected**.",
          ],
        },
        { p: "You can also approve or reject from a transcript's own page." },
      ],
    },
    {
      id: "pull",
      title: "pull the set",
      toc: "pull the set",
      body: [
        {
          captioned: [
            { caption: "log in", command: "peasant village login" },
            { caption: "see what you can pull", command: 'peasant village transcripts list --collective "<name>"' },
            { caption: "pull it", command: 'peasant village transcripts pull --collective "<name>"' },
          ],
        },
        {
          ul: [
            "`--collective` takes the collective's name, its id or its page URL. Repeat it for more than one.",
            "Only approved transcripts are pulled.",
            "Add `--user <account>` for one contributor, or `--dry-run` to preview.",
          ],
        },
        { p: "Each transcript lands in its own folder, kept apart from your own sessions:" },
        { path: "~/.local/share/peasant/village-pulls/<village host>/<transcript id>/" },
        { p: "It holds `transcript.jsonl` and `metadata.json`. Every agent's sessions arrive in the same shape." },
      ],
    },
  ],
};

/*
 * Sources: village's collective settings (github orgs, pull requests), its
 * account settings, the pull-request page and the GitHub check and comment it
 * writes, and its waiting pull requests list and matcher; fairtrade's publish
 * window; peasant-plugins README and peasant `village auto --help`.
 */
export const REVIEWS_GUIDE: GuideData = {
  id: "reviews",
  lede: "Show reviewers the agent sessions behind a change, right from the pull request.",
  steps: [
    {
      id: "link",
      title: "link your repositories",
      toc: "link your repositories",
      body: [
        { p: "As the collective's owner:" },
        {
          ol: [
            "Open the collective's settings and choose **connect github** to install the GitHub app.",
            "Back on peasant online, under **github orgs**, choose **manage**.",
            "Pick the repositories and save.",
          ],
        },
        { p: "A collective links one GitHub org today." },
      ],
    },
    {
      id: "show",
      title: "show transcripts on pull requests",
      toc: "show transcripts",
      body: [
        { p: "In the same settings, under **pull requests**, turn on **show transcripts on pull requests**." },
        {
          p: "Peasant online then adds one `peasant / prompts` check and one comment to pull requests in the linked repositories. The comment lists which commits have transcripts.",
        },
        { p: "The comment is updated in place, and the check never blocks merging." },
      ],
    },
    {
      id: "publish",
      title: "publish the session behind the change",
      toc: "publish the session",
      body: [
        { p: "The author types `/peasant` in Claude Code and publishes the session to the collective." },
        { p: "To publish on every git push instead, do one of these:" },
        {
          options: [
            { text: "In the publish window, tick **publish this repo automatically on git push**.", commands: [] },
            { text: "In Claude Code, type `/peasant auto`.", commands: [] },
            { text: "In the repository, run:", commands: ["peasant village auto"] },
          ],
        },
        {
          p: "Automatic publishing sends to the collectives you published to last. It is private with no license, skips review, and never blocks a push. More in [publish automatically](/docs#auto-publish).",
        },
      ],
    },
    {
      id: "attach",
      title: "link it to the pull request",
      toc: "link it",
      body: [
        {
          ol: [
            "Comment `/peasant attach` on the pull request.",
            "Peasant online replies with how many of your transcripts match, and a link.",
            "Open the link and choose **attach**.",
          ],
        },
        {
          p: "Until one of your transcripts matches, the pull request waits in **pull requests** on peasant online. Publishing a session behind one of its commits links it with no click.",
        },
        {
          p: "To skip the comment, turn on **link my transcripts to my pull requests automatically** in your own settings on peasant online, under **pull requests**. It is off by default, and covers the repositories your collectives link.",
        },
        {
          note: "A transcript links only when one of its recorded commits is in the pull request; a matching branch name is not enough. Linking never changes who can read a transcript.",
        },
      ],
    },
    {
      id: "review",
      title: "review",
      toc: "review",
      body: [
        {
          p: "The comment counts the transcripts and the commits they trace. It links to the pull request's page on peasant online.",
        },
        {
          p: "That page shows how many commits are traced, with the transcripts on the left and their prompts on the right. `j` and `k` move between them.",
        },
        { p: "Each reviewer sees only the transcripts they can read, so reviewers should be members of the collective." },
      ],
    },
  ],
};

export const GUIDES = [EVALS_GUIDE, REVIEWS_GUIDE] as const;
