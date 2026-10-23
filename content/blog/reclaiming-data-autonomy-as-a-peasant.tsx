import { Rich } from "@/components/docs/rich-text";
import type { TocItem } from "@/lib/docs-content";

/*
 * The essay first published as the front page of peasantlabs.org on
 * 2026-05-20, moved here when the front page became the product landing page.
 * Its sentences are unchanged; its opening summary was taken out, and short
 * headings in its own words mark its parts for "on this page". Its words are
 * data, so the docs search indexes exactly what the page shows; [label](href)
 * marks a link, which opens in a new tab.
 */

/* the essay's parts, in order: each heading is words the essay uses where it stands */
const PARTS = {
  traces: { id: "traces-on-your-local-machine", title: "traces on your local machine" },
  review: { id: "the-speedup-fizzles", title: "the speedup fizzles" },
  winners: { id: "who-wins", title: "who wins" },
  permissions: { id: "fine-grained-permissions", title: "fine-grained permissions" },
  commons: { id: "faster-moving-data-commons", title: "faster-moving data commons" },
  tools: { id: "safely-share-and-manage-access", title: "safely share and manage access" },
} as const;

/** the essay's "on this page" list */
export const ESSAY_TOC: readonly TocItem[] = Object.values(PARTS).map(({ id, title }) => ({ id, label: title }));

const PROBLEMS = [
  {
    point: "the public has no",
    details: [
      "input, agency, autonomy over their data,",
      "or the platforms that host it",
      "no infrastructure for attribution, or attestation",
    ],
  },
  {
    point:
      "as peasants, we rely on the government to enact and enforce policies in our interest, but government is",
    details: [
      "slow",
      "complex, maze-like, confusing",
      "in some cases politically misaligned",
      "very high-effort to engage with",
    ],
  },
  {
    point: "results in a collective action problem",
    details: [
      "needs some amount of coordination and centralization",
      "outreach and alliance-building",
    ],
  },
] as const;

const BODY = [
  "Using coding agents like Claude Code or OpenAI Codex leaves traces on your local machine in the form of transcripts, and these transcripts contain all the messages and tool calls from your coding sessions. This means that much of the software engineering lifecycle can be captured within a series of coding agent transcripts. The amount captured depends on your usage patterns and how reliant you are on these agentic tools. If you’re involving agents every step of the way, your entire process of research, product ideation, requirements gathering, iterating, fixing, and maintaining code may all be in your transcript. These traces contain all of your preference data about what you built, valued, and accepted.",
  "The speedup you get from AI coding agents also fizzles once you introduce …. one other human. Collaborating with others means reviewing your teammate’s code, or a random contributor’s pull request that modified 10K lines in the codebase. As stated by Simon Willison (and one month earlier by [Kailash Nadh](https://nadh.in/blog/code-is-cheap/)), [“Writing code is cheap now”](https://simonwillison.net/guides/agentic-engineering-patterns/code-is-cheap/) , but there is still substantial effort when it comes to engineering good, verified, and maintainable solutions for multiple operating systems and form factors — and these engineering decisions would be sitting in the coding agent transcripts. When I’m handed a large slop PR, whether good or bad, I’d prefer to also see the person’s engineering process. How were they actually thinking about the problem? Did they do their due diligence? Ask the right questions? Was this a one-prompt job? Many developers haven’t tried looking at their past sessions: for those that have, it is often an unpleasant challenge, and figuring out how to share them with others is worse. Within a mountain of JSONL files and coding sessions only named by their UUID, finding the exact set of transcripts that corresponded to a given commit or pull request may be impossible.",
  "And who wins from this arrangement? As the person using these tools, you’d hopefully be getting a portion of the gains, being able to iterate faster and produce orders of magnitude more code to build out your peasant dreams. The other big winner is Anthropic, OpenAI, or the Other AI Company you’re using: by agreeing to their terms of use and privacy policies, they have the power to plunder your trove of transcripts with impunity and use your efforts to grow their walled gardens of data. They can also [change the terms on you at any time](https://techcrunch.com/2026/04/10/anthropic-temporarily-banned-openclaws-creator-from-accessing-claude/), or roll out changes that nullify your use case.",
  "If you wanted to contribute your data back to an open data repository (similar to [DataClaw](https://x.com/peterom/status/2026754938291056947)) or store transcripts internally for your own team, most of the existing solutions don’t come with fine-grained permissions settings (or they put these settings behind a paywall). Sharing of these transcripts also requires understanding of the privacy implications and some data governance expertise, and this can get complicated very fast. Our solutions will provide advanced permissions and access controls to the user, but also help balance the cognitive load of governance by guiding the user with secure and sane defaults, and allowing users to progressively opt-in to more complexity if they want.",
] as const;

