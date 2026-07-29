import { EvidenceCitations, ProjectDetail } from "@/components/project-detail";
import { PROJECTS, metadataForRoute } from "@/lib/projects";

const project = PROJECTS.village;

export const metadata = metadataForRoute(project.metadata);

function VillageFlow() {
  return (
    <section className="pj-section pj-flow" data-project-flow aria-labelledby="village-flow-heading">
      <div className="pj-section-heading">
        <h2 id="village-flow-heading">{project.flow.title}</h2>
        <p data-reading-text>{project.flow.intro}</p>
      </div>
      <ol>
        {project.flow.steps.map((step, index) => (
          <li key={step}>
            <span className="tnum" aria-hidden="true">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <EvidenceCitations ids={project.flow.evidence} />
    </section>
  );
}

function VillageProof() {
  return (
    <section className="pj-section pj-proof" data-project-proof aria-labelledby="village-proof-heading">
      <h2 id="village-proof-heading">{project.proof.title}</h2>
      <p data-reading-text>{project.proof.body}</p>
      <ul>
        {project.proof.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <EvidenceCitations ids={project.proof.evidence} />
    </section>
  );
}

export default function VillagePage() {
  return <ProjectDetail project={project} flow={<VillageFlow />} proof={<VillageProof />} />;
}
