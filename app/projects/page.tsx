import { ProjectCommand } from "@/components/project-client";
import { TranscriptDemo } from "@/components/transcript-demo";
import {
  COMPARISON,
  COMPARISON_MARKS,
  PROJECT_ORDER,
  PROJECTS,
  REDACTION,
  SUITE,
  metadataForRoute,
  type ComparisonStatus,
} from "@/lib/projects";
import { Accordion, CardImg, CliSteps } from "@/components/fairtrade-client";
import { RedactionDemo } from "@/components/redaction-demo";
import type { AnchorHTMLAttributes, ComponentType, HTMLAttributes } from "react";

export const metadata = metadataForRoute(SUITE.metadata);

type LinkedCardProps = Parameters<typeof CardImg>[0] &
  AnchorHTMLAttributes<HTMLAnchorElement>;
type AccordionProps = Parameters<typeof Accordion>[0];
/* CliSteps spreads unrecognised props onto its root; its types stop at the named ones. */
type StepsProps = Parameters<typeof CliSteps>[0] & HTMLAttributes<HTMLElement>;

const LinkedCard = CardImg as ComponentType<LinkedCardProps>;
const Faq = Accordion as ComponentType<AccordionProps>;
const Steps = CliSteps as ComponentType<StepsProps>;

/**
 * The install line sits directly under the hero, the way a reader who has
 * already decided expects to find it — before any further explanation. It is one
 * command and nothing else: the walkthrough further down says what the line does
 * and what comes after it.
 */
function Install() {
  return (
    <section className="pj-install" data-install aria-label="install peasant">
      <ProjectCommand command={SUITE.install.command} label="install peasant" />
    </section>
  );
}

/**
 * The live transcript browser reading a demonstration session: the actual
 * product surface rather than a promise of a screenshot. It sits after the
 * community section, once a reader has been told what the products are and what
 * the project is for — by then a look at the real thing answers a question they
 * are already asking.
 */
function Viewer() {
  return (
    <section className="pj-section pj-viewer" data-viewer aria-labelledby="viewer-heading">
      <div className="pj-section-heading">
        <h2 id="viewer-heading">{SUITE.viewerTitle}</h2>
        <p data-reading-text>{SUITE.viewerIntro}</p>
      </div>
      <TranscriptDemo label={SUITE.viewerLabel} />
      {/*
       * Sample data must still say so, but under the panel rather than over it:
       * the gap above carries the rail out of the walkthrough and into the
       * viewer, and a line of small print sitting in it breaks that join.
       */}
      <p className="pj-demo-note pj-demo-note-after" data-reading-text>
        {SUITE.viewerNote}
      </p>
    </section>
  );
}

/**
 * What the project is, in one paragraph. The cards that used to sit here now
 * have a section of their own further down: a reader meeting the name for the
 * first time needs the sentence, not two products to choose between.
 */
function WhatItIs() {
  return (
    <section className="pj-section" data-what aria-labelledby="what-heading">
      <div className="pj-section-heading">
        <h2 id="what-heading">{SUITE.whatTitle}</h2>
        <p data-reading-text>{SUITE.whatIntro}</p>
      </div>
    </section>
  );
}

/**
 * The two products, side by side, immediately before the comparison. By this
 * point a reader has seen what the project does and how it handles their work,
 * so a card is a route into one of them rather than an introduction.
 */
function Tools() {
  return (
    <section className="pj-section" data-tools aria-labelledby="tools-heading">
      <div className="pj-section-heading">
        <h2 id="tools-heading">{SUITE.cardsTitle}</h2>
        <p data-reading-text>{SUITE.cardsIntro}</p>
      </div>

      <div className="pj-card-grid">
        {PROJECT_ORDER.map((slug) => {
          const project = PROJECTS[slug];
          return (
            <LinkedCard
              key={slug}
              link
              href={project.route}
              className="pj-project-card"
              data-project-card={slug}
              /* The word this card is filed under, above the product's own name. */
              head={<span className="pj-card-kind">{project.card.kind}</span>}
              title={project.name}
              desc={project.card.outcome}
              bullets={[...project.card.proof]}
              foot={
                <>
                  {/*
                   * Availability is the qualifier a reader needs before they act on the
                   * card, so it carries a mark of its own rather than sitting as plain
                   * text beside the accented action.
                   */}
                  <span className="pj-card-availability">{project.card.availability}</span>
                  <span className="pj-card-action">{project.card.action}</span>
                </>
              }
            />
          );
        })}
      </div>
    </section>
  );
}

/**
 * The redaction review, running on demonstration matches. It sits after the
 * community section because "nothing leaves until you send it" invites the
 * obvious next question — what happens to what I do send — and this is the
 * screen that answers it.
 */
function Redaction() {
  return (
    <section
      className="pj-section pj-redaction"
      data-redaction
      aria-labelledby="redaction-heading"
    >
      <div className="pj-section-heading">
        <h2 id="redaction-heading">{REDACTION.title}</h2>
        <p data-reading-text>{REDACTION.intro}</p>
      </div>

      <p className="pj-demo-note" data-reading-text>
        {REDACTION.note}
      </p>
      {/*
       * The panel carries invented matches, so its text is quoted sample content
       * rather than authored site copy — `data-redaction-demo` keeps it out of
       * the lowercase-copy scan the same way the transcript demo is kept out.
       */}
      <div className="pj-redaction-demo" data-redaction-demo>
        <RedactionDemo label={REDACTION.label} />
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="pj-section pj-story-section" data-story aria-labelledby="story-heading">
      <div className="pj-section-heading">
        <h2 id="story-heading">{SUITE.story.title}</h2>
        <p data-reading-text>{SUITE.story.situation}</p>
      </div>

      {/*
       * The sequence itself, in the design system's own onboarding component:
       * numbered steps carrying the command each one runs, every command
       * copyable where a reader is already reading about it.
       */}
      <Steps
        className="pj-story-steps"
        data-story-steps
        steps={[...SUITE.story.steps]}
        label={SUITE.story.stepsLabel}
      />
    </section>
  );
}

function Community() {
  return (
    <section
      className="pj-section pj-community"
      data-community
      aria-labelledby="community-heading"
    >
      <h2 id="community-heading">{SUITE.community.title}</h2>
      <p data-reading-text>{SUITE.community.body}</p>
      <ul>
        {SUITE.community.points.map((point) => (
          <li key={point} data-community-point>
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ComparisonMark({ status }: { status: ComparisonStatus }) {
  const mark = COMPARISON_MARKS[status];

  return (
    <span className="pj-status" data-status={status}>
      <span className="pj-status-glyph" aria-hidden="true">
        {mark.glyph}
      </span>
      {mark.label}
    </span>
  );
}

function ComparisonTable() {
  return (
    <section
      id="comparison"
      className="pj-section pj-comparison"
      data-comparison
      aria-labelledby="comparison-heading"
    >
      <div className="pj-section-heading">
        <h2 id="comparison-heading">{COMPARISON.title}</h2>
        <p data-reading-text>{COMPARISON.intro}</p>
        <p data-bundle-definition data-reading-text>
          {COMPARISON.bundleDefinition}
        </p>
        <p className="pj-meaning-note" data-reading-text>
          {COMPARISON.meaningNote}
        </p>
      </div>

      <div
        className="tbl-wrap pj-table-wrap"
        data-table-scroll
        data-contained-overflow
        role="region"
        aria-label="peasant labs and similar tools comparison"
        tabIndex={0}
      >
        {/* No caption: the section heading names the table for assistive tech. */}
        <table className="tbl pj-comparison-table" aria-labelledby="comparison-heading">
          <thead>
            <tr>
              <th className="tbl-th" scope="col">
                what you can do
              </th>
              <th className="tbl-th" scope="col">
                peasant labs
              </th>
              <th className="tbl-th" scope="col">
                similar tools
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.rows.map((row) => (
              <tr key={row.id} className="tbl-row" data-comparison-row={row.id}>
                <th className="tbl-td pj-capability" scope="row">
                  <span data-row-id={row.id}>{row.capability}</span>
                </th>
                <td
                  className="tbl-td pj-mark-cell"
                  data-comparison-side="peasant-labs"
                >
                  <ComparisonMark status={row.peasantLabs.status} />
                </td>
                <td className="tbl-td pj-mark-cell" data-comparison-side="entire">
                  <ComparisonMark status={row.entire.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Questions() {
  return (
    <section className="pj-section pj-faq" data-faq aria-labelledby="faq-heading">
      <div className="pj-section-heading">
        <h2 id="faq-heading">{SUITE.faq.title}</h2>
      </div>
      <div data-faq-list>
        <Faq
          aria-label={SUITE.faq.label}
          items={SUITE.faq.questions.map((entry) => ({
            id: entry.id,
            title: entry.question,
            content: <p data-reading-text>{entry.answer}</p>,
          }))}
        />
      </div>
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <main id="content" className="pj-main" tabIndex={-1}>
      {/* No breadcrumb: the header nav is the way out of this page now. */}
      <header className="pj-catalog-hero">
        <div className="pj-hero-copy">
          <h1 id="project-heading" tabIndex={-1}>
            {SUITE.title}
          </h1>
          <p className="pj-lede" data-reading-text>
            {SUITE.intro}
          </p>
        </div>
      </header>

      <Install />
      <WhatItIs />
      <Story />
      <Viewer />
      <Community />
      <Redaction />
      <Tools />
      <ComparisonTable />
      <Questions />
    </main>
  );
}
