import { DocCaptionedCommand, DocCommands, DocList, DocNote, DocPath } from "@/components/docs/doc-parts";
import { Guide } from "@/components/docs/guide";
import { Rich } from "@/components/docs/rich-text";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { metadataForRoute } from "@/lib/projects";

const GUIDE = DOCS_GUIDES.find((guide) => guide.id === "evals")!;
const LEDE =
  "Collect real coding-agent sessions from many people into one collective, redacted on each computer. Then pull the approved set to yours.";

export const metadata = metadataForRoute({
  title: "run an agent eval | peasant docs",
  description: LEDE,
  canonical: GUIDE.href,
});

/*
 * Sources: village's new-collective form, collective settings (members) and
 * review page; fairtrade's publish window; peasant `village transcripts list
 * --help`, `village transcripts pull --help` and docs/pull.md.
 */
const STEPS = [
  {
    id: "collective",
    title: "make a collective",
    body: (
      <DocList
        ordered
        items={[
          "On peasant online, open **collectives** and choose **new collective**.",
          "Give it a name and a purpose.",
          "Set **who can publish** to **curated**, so each transcript waits for your approval.",
          "Set **who can read** to **members only**.",
          "Choose **create collective**.",
        ]}
      />
    ),
  },
  {
    id: "install",
    title: "ask contributors to install peasant",
    body: (
      <>
        <p>Each contributor runs:</p>
        <DocCommands commands={["curl -fsSL https://peasantlabs.org/install | bash", "peasant kickstart"]} />
        <p>In kickstart they connect to peasant online, which signs them in with GitHub, and choose the projects to track.</p>
        <p>Claude Code users also add the plugin:</p>
        <DocCommands
          commands={["/plugin marketplace add peasant-labs/peasant-plugins", "/plugin install peasant@peasant-plugins"]}
        />
      </>
    ),
  },
  {
    id: "invite",
    title: "invite them",
    body: (
      <>
        <p>A curated collective is invite-only. Once a contributor has signed in:</p>
        <DocList
          ordered
          items={["Open the collective's settings.", "Under **members**, choose **invite by github username**."]}
        />
        <p>
          <Rich text="They join as members. To keep contributors from reading each other's sessions, change their role to **contributor**." />
        </p>
      </>
    ),
  },
  {
    id: "publish",
    title: "contributors publish",
    body: (
      <>
        <p>
          <Rich text="In Claude Code, `/peasant` opens the session in the browser. There they:" />
        </p>
        <DocList
          ordered
          items={[
            "Choose **publish**.",
            "Check what leaves their computer and who can read it.",
            "Add your collective, and publish.",
          ]}
        />
        <p>
          <Rich text="The session then waits for your approval, because the collective is curated. They see it on their peasant online home under **waiting for approval**." />
        </p>
        <DocNote>
          Redaction runs on each contributor&apos;s computer before anything is sent. Credentials,
          personal details, paths and project identifiers are replaced with placeholders.
        </DocNote>
      </>
    ),
  },
  {
    id: "approve",
    title: "approve what goes in",
    body: (
      <>
        <DocList
          ordered
          items={[
            "On the collective's page, open the more menu and choose **review transcripts**.",
            "Select contributions.",
            "Choose **approve selected** or **reject selected**.",
          ]}
        />
        <p>You can also approve or reject from a transcript&apos;s own page.</p>
      </>
    ),
  },
  {
    id: "pull",
    title: "pull the set",
    body: (
      <>
        <DocCaptionedCommand caption="log in" command="peasant village login" />
        <DocCaptionedCommand
          caption="see what you can pull"
          command={'peasant village transcripts list --collective "<name>"'}
        />
        <DocCaptionedCommand caption="pull it" command={'peasant village transcripts pull --collective "<name>"'} />
        <DocList
          items={[
            "`--collective` takes the collective's name, its id or its page URL. Repeat it for more than one.",
            "Only approved transcripts are pulled.",
            "Add `--user <account>` for one contributor, or `--dry-run` to preview.",
          ]}
        />
        <p>Each transcript lands in its own folder, kept apart from your own sessions:</p>
        <DocPath path="~/.local/share/peasant/village-pulls/<village host>/<transcript id>/" />
        <p>
          <Rich text="It holds `transcript.jsonl` and `metadata.json`. Every agent's sessions arrive in the same shape." />
        </p>
      </>
    ),
  },
] as const;

export default function EvalsGuide() {
  return (
    <Guide
      title={GUIDE.title}
      lede={LEDE}
      art={GUIDE.art}
      steps={STEPS}
      toc={[
        { id: "collective", label: "make a collective" },
        { id: "install", label: "install peasant" },
        { id: "invite", label: "invite them" },
        { id: "publish", label: "contributors publish" },
        { id: "approve", label: "approve what goes in" },
        { id: "pull", label: "pull the set" },
      ]}
      previous={{ label: "docs home", href: "/docs" }}
      next={{ label: "next: review pull requests", href: "/docs/guides/reviews" }}
    />
  );
}
