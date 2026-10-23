import { DocCommand, DocList, DocNote } from "@/components/docs/doc-parts";
import { Guide } from "@/components/docs/guide";
import { Rich } from "@/components/docs/rich-text";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { metadataForRoute } from "@/lib/projects";

const GUIDE = DOCS_GUIDES.find((guide) => guide.id === "reviews")!;
const LEDE = "Show reviewers the agent sessions behind a change, right from the pull request.";

export const metadata = metadataForRoute({
  title: "review pull requests | peasant docs",
  description: LEDE,
  canonical: GUIDE.href,
});

/*
 * Sources: village's collective settings (github orgs, pull requests), its
 * account settings, the pull-request page and the GitHub check and comment it
 * writes; fairtrade's publish window; peasant-plugins README and peasant
 * `village auto --help`.
 */
const STEPS = [
  {
    id: "link",
    title: "link your repositories",
    body: (
      <>
        <p>As the collective&apos;s owner:</p>
        <DocList
          ordered
          items={[
            "Open the collective's settings and choose **connect github** to install the GitHub app.",
            "Back on peasant online, under **github orgs**, choose **manage**.",
            "Pick the repositories and save.",
          ]}
        />
        <p>A collective links one GitHub org today.</p>
      </>
    ),
  },
  {
    id: "show",
    title: "show transcripts on pull requests",
    body: (
      <>
        <p>
          <Rich text="In the same settings, under **pull requests**, turn on **show transcripts on pull requests**." />
        </p>
        <p>
          <Rich text="Peasant online then adds one `peasant / prompts` check and one comment to pull requests in the linked repositories. The comment lists which commits have transcripts." />
        </p>
        <p>The comment is updated in place, and the check never blocks merging.</p>
      </>
    ),
  },
  {
    id: "publish",
    title: "publish the session behind the change",
    body: (
      <>
        <p>
          <Rich text="The author types `/peasant` in Claude Code and publishes the session to the collective." />
        </p>
        <p>To publish on every git push instead, do one of these:</p>
        <ul className="dx-bullets">
          <li>
            <Rich text="In the publish window, tick **publish this repo automatically on git push**." />
          </li>
          <li>
            <Rich text="In Claude Code, type `/peasant auto`." />
          </li>
          <li>
            In the repository, run:
            <DocCommand command="peasant village auto" />
          </li>
        </ul>
        <p>
          Automatic publishing sends to the collectives you published to last. It is private with no license,
          skips review, and never blocks a push.
        </p>
      </>
    ),
  },
  {
    id: "attach",
    title: "link it to the pull request",
    body: (
      <>
        <DocList
          ordered
          items={[
            "Comment `/peasant attach` on the pull request.",
            "Peasant online replies with how many of your transcripts match, and a link.",
            "Open the link and choose **attach**.",
          ]}
        />
        <p>
          <Rich text="To skip this step, turn on **link my transcripts to my pull requests automatically** in your own settings on peasant online, under **pull requests**. It is off by default." />
        </p>
        <DocNote>
          A transcript links only when one of its recorded commits is in the pull request; a matching
          branch name is not enough. Linking never changes who can read a transcript.
        </DocNote>
      </>
    ),
  },
  {
    id: "review",
    title: "review",
    body: (
      <>
        <p>
          The comment counts the transcripts and the commits they trace. It links to the pull request&apos;s page on
          peasant online.
        </p>
        <p>
          <Rich text="That page shows how many commits are traced, with the transcripts on the left and their prompts on the right. `j` and `k` move between them." />
        </p>
        <p>Each reviewer sees only the transcripts they can read, so reviewers should be members of the collective.</p>
      </>
    ),
  },
] as const;

export default function ReviewsGuide() {
  return (
    <Guide
      title={GUIDE.title}
      lede={LEDE}
      art={GUIDE.art}
      steps={STEPS}
      toc={[
        { id: "link", label: "link your repositories" },
        { id: "show", label: "show transcripts" },
        { id: "publish", label: "publish the session" },
        { id: "attach", label: "link it" },
        { id: "review", label: "review" },
      ]}
      previous={{ label: "previous: run an agent eval", href: "/docs/guides/evals" }}
      next={{ label: "docs home", href: "/docs" }}
    />
  );
}
