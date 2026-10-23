import { DocCommand, DocNote } from "@/components/docs/doc-parts";
import { Guide } from "@/components/docs/guide";
import { Rich } from "@/components/docs/rich-text";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { metadataForRoute } from "@/lib/projects";

const GUIDE = DOCS_GUIDES.find((guide) => guide.id === "evals")!;
const LEDE =
  "Collect real coding-agent sessions from many people into one collective, redacted on each computer, then pull the approved set to yours.";

export const metadata = metadataForRoute({
  title: "run an agent eval | peasant docs",
  description: LEDE,
  canonical: GUIDE.href,
});

/*
 * Sources: village's new-collective form, collective settings (members) and
 * review page; fairtrade's publish window; peasant `village transcripts pull
 * --help` and docs/pull.md.
 */
const STEPS = [
  {
    id: "collective",
    title: "make a collective",
    body: (
      <>
        <p>
          <Rich text="On village, open **collectives** and choose **new collective**. Give it a name and a purpose. Set **who can publish** to **curated**, so each transcript waits for your approval, and **who can read** to **members only**. Then choose **create collective**." />
        </p>
      </>
    ),
  },
  {
    id: "install",
    title: "ask contributors to install peasant",
    body: (
      <>
        <DocCommand command="curl -fsSL https://peasantlabs.org/install | bash" />
        <DocCommand command="peasant kickstart" />
        <p>
          <Rich text="In kickstart they connect to village, which signs them in with GitHub, and choose the projects to track. Claude Code users also add the plugin:" />
        </p>
        <DocCommand command="/plugin marketplace add peasant-labs/peasant-plugins" />
        <DocCommand command="/plugin install peasant@peasant-plugins" />
        <p>
          <Rich text="A curated collective is invite-only. Once a contributor has signed in, invite them from the collective's settings: under **members**, choose **invite by github username**. They join as members; to keep contributors from reading each other's sessions, change their role to contributor." />
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
          <Rich text="In Claude Code, `/peasant` opens the session in the browser. They choose **publish**, check what leaves their computer and who can read it, add your collective, and publish. Because the collective is curated, the session waits for your approval, and they see it on their village home under **waiting for approval**." />
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
      <p>
        <Rich text="On the collective's page, open the more menu and choose **review transcripts**. Select contributions, then choose **approve selected** or **reject selected**. You can also approve or reject from a transcript's own page." />
      </p>
    ),
  },
  {
    id: "pull",
    title: "pull the set",
    body: (
      <>
        <DocCommand command="peasant village login" />
        <DocCommand command={'peasant village transcripts list --collective "<collective name>"'} />
        <DocCommand command={'peasant village transcripts pull --collective "<collective name>"'} />
        <p>
          <Rich text="`--collective` takes the collective's name, its id or its page URL, and can be repeated. Only approved transcripts are pulled. Add `--user <account>` for one contributor, or `--dry-run` to preview." />
        </p>
        <p>
          <Rich text="Each transcript lands in `~/.local/share/peasant/village-pulls/<village host>/<transcript id>/` as `transcript.jsonl` and `metadata.json`, kept apart from your own sessions. Every agent's sessions arrive in the same shape." />
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
        { id: "publish", label: "contributors publish" },
        { id: "approve", label: "approve what goes in" },
        { id: "pull", label: "pull the set" },
      ]}
      previous={{ label: "docs home", href: "/docs" }}
      next={{ label: "next: review pull requests", href: "/docs/guides/reviews" }}
    />
  );
}
