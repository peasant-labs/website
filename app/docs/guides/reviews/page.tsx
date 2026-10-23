import { DocCommand, DocNote } from "@/components/docs/doc-parts";
import { Guide } from "@/components/docs/guide";
import { Rich } from "@/components/docs/rich-text";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { metadataForRoute } from "@/lib/projects";

const GUIDE = DOCS_GUIDES.find((guide) => guide.id === "reviews")!;
const LEDE = "Show reviewers the agent sessions behind a change, right from the pull request.";

export const metadata = metadataForRoute({
  title: "review pull requests | peasant labs docs",
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
      <p>
        <Rich text="As the collective's owner, open its settings and choose **connect github** to install the GitHub app. Back on village, under **github orgs**, choose **manage**, pick the repositories and save. A collective links one GitHub org today." />
      </p>
    ),
  },
  {
    id: "show",
    title: "show transcripts on pull requests",
    body: (
      <p>
        <Rich text="In the same settings, under **pull requests**, turn on **show transcripts on pull requests**. Village adds one `peasant / prompts` check and one comment to pull requests in the linked repositories, listing which commits have transcripts. The comment is updated in place, and the check never blocks merging." />
      </p>
    ),
  },
  {
    id: "publish",
    title: "publish the session behind the change",
    body: (
      <>
        <p>
          <Rich text="The author types `/peasant` in Claude Code and publishes the session to the collective. To publish on every git push instead, tick **publish this repo automatically on git push** in the publish window, type `/peasant auto` in Claude Code, or run this in the repository:" />
        </p>
        <DocCommand command="peasant village auto" />
        <p>
          <Rich text="Automatic publishing sends to the collectives you published to last. It is private with no license, skips review, and never blocks a push." />
        </p>
      </>
    ),
  },
  {
    id: "attach",
    title: "link it to the pull request",
    body: (
      <>
        <p>
          <Rich text="Comment `/peasant attach` on the pull request. Village replies with how many of your transcripts match and a link; open it and choose **attach**. To skip this step, turn on **link my transcripts to my pull requests automatically** in your own village settings, under **pull requests**. It is off by default." />
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
      <p>
        <Rich text="The comment counts the transcripts and the commits they trace, and links to the pull request's page on village. That page shows how many commits are traced, the transcripts on the left and their prompts on the right; `j` and `k` move between them. Each reviewer sees only the transcripts they can read, so reviewers should be members of the collective." />
      </p>
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