const ASIDE =
  "These topics have also been explored by Nicholas Vincent, in his substack post [“The Coding Agent Data Deal”](https://dataleverage.substack.com/p/the-coding-agent-data-deal) which further explores implications of the terms of use in popular coding agent tools, and in his follow-up post [“The Paradox of Reuse in 2026: A Case of Quasi-Enclosure”](https://dataleverage.substack.com/p/the-paradox-of-reuse-in-2026-a-case), which contextualizes the relationship between AI providers, knowledge workers, and AI users as a precarious quasi-enclosure, in which the AI providers can decide the terms of at any time. While beneficial for individual developers now, future terms may be less so, and some popular open-source libraries are already facing harm (closing their doors and limiting who can open PRs as with [tldraw](https://github.com/tldraw/tldraw/issues/7695), or cURL [closing their bug bounty program](https://daniel.haxx.se/blog/2026/01/26/the-end-of-the-curl-bug-bounty/)).";

const PROBLEMS_INTRO =
  "While policy-makers are figuring out regulations around AI and agent traces, we need faster-moving data commons in the interim, run by the community it serves. As it stands right now:";

const CLOSING =
  "This is why we are developing the suite of tools required to safely share and manage access to transcripts from coding agent sessions. This will be a fundamental component of development infrastructure so that (1) the developer community can sustainably incorporate coding agents into their software engineering processes, (2) to create a data commons with the public interest in mind, and (3) to allow the public to have autonomy over their data, outside the walled gardens run by corporate actors such as Anthropic or OpenAI.";

/** every line the essay shows, in reading order, for the docs search */
export const ESSAY_TEXT: readonly string[] = [
  PARTS.traces.title,
  BODY[0],
  PARTS.review.title,
  BODY[1],
  PARTS.winners.title,
  BODY[2],
  PARTS.permissions.title,
  BODY[3],
  ASIDE,
  PARTS.commons.title,
  PROBLEMS_INTRO,
  ...PROBLEMS.flatMap((problem) => [problem.point, ...problem.details]),
  PARTS.tools.title,
  CLOSING,
];

function Part({ part }: { part: (typeof PARTS)[keyof typeof PARTS] }) {
  return <h2 id={part.id}>{part.title}</h2>;
}

function Paragraph({ text }: { text: string }) {
  return (
    <p>
      <Rich text={text} />
    </p>
  );
}

export default function ReclaimingDataAutonomy() {
  return (
    <>
      <Part part={PARTS.traces} />
      <Paragraph text={BODY[0]} />

      <Part part={PARTS.review} />
      <Paragraph text={BODY[1]} />

      <Part part={PARTS.winners} />
      <Paragraph text={BODY[2]} />

      <Part part={PARTS.permissions} />
      <Paragraph text={BODY[3]} />
      <aside className="essay-aside">
        <Paragraph text={ASIDE} />
      </aside>

      <Part part={PARTS.commons} />
      <p>{PROBLEMS_INTRO}</p>
      <ul className="dx-bullets essay-problems">
        {PROBLEMS.map((problem) => (
          <li key={problem.point}>
            {problem.point}
            <ul>
              {problem.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <Part part={PARTS.tools} />
      <p>{CLOSING}</p>
    </>
  );
}
