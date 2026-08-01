"use client";

import { ConsentSummary } from "@/components/fairtrade-client";
import { GOVERNANCE_AXES, GOVERNANCE_CAPTION } from "@/components/village-consent";

type VillageGovernanceProps = {
  title: string;
  body: string;
};

/**
 * Governance explainer: fairtrade ConsentSummary (left) states every axis a
 * collective governs, prose (right) frames why the terms are written out first.
 */
export function VillageGovernance({ title, body }: VillageGovernanceProps) {
  return (
    <section
      className="pj-section pj-village-governance"
      data-village-governance
      aria-labelledby="village-governance-heading"
    >
      <div className="pj-village-governance-card card" data-village-governance-card>
        <ConsentSummary caption={GOVERNANCE_CAPTION} axes={[...GOVERNANCE_AXES]} />
      </div>

      <div className="pj-village-governance-copy">
        <h2 id="village-governance-heading">{title}</h2>
        <p data-reading-text>{body}</p>
      </div>
    </section>
  );
}