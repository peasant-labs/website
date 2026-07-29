import { EvidenceCitations, HeroFigure } from "@/components/project-detail";
import {
  COMPARISON,
  PROJECT_ORDER,
  PROJECTS,
  SUITE,
  metadataForRoute,
  type ComparisonCell,
} from "@/lib/projects";
import { Breadcrumb, CardImg } from "@peasant-labs/fairtrade/ui";
import type { AnchorHTMLAttributes, ComponentType } from "react";

export const metadata = metadataForRoute(SUITE.metadata);

type LinkedCardProps = Parameters<typeof CardImg>[0] &
  AnchorHTMLAttributes<HTMLAnchorElement>;

const LinkedCard = CardImg as ComponentType<LinkedCardProps>;

function ComparisonCellContent({ cell }: { cell: ComparisonCell }) {
  return (
    <>
      <span className="pj-status" data-status={cell.status}>
        {cell.status}
      </span>
      <p className="pj-table-qualification" data-qualification>
        {cell.qualification}
      </p>
      <EvidenceCitations ids={cell.evidence} />
    </>
  );
}

function ComparisonTable() {
  const groupLabels = new Map(COMPARISON.groups.map((group) => [group.id, group.label]));

  return (
    <section id="comparison" className="pj-section pj-comparison" data-comparison>
      <div className="pj-section-heading">
        <h2>{COMPARISON.title}</h2>
        <p data-bundle-definition data-reading-text>
          {COMPARISON.bundleDefinition}
        </p>
        <p className="pj-comparison-meta tnum">
          verified {COMPARISON.verifiedOn}; reverify by {COMPARISON.reverifyBy}; review owner: {COMPARISON.reviewOwner}
        </p>
        <p className="pj-meaning-note" data-reading-text>
          {COMPARISON.meaningNote}
        </p>
        <p className="pj-change-note" data-reading-text>
          {COMPARISON.changeNote}
        </p>
      </div>
      <p id="comparison-scroll-help" className="pj-table-help">
        {COMPARISON.scrollHelp}
      </p>
      <div
        className="tbl-wrap pj-table-wrap"
        data-table-scroll
        data-contained-overflow
        role="region"
        aria-label="Peasant Labs and Entire comparison"
        aria-describedby="comparison-scroll-help"
        tabIndex={0}
      >
        <table className="tbl pj-comparison-table">
          <caption className="tbl-caption">{COMPARISON.caption}</caption>
          <thead>
            <tr>
              <th className="tbl-th" scope="col">
                capability
              </th>
              <th className="tbl-th" scope="col">
                Peasant Labs
              </th>
              <th className="tbl-th" scope="col">
                Entire
              </th>
              <th className="tbl-th" scope="col">
                takeaway
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.rows.map((row, index) => {
              const startsGroup = index === 0 || COMPARISON.rows[index - 1].group !== row.group;
              return (
                <tr
                  key={row.id}
                  className="tbl-row"
                  data-comparison-row={row.id}
                  data-comparison-group={row.group}
                >
                  <th className="tbl-td pj-capability" scope="row">
                    {startsGroup ? (
                      <span className="pj-table-group">{groupLabels.get(row.group)}</span>
                    ) : null}
                    <span data-row-id={row.id}>{row.capability}</span>
                  </th>
                  <td
                    className="tbl-td"
                    data-comparison-side="peasant-labs"
                    data-source-scope={row.peasantLabs.sourceScope}
                  >
                    <ComparisonCellContent cell={row.peasantLabs} />
                  </td>
                  <td
                    className="tbl-td"
                    data-comparison-side="entire"
                    data-source-scope={row.entire.sourceScope}
                  >
                    <ComparisonCellContent cell={row.entire} />
                  </td>
                  <td className="tbl-td pj-takeaway" data-takeaway>
                    {row.takeaway}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <main id="content" className="pj-main" tabIndex={-1}>
      <Breadcrumb
        label="project path"
        items={[{ label: "Peasant Labs", href: "/" }, { label: "projects" }]}
      />

      <header className="pj-catalog-hero">
        <div className="pj-hero-copy">
          <h1 id="project-heading" tabIndex={-1}>
            {SUITE.title}
          </h1>
          <p className="pj-lede" data-reading-text>
            {SUITE.intro}
          </p>
        </div>
        <HeroFigure figure={SUITE.figure} />
      </header>

      <section className="pj-section" aria-labelledby="project-catalog-heading">
        <div className="pj-section-heading">
          <h2 id="project-catalog-heading">two parts of one boundary</h2>
          <p data-reading-text>start with the local record or the governed published copy.</p>
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
                head={<span className="pj-product-name">{project.name}</span>}
                title={project.name}
                desc={project.card.outcome}
                bullets={[...project.card.proof]}
                foot={
                  <>
                    <span>{project.card.availability}</span>
                    <span className="pj-card-action">{project.card.action}</span>
                  </>
                }
              >
                <EvidenceCitations ids={project.card.evidence} />
              </LinkedCard>
            );
          })}
        </div>
      </section>

      <section className="pj-section" aria-labelledby="suite-story-heading">
        <div className="pj-section-heading">
          <h2 id="suite-story-heading">{SUITE.storyTitle}</h2>
          <p data-reading-text>local discovery and shared publication remain separate decisions.</p>
        </div>
        <ol className="pj-suite-story">
          {SUITE.story.map((step, index) => (
            <li key={step.id} data-suite-story={step.id}>
              <span className="pj-story-number tnum" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p data-reading-text>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="pj-section pj-contract" data-suite-contract aria-labelledby="contract-heading">
        <h2 id="contract-heading">{SUITE.contractTitle}</h2>
        <p data-reading-text>{SUITE.contractBody}</p>
        <EvidenceCitations ids={SUITE.contractEvidence} />
      </section>

      <ComparisonTable />
    </main>
  );
}
