import type { Metadata } from "next";

export const SITE_URL = "https://peasantlabs.org" as const;
export const SITE_NAME = "peasant labs" as const;

export type ProjectSlug = "peasant" | "village";
export type Three<T> = readonly [T, T, T];
export type Four<T> = readonly [T, T, T, T];
export type Five<T> = readonly [T, T, T, T, T];
export type Six<T> = readonly [T, T, T, T, T, T];

export type AdvertisedState =
  | "public-release"
  | "private-preview"
  | "current-source"
  | "private-contributor-development"
  | "not-publicly-available";

export type ComparisonStatus = "yes" | "partial" | "not-documented";

export type SourceScope =
  | AdvertisedState
  | "vendor-documented"
  | "bundle-definition";

export const EVIDENCE_IDS = [
  "peasant-rc2-private-release",
  "peasant-current-corpus-2026-07-28",
  "peasant-readme",
  "peasant-adapters",
  "peasant-selection-redaction",
  "peasant-search",
  "peasant-pull",
  "peasant-license",
  "peasant-schema-pin",
  "village-readme",
  "village-collectives",
  "village-governance",
  "village-schema-pin",
  "schema-rc10",
  "schema-current",
  "fairtrade-0.0.9",
  "bundle-definition",
  "entire-home",
  "entire-projects",
  "entire-docs-index",
  "entire-cli-repo",
  "entire-cli-v0.9.0",
  "entire-quickstart",
  "entire-agents",
  "entire-security",
  "entire-checkpoint-storage",
  "entire-keep-local",
  "entire-separate-repo",
  "entire-import-history",
  "entire-platform",
  "entire-search",
  "entire-dispatches",
  "entire-repositories",
  "entire-repository-limitations",
  "entire-privacy",
  "entire-terms",
  "entire-declared-corpus-2026-07-28",
] as const;

export type EvidenceId = (typeof EVIDENCE_IDS)[number];
export type DateString = `${number}-${number}-${number}`;
export type HttpsUrl = `https://${string}`;
export type InternalHref = `/${string}`;
export type PublicHref = InternalHref | HttpsUrl;

export type EvidenceRecord = Readonly<{
  id: EvidenceId;
  label: string;
  claim: string;
  sourceScope: SourceScope;
  advertisedState?: AdvertisedState;
  revisionOrVersion: string;
  verifiedOn: DateString;
  reverifyBy: DateString;
  reviewOwner: string;
  internalProvenance: string;
  sourceIds: readonly EvidenceId[];
  publicHref?: HttpsUrl;
  publishedOn?: string;
}>;

const REVIEW = {
  verifiedOn: "2026-09-01",
  reverifyBy: "2026-10-01",
  reviewOwner: "peasant labs website maintainers",
} as const;

export const EVIDENCE = {
  "peasant-rc2-private-release": {
    id: "peasant-rc2-private-release",
    label: "peasant public release",
    claim: "The observed peasant product release is the public v0.4.0 release.",
    sourceScope: "public-release",
    advertisedState: "public-release",
    revisionOrVersion:
      "v0.4.0 at c2b2aeeb7c9d8c82de7ac560da62d0aa4689ca7f",
    internalProvenance: "peasant public release tag and commit",
    sourceIds: [],
    publicHref: "https://github.com/peasant-labs/peasant/releases/tag/v0.4.0",
    publishedOn: "2026-08-26T23:32:54Z",
    ...REVIEW,
  },
  "peasant-current-corpus-2026-07-28": {
    id: "peasant-current-corpus-2026-07-28",
    label: "peasant current-source corpus",
    claim:
      "The reviewed peasant corpus covers its README, adapter registry, search, Kickstart, pull, and license state.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "d0eebce058e8fb170bc6f4d730f990d3a8aab569",
    internalProvenance: "peasant current source reviewed at the pinned revision",
    sourceIds: [],
    ...REVIEW,
  },
  "peasant-readme": {
    id: "peasant-readme",
    label: "peasant current README",
    claim:
      "peasant documents local SQLite storage, normalized transcript detail, explicit village push and pull, analytics, and Git associations where observed.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "d0eebce058e8fb170bc6f4d730f990d3a8aab569",
    internalProvenance: "peasant/develop/README.md",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-adapters": {
    id: "peasant-adapters",
    label: "peasant adapter registry",
    claim:
      "Current source registers adapters for Claude Code, OpenCode, Codex, Cursor, and Strike.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "d0eebce058e8fb170bc6f4d730f990d3a8aab569",
    internalProvenance: "peasant/develop/internal/ingest/adapter.go:251-268",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-selection-redaction": {
    id: "peasant-selection-redaction",
    label: "peasant selection and redaction guide",
    claim:
      "Kickstart persists selected projects, branches, and sessions and documents Standard redaction for later explicit sharing.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "d0eebce058e8fb170bc6f4d730f990d3a8aab569",
    internalProvenance: "peasant/develop/docs/KICKSTART.md:20-35",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-search": {
    id: "peasant-search",
    label: "peasant local full-text search",
    claim:
      "Current source provides local FTS5 full-text search over recorded message entries.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "d0eebce058e8fb170bc6f4d730f990d3a8aab569",
    internalProvenance:
      "peasant/develop/internal/store/schema_v35.go and internal/api/provider.go",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-pull": {
    id: "peasant-pull",
    label: "peasant village pull guide",
    claim:
      "Pulled foreign transcripts use a separate one-way namespace and do not become owned analytics or re-push candidates.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "d0eebce058e8fb170bc6f4d730f990d3a8aab569",
    internalProvenance: "peasant/develop/docs/pull.md",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-license": {
    id: "peasant-license",
    label: "peasant Apache-2.0 license",
    claim:
      "peasant is licensed under Apache-2.0; content licenses attached to published data are separate.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "d0eebce058e8fb170bc6f4d730f990d3a8aab569",
    internalProvenance: "peasant/develop/LICENSE and README.md:884-891",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    publicHref: "https://github.com/peasant-labs/peasant/blob/develop/LICENSE",
    ...REVIEW,
  },
  "peasant-schema-pin": {
    id: "peasant-schema-pin",
    label: "peasant schema consumer pin",
    claim: "peasant consumes github.com/peasant-labs/schema v0.1.2.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion:
      "peasant d0eebce058e8fb170bc6f4d730f990d3a8aab569, schema v0.1.2",
    internalProvenance: "peasant/develop/go.mod:15",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "village-readme": {
    id: "village-readme",
    label: "village current README",
    claim:
      "village stores selected published copies and documents a private contributor Docker Compose stack and peasant-driven publishing.",
    sourceScope: "current-source",
    advertisedState: "private-contributor-development",
    revisionOrVersion: "652390acfdff46379d2ea489fb4b178780a1982e",
    internalProvenance: "village/develop/README.md",
    sourceIds: [],
    ...REVIEW,
  },
  "village-collectives": {
    id: "village-collectives",
    label: "village collective controls",
    claim:
      "Current source describes collectives as groups governing shared data with open and curated contribution modes.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "652390acfdff46379d2ea489fb4b178780a1982e",
    internalProvenance:
      "village/develop/frontend/src/app/groups and collective settings routes",
    sourceIds: ["village-readme"],
    ...REVIEW,
  },
  "village-governance": {
    id: "village-governance",
    label: "village governance invariants",
    claim:
      "village documents optional CC licensing, public/private/shared visibility, trigger-written append-only governance events, and SQL-enforced pull authorization.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "652390acfdff46379d2ea489fb4b178780a1982e",
    internalProvenance: "village/develop/docs/database-invariants.md",
    sourceIds: ["village-readme"],
    ...REVIEW,
  },
  "village-schema-pin": {
    id: "village-schema-pin",
    label: "village schema consumer pin",
    claim: "village consumes github.com/peasant-labs/schema v0.1.2.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion:
      "village 652390acfdff46379d2ea489fb4b178780a1982e, schema v0.1.2",
    internalProvenance: "village/develop/backend/go.mod:18",
    sourceIds: ["village-readme"],
    ...REVIEW,
  },
  "schema-rc10": {
    id: "schema-rc10",
    label: "Public schema v0.1.3-rc1 release",
    claim:
      "The public Apache-2.0 schema release provides canonical Go, TypeScript, Zod, and OpenAPI contracts.",
    sourceScope: "public-release",
    advertisedState: "public-release",
    revisionOrVersion:
      "v0.1.3-rc1 at acc978020f1daf94bcfd12014af8a004c7155e94",
    internalProvenance: "schema release and commit-pinned README",
    sourceIds: [],
    publicHref:
      "https://github.com/peasant-labs/schema/releases/tag/v0.1.3-rc1",
    publishedOn: "2026-08-30T14:57:15Z",
    ...REVIEW,
  },
  "schema-current": {
    id: "schema-current",
    label: "schema current source",
    claim:
      "Current schema source identifies Village API 0.14.0, Peasant Local API 0.9.0, and Types 0.14.0.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "89265812bb7856e97f2c213ee1c97128a27d7d48",
    internalProvenance: "schema/develop/README.md and versions.go",
    sourceIds: ["schema-rc10"],
    publicHref: "https://github.com/peasant-labs/schema",
    ...REVIEW,
  },
  "fairtrade-0.0.9": {
    id: "fairtrade-0.0.9",
    label: "fairtrade 0.0.9 package",
    claim:
      "The published package provides the canonical tokens, base styles, component CSS, icons, and React UI exports used by these pages.",
    sourceScope: "public-release",
    advertisedState: "public-release",
    revisionOrVersion:
      "0.0.9, tag fairtrade-v0.0.9 at ba3ff1e1c1558e250c54c215589acba2dfdbad87",
    internalProvenance:
      "npm tarball sha512-roEJAbbZyed5WlkxI/sAZGa+1Ve9NyVLZ6I9Df4xuVeAVUQgVyHIh1WxJcMKYejMbOwWM9jKo3LS3sW1EDpRUw==",
    sourceIds: [],
    publicHref:
      "https://registry.npmjs.org/@peasant-labs/fairtrade/-/fairtrade-0.0.9.tgz",
    publishedOn: "2026-07-27T06:26:09.770Z",
    ...REVIEW,
  },
  "bundle-definition": {
    id: "bundle-definition",
    label: "Comparison bundle definition",
    claim:
      "peasant labs means peasant plus village plus schema; Entire means Entire CLI plus Entire.io and its documented repository service.",
    sourceScope: "bundle-definition",
    revisionOrVersion: "comparison scope verified 2026-09-01",
    internalProvenance:
      "project comparison research, balanced comparison scope",
    sourceIds: [
      "peasant-current-corpus-2026-07-28",
      "village-readme",
      "schema-rc10",
      "entire-declared-corpus-2026-07-28",
    ],
    ...REVIEW,
  },
  "entire-home": {
    id: "entire-home",
    label: "Entire homepage",
    claim: "Entire describes checkpoint capture, search, review, resume, and Git mirror product positioning.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire homepage",
    sourceIds: [],
    publicHref: "https://entire.io/",
    ...REVIEW,
  },
  "entire-projects": {
    id: "entire-projects",
    label: "Entire projects access page",
    claim: "The Entire projects URL is sign-in gated for signed-out review.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire projects page",
    sourceIds: [],
    publicHref: "https://entire.io/projects",
    ...REVIEW,
  },
  "entire-docs-index": {
    id: "entire-docs-index",
    label: "Entire documentation index",
    claim: "The official documentation index defines the reviewed documentation corpus.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor docs index reviewed 2026-09-01",
    internalProvenance: "Official Entire llms.txt index",
    sourceIds: [],
    publicHref: "https://docs.entire.io/llms.txt",
    ...REVIEW,
  },
  "entire-cli-repo": {
    id: "entire-cli-repo",
    label: "Entire CLI repository",
    claim: "Entire publishes its CLI repository and MIT license context.",
    sourceScope: "public-release",
    advertisedState: "public-release",
    revisionOrVersion: "public repository reviewed 2026-09-01",
    internalProvenance: "Official Entire CLI repository",
    sourceIds: [],
    publicHref: "https://github.com/entireio/cli",
    ...REVIEW,
  },
  "entire-cli-v0.9.0": {
    id: "entire-cli-v0.9.0",
    label: "Entire CLI v0.10.2",
    claim: "Entire CLI v0.10.2 is a stable public release.",
    sourceScope: "public-release",
    advertisedState: "public-release",
    revisionOrVersion:
      "v0.10.2 at bc990baa5bd37a6cb9d1becb02fe0bd83afdb3de",
    internalProvenance: "Official Entire CLI release",
    sourceIds: ["entire-cli-repo"],
    publicHref: "https://github.com/entireio/cli/releases/tag/v0.10.2",
    publishedOn: "2026-08-19T20:18:45Z",
    ...REVIEW,
  },
  "entire-quickstart": {
    id: "entire-quickstart",
    label: "Entire quickstart",
    claim: "Entire documents checkpoint setup and a Git-linked workflow.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire quickstart",
    sourceIds: [],
    publicHref: "https://docs.entire.io/quickstart",
    ...REVIEW,
  },
  "entire-agents": {
    id: "entire-agents",
    label: "Entire agent integrations",
    claim:
      "Entire documents eight named built-ins, executable plugins, captured context, and agent-specific resume limits.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire agents overview",
    sourceIds: [],
    publicHref: "https://docs.entire.io/agents/overview",
    ...REVIEW,
  },
  "entire-security": {
    id: "entire-security",
    label: "Entire security documentation",
    claim:
      "Entire documents built-in secret detection, custom patterns, optional PII layers, and best-effort redaction limits.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire security page",
    sourceIds: [],
    publicHref: "https://docs.entire.io/security",
    ...REVIEW,
  },
  "entire-checkpoint-storage": {
    id: "entire-checkpoint-storage",
    label: "Entire checkpoint storage",
    claim:
      "Entire documents checkpoint storage with code, local operation, and separate-repository options.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire checkpoint storage guide",
    sourceIds: [],
    publicHref:
      "https://docs.entire.io/guides/checkpoints/checkpoint-storage",
    ...REVIEW,
  },
  "entire-keep-local": {
    id: "entire-keep-local",
    label: "Entire local checkpoint mode",
    claim: "Entire documents keeping checkpoints local with push disabled.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire local checkpoint guide",
    sourceIds: [],
    publicHref:
      "https://docs.entire.io/guides/checkpoints/keep-checkpoints-local",
    ...REVIEW,
  },
  "entire-separate-repo": {
    id: "entire-separate-repo",
    label: "Entire separate repository storage",
    claim:
      "Entire documents storing checkpoints in a separate same-owner GitHub repository.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire separate repository guide",
    sourceIds: [],
    publicHref:
      "https://docs.entire.io/guides/checkpoints/store-checkpoints-in-another-repo",
    ...REVIEW,
  },
  "entire-import-history": {
    id: "entire-import-history",
    label: "Entire historical import",
    claim:
      "Entire documents read-only searchable historical imports that are not Git-linked or rewindable.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire historical import guide",
    sourceIds: [],
    publicHref:
      "https://docs.entire.io/guides/sessions/import-past-agent-history",
    ...REVIEW,
  },
  "entire-platform": {
    id: "entire-platform",
    label: "Entire.io platform",
    claim:
      "Entire documents repository, checkpoint, session, activity, search, dispatch, and shared-summary browsing.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire.io platform guide",
    sourceIds: [],
    publicHref: "https://docs.entire.io/platforms/entire-io",
    ...REVIEW,
  },
  "entire-search": {
    id: "entire-search",
    label: "Entire semantic search",
    claim:
      "Entire documents hybrid semantic and keyword search across checkpoints, sessions, and commits.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire semantic search guide",
    sourceIds: [],
    publicHref:
      "https://docs.entire.io/guides/search/overview",
    ...REVIEW,
  },
  "entire-dispatches": {
    id: "entire-dispatches",
    label: "Entire dispatches",
    claim:
      "Entire documents shareable Markdown summaries across repositories, branches, and time windows.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire dispatches guide",
    sourceIds: [],
    publicHref: "https://docs.entire.io/guides/dispatches/overview",
    ...REVIEW,
  },
  "entire-repositories": {
    id: "entire-repositories",
    label: "Entire repository service",
    claim:
      "Entire documents regional EntireDB Git repositories and GitHub-backed mirrors while GitHub remains the upstream repository.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire repositories overview",
    sourceIds: [],
    publicHref: "https://docs.entire.io/guides/repositories/overview",
    ...REVIEW,
  },
  "entire-repository-limitations": {
    id: "entire-repository-limitations",
    label: "Entire repository limitations",
    claim:
      "Entire documents a current Git LFS limitation and a GitHub LFS workaround.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire mirrors guide",
    sourceIds: [],
    publicHref: "https://docs.entire.io/guides/repositories/mirrors",
    ...REVIEW,
  },
  "entire-privacy": {
    id: "entire-privacy",
    label: "Entire privacy policy",
    claim: "The Entire privacy policy is part of the declared review corpus.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire privacy policy",
    sourceIds: [],
    publicHref: "https://entire.io/privacy",
    ...REVIEW,
  },
  "entire-terms": {
    id: "entire-terms",
    label: "Entire terms",
    claim: "The Entire terms are part of the declared review corpus.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-09-01",
    internalProvenance: "Official Entire terms",
    sourceIds: [],
    publicHref: "https://entire.io/terms",
    ...REVIEW,
  },
  "entire-declared-corpus-2026-07-28": {
    id: "entire-declared-corpus-2026-07-28",
    label: "Entire declared corpus",
    claim:
      "The reviewed official corpus found no affirmative equivalent for specific licensing, collective, policy-history, or one-way ownership semantics.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "declared official corpus reviewed 2026-09-01",
    internalProvenance:
      "Entire homepage, projects, legal pages, public CLI, release notes, and indexed product documentation",
    sourceIds: [
      "entire-home",
      "entire-projects",
      "entire-docs-index",
      "entire-cli-repo",
      "entire-cli-v0.9.0",
      "entire-quickstart",
      "entire-agents",
      "entire-security",
      "entire-checkpoint-storage",
      "entire-keep-local",
      "entire-separate-repo",
      "entire-import-history",
      "entire-platform",
      "entire-search",
      "entire-dispatches",
      "entire-repositories",
      "entire-repository-limitations",
      "entire-privacy",
      "entire-terms",
    ],
    publicHref: "https://docs.entire.io/llms.txt",
    ...REVIEW,
  },
} as const satisfies Record<EvidenceId, EvidenceRecord>;

type EvidenceBacked = Readonly<{
  evidence: readonly [EvidenceId, ...EvidenceId[]];
}>;

export type RouteMetadata = Readonly<{
  title: string;
  description: string;
  canonical: InternalHref;
}>;

export type ProjectFeature = EvidenceBacked &
  Readonly<{
    id: string;
    title: string;
    body: string;
    qualification: string;
    state: AdvertisedState;
  }>;

export type ProjectInstruction = EvidenceBacked &
  Readonly<{
    id: string;
    title: string;
    body: string;
    qualification: string;
    state: AdvertisedState;
    command?: string;
    action?: Readonly<{
      label: string;
      accessibleName: string;
      href: HttpsUrl;
    }>;
  }>;

export type ProjectStory = EvidenceBacked &
  Readonly<{
    id: string;
    actor: string;
    need: string;
    action: string;
    outcome: string;
  }>;

export type RepresentativeOutput = EvidenceBacked &
  Readonly<{
    id: string;
    label: string;
    qualification: string;
    state: AdvertisedState;
    lines: readonly [string, ...string[]];
  }>;

export type ProjectLink = Readonly<{
  id: string;
  label: string;
  href: PublicHref;
  kind: "internal" | "public-source";
}>;

export type HeroFigureContent = Readonly<{
  accessibleName: string;
  stateText: string;
  caption: string;
}>;

export type ProjectCard = Readonly<{
  /** the one word the card is filed under in the two-tools section. */
  kind: string;
  outcome: string;
  proof: readonly [string, string, string];
  action: string;
  availability: string;
}>;

/** one situation peasant helps with, stated in a reader's own terms. */
export type PeasantUse = Readonly<{
  id: string;
  title: string;
  body: string;
}>;

/**
 * The peasant detail page explains one product to a first-time reader, so it
 * carries plain copy and the sequence that gets them running. Source-scoped
 * evidence, availability qualifiers, and the comparison stay on /projects,
 * where a reader has already asked for them.
 */
export type PeasantPageContent = Readonly<{
  slug: "peasant";
  name: "peasant";
  route: "/projects/peasant";
  metadata: RouteMetadata;
  card: ProjectCard;
  hero: Readonly<{ title: string; body: string }>;
  start: StartSection;
  usesTitle: string;
  usesIntro: string;
  uses: Three<PeasantUse>;
  related: readonly [ProjectLink, ...ProjectLink[]];
}>;

export type VillageExampleCollective = Readonly<{
/** one collective card shown as an example of a community to join. */
  head: string;
  title: string;
  desc: string;
  bullets: readonly [string, string];
  members: string;
  transcripts: string;
  linked: string;
}>;

/**
 * The village detail page is a short product explainer: title, the same
 * get-started wizard pattern as peasant, and a join-community example.
 */
export type VillagePageContent = Readonly<{
  slug: "village";
  name: "village";
  route: "/projects/village";
  metadata: RouteMetadata;
  card: ProjectCard;
  hero: Readonly<{ title: string; body: string }>;
  start: StartSection;
  community: Readonly<{
    title: string;
    body: string;
    joinLabel: string;
  }>;
  example: VillageExampleCollective;
  governance: Readonly<{
    title: string;
    body: string;
  }>;
  related: readonly [ProjectLink, ...ProjectLink[]];
}>;

export type ProjectPageContent = Readonly<{
  slug: ProjectSlug;
  name: "peasant" | "village";
  route: `/projects/${ProjectSlug}`;
  metadata: RouteMetadata;
  card: ProjectCard;
  hero: EvidenceBacked &
    Readonly<{
      title: string;
      body: string;
      state: AdvertisedState;
    }>;
  availability: EvidenceBacked &
    Readonly<{
      title: string;
      body: string;
      qualification: string;
      state: AdvertisedState;
    }>;
  features: Five<ProjectFeature>;
  flow: EvidenceBacked &
    Readonly<{
      title: string;
      intro: string;
      steps: readonly [string, string, string, string, string];
    }>;
  proof: EvidenceBacked &
    Readonly<{
      title: string;
      body: string;
      points: readonly [string, string, string];
    }>;
  access: readonly [ProjectInstruction, ...ProjectInstruction[]];
  run: readonly [ProjectInstruction, ...ProjectInstruction[]];
  stories: readonly [ProjectStory, ...ProjectStory[]];
  outputs: readonly [RepresentativeOutput, ...RepresentativeOutput[]];
  related: readonly [ProjectLink, ...ProjectLink[]];
  requiredEvidence: readonly [EvidenceId, ...EvidenceId[]];
}>;

export const PROJECT_ORDER = ["peasant", "village"] as const satisfies readonly [
  ProjectSlug,
  ProjectSlug,
];

/**
 * One line of the install terminal: a shell comment saying what the step is
 * for, and the command that does it. A step without a command is a
 * prerequisite the reader satisfies away from the terminal.
 */
export type StartStep = Readonly<{
  id: string;
  title: string;
  comment: string;
  command?: string;
}>;

/**
 * One step of the /projects walkthrough, shaped for fairtrade's CliSteps: a
 * numbered marker, a title, the prose that says why, and the command that does
 * it. Unlike a terminal line the body is prose rather than a shell comment,
 * because the component sets it in the body face beside the command block.
 */
export type StoryStep = Readonly<{
  id: string;
  title: string;
  body: string;
  command: string;
}>;

/** the first-run wizard: a rail of named steps, one command in view at a time. */
export type StartSection = Readonly<{
  title: string;
  intro: string;
  stepsLabel: string;
  continueLabel: string;
  doneLabel: string;
  backLabel: string;
  copyAllLabel: string;
  steps: Five<StartStep>;
}>;

/** one question a first-time reader actually asks, answered without hedging. */
export type SuiteQuestion = Readonly<{
  id: string;
  question: string;
  answer: string;
}>;

export const SUITE = {
  metadata: {
    title: "projects | peasant labs",
    description:
      "peasant keeps the sessions your coding agents leave behind on your own machine. village is where you publish the ones worth sharing.",
    canonical: "/projects",
  },
  title: "a commons for AI coding transcripts",
  intro:
    "peasant keeps the sessions your coding agents leave behind on your own machine. village is where you publish the ones worth sharing.",
  /*
   * The heading is the question a colleague actually asks, and the paragraph
   * under it is the situation that question arrives in. The transcript browser
   * below is the answer, so the demo does not need to be announced as one — only
   * declared as sample data, which the note under the heading does.
   */
  viewerTitle: "\"hey, can you help me review this?\"",
  viewerIntro:
    "you spent friday afternoon working through a nasty bug with an agent. on monday someone asks how you fixed it. you want to show them that one session, not hand over everything else you have ever done.",
  /* Under the panel rather than above it: the run of steps connects straight
   * into the viewer, and a line of small print in that gap breaks the join. */
  viewerNote: "sample data, not a real record.",
  viewerLabel: "sample session in the transcript browser",
  install: {
    command: "curl -fsSL https://peasantlabs.org/install | bash",
  },
  whatTitle: "what is peasant labs?",
  // The FAQ answers the licensing question in full. This paragraph only defines
  // the two tools and does not carry legal or availability qualifiers.
  whatIntro:
    "peasant labs makes your coding agent sessions shareable only with people you trust, private, and searchable. it is made of two tools:",
  /* Two lines: the section is what we make, then what that means. The break is
   * authored rather than left to wrapping — `white-space: pre-line` on the
   * heading keeps it wherever the line lands. */
  cardsTitle: "our projects,\nlocal and open-source",
  cardsIntro: "peasant runs on your machine. village is where published copies live.",
  story: {
    title: "install, share, and leverage your data",
    situation:
      "install peasant, read back what your agents already saved, then publish only the session you choose. four commands, and everything before the last one stays on your machine.",
    stepsLabel: "getting started, install to published copy",
    steps: [
      {
        id: "install",
        title: "install",
        body: "one line, no account. puts the peasant binary on your PATH, and everything it does from here runs on this machine.",
        command: "curl -fsSL https://peasantlabs.org/install | bash",
      },
      {
        id: "ingest",
        title: "ingest your transcripts",
        body: "reads the sessions Claude Code, Codex, Cursor, OpenCode, and Strike already saved on your disk, and records them locally.",
        command: "peasant ingest",
      },
      {
        id: "open-the-dashboard",
        title: "open the dashboard",
        body: "browse what was found, read any session back, and set what stays private before any of it leaves.",
        command: "peasant web start",
      },
      {
        id: "contribute-to-the-commons",
        title: "contribute to the commons",
        body: "sends the one session you approved to village, with your redactions applied. the original stays local and nothing else goes with it.",
        command: "peasant village push",
      },
    ] as Four<StoryStep>,
  },
  community: {
    title: "building for community first",
    body:
      "the sessions are yours first: they sit on your machine and nothing leaves until you send it. village exists for the ones you do send, so the work behind a fix becomes something other people can learn from instead of something that disappears.",
    points: [
      "publishing is always a deliberate act, never a default",
      "every shared session carries the reuse license you picked",
      "groups set their own rules, open to all or approved by the owner",
    ] as Three<string>,
  },
  faq: {
    title: "questions",
    label: "frequently asked questions",
    questions: [
      {
        id: "open-source",
        question: "is it open source?",
        answer:
          "yes. peasant, village, and the shared schema are Apache-2.0. session data you publish can carry its own Creative Commons content license.",
      },
      {
        id: "agents",
        question: "which coding agents does it read?",
        answer:
          "it reads sessions from Claude Code, Codex, Cursor, OpenCode, and Strike. sessions your tools have already deleted cannot be recovered.",
      },
      {
        id: "uploads",
        question: "does anything get uploaded on its own?",
        answer:
          "no. peasant stores everything locally and only sends a copy when you run a publish command.",
      },
      {
        id: "search",
        question: "how good is the search?",
        answer:
          "it is keyword search across the text of your saved sessions. it does not search by meaning, so exact words work better than descriptions.",
      },
      {
        id: "others-work",
        question: "what about sessions other people publish?",
        answer:
          "you can pull the ones you are allowed to read into a separate local space. they stay theirs, and you cannot republish them.",
      },
      {
        id: "village",
        question: "do i have to use village?",
        answer:
          "no. peasant works on its own as a local record. village only ever holds copies you send it.",
      },
    ] as readonly [SuiteQuestion, ...SuiteQuestion[]],
  },
} as const;

export const PROJECTS = {
  peasant: {
    slug: "peasant",
    name: "peasant",
    route: "/projects/peasant",
    metadata: {
      title: "peasant: local coding-agent project history",
      description:
        "peasant normalizes supported coding-agent sessions into a local project history for analysis, review, redaction, and explicit sharing.",
      canonical: "/projects/peasant",
    },
    card: {
      kind: "local",
      outcome: "saves the sessions from the coding agents you use to your own machine.",
      proof: [
        "reads Claude Code, Codex, Cursor, OpenCode, and Strike",
        "search and reread everything locally",
        "nothing is shared unless you say so",
      ],
      action: "explore peasant",
      availability: "public release",
    },
    hero: {
      title: "keep your coding-agent transcripts. share the ones you choose.",
      body:
        "peasant collects the sessions Claude Code, Codex, Cursor, OpenCode, and Strike already save on your disk and keeps them in one place you can search and read back. nothing goes anywhere else unless you send it.",
    },
    start: {
      title: "get started",
      intro:
        "five commands, start to finish. everything here runs on your own machine.",
      stepsLabel: "setup steps",
      continueLabel: "continue",
      doneLabel: "done",
      backLabel: "back",
      copyAllLabel: "copy all commands",
      steps: [
        {
          id: "install",
          title: "install",
          comment: "# one line, puts peasant on your PATH",
          command: "curl -fsSL https://peasantlabs.org/install | bash",
        },
        {
          id: "set-up",
          title: "set up",
          comment: "# choose which projects and sessions to keep",
          command: "peasant kickstart",
        },
        {
          id: "bring-work-in",
          title: "bring your work in",
          comment: "# reads what your agents already saved",
          command: "peasant ingest",
        },
        {
          id: "open-it",
          title: "open it",
          comment: "# browse and search at localhost:8690",
          command: "peasant web start",
        },
        {
          id: "share-one",
          title: "share one",
          comment: "# sends one copy to village, only when you ask",
          command: "peasant village push",
        },
      ] as Five<StartStep>,
    },
    usesTitle: "where it helps",
    usesIntro: "three things that get easier once every session is in one place.",
    uses: [
      {
        id: "remember-why",
        title: "you forgot how something got built",
        body: "find the session behind a change and read what you and the agent actually did.",
      },
      {
        id: "one-list-for-every-tool",
        title: "you use more than one coding agent",
        body: "every tool's sessions land in the same list, so you search once instead of four times.",
      },
      {
        id: "share-just-one",
        title: "you want to share one session",
        body: "check it, hide what should stay private, and publish that copy to village.",
      },
    ],
    related: [
      {
        id: "all-projects",
        label: "all projects",
        href: "/projects",
        kind: "internal",
      },
      {
        id: "village",
        label: "see village",
        href: "/projects/village",
        kind: "internal",
      },
      {
        id: "comparison",
        label: "compare with similar tools",
        href: "/projects#comparison",
        kind: "internal",
      },
    ],
  },
  village: {
    slug: "village",
    name: "village",
    route: "/projects/village",
    metadata: {
      title: "village: a governed commons for agent sessions",
      description:
        "village stores selected published session copies for governed discovery, collective access, licensing, audit history, and one-way pull.",
      canonical: "/projects/village",
    },
    card: {
      kind: "open-source",
      outcome: "holds the copies you publish, with clear rules on who can read and reuse them.",
      proof: [
        "published copies, originals stay local",
        "open or owner-approved groups",
        "pull other people's work in, one way",
      ],
      action: "explore village",
      availability: "private contributor development",
    },
    hero: {
      title: "a commons for selected agent work",
      body:
        "village receives copies that a peasant user explicitly publishes, then applies discovery, collective access, optional reuse licensing, and governance history around those copies.",
    },
    start: {
      title: "get started",
      intro:
        "five commands, start to finish. everything here runs on your own machine.",
      stepsLabel: "setup steps",
      continueLabel: "continue",
      doneLabel: "done",
      backLabel: "back",
      copyAllLabel: "copy all commands",
      // Same install sequence as peasant — village is reached after you share a copy.
      steps: [
        {
          id: "install",
          title: "install",
          comment: "# one line, puts peasant on your PATH",
          command: "curl -fsSL https://peasantlabs.org/install | bash",
        },
        {
          id: "set-up",
          title: "set up",
          comment: "# choose which projects and sessions to keep",
          command: "peasant kickstart",
        },
        {
          id: "bring-work-in",
          title: "bring your work in",
          comment: "# reads what your agents already saved",
          command: "peasant ingest",
        },
        {
          id: "open-it",
          title: "open it",
          comment: "# browse and search at localhost:8690",
          command: "peasant web start",
        },
        {
          id: "share-one",
          title: "share one",
          comment: "# sends one copy to village, only when you ask",
          command: "peasant village push",
        },
      ] as Five<StartStep>,
    },
    community: {
      title: "join your community",
      body:
        "collectives are where selected sessions live for a team. open an example of work people already share, then join when you are ready to contribute and learn from the same record.",
      joinLabel: "join collective",
    },
    example: {
      head: "example collective",
      title: "desert archivists",
      desc:
        "a shared shelf for redacted transcripts about data pipelines and ingestion.",
      bullets: ["verified-only acceptance", "redaction review required"],
      members: "24",
      transcripts: "118",
      linked: "linked",
    },
    governance: {
      title: "making governance sane and transparent",
      body:
        "every join is a deliberate boundary crossing. owners see who is asking to participate so they can review membership and contributions; everyone else still sees you as anon. the terms are written out before you consent — no silent profile leaks, no mystery about who can see what.",
    },
    related: [
      {
        id: "all-projects",
        label: "all projects",
        href: "/projects",
        kind: "internal",
      },
      {
        id: "peasant",
        label: "see peasant",
        href: "/projects/peasant",
        kind: "internal",
      },
      {
        id: "comparison",
        label: "compare the operating models",
        href: "/projects#comparison",
        kind: "internal",
      },
    ],
  },
} as const satisfies Readonly<{
  peasant: PeasantPageContent;
  village: VillagePageContent;
}>;
export type ComparisonCell = Readonly<{
  status: ComparisonStatus;
  qualification: string;
  evidence: readonly [EvidenceId, ...EvidenceId[]];
}>;

export type ComparisonRow = Readonly<{
  id: string;
  capability: string;
  peasantLabs: ComparisonCell;
  entire: ComparisonCell;
}>;

/** one flagged string in the redaction demo, before and after the rewrite. */
export type RedactionMatch = Readonly<{
  id: string;
  category: string;
  confidence: number;
  secret: string;
  after: string;
  /** true when the reader opted out and the original goes with the copy. */
  kept?: boolean;
}>;

/**
 * The redaction review, shown with demonstration matches. Every value here is
 * invented for the page — no real key, address, or token appears — and the
 * section says so above the panel, the same way the transcript demo does. The
 * kept match is deliberate: the honest version of this screen shows that opting
 * out is possible and says plainly what it costs.
 */
export const REDACTION = {
  title: "what stays private when you share",
  intro:
    "before a copy leaves your machine, peasant scans it for secrets, personal details, and internal links, then shows you every match it found. you decide what stays hidden, and what it does not catch stays your call rather than a silent pass.",
  note: "sample data, not a real scan.",
  label: "redaction review on a sample session",
  /*
   * Standard is the only level the product ships — minimal and maximum are being
   * removed — so the panel states the level in force rather than offering a
   * choice between three. fairtrade's segmented control still renders all three
   * options; `app/globals.css` hides the two that are not selected.
   */
  level: "standard",
  scanned: 12,
  total: 12,
  matches: [
    {
      id: "api-key",
      category: "api-key",
      confidence: 0.98,
      secret: 'const BILLING_KEY = "sk_demo_000000000000000000example"',
      after: 'const BILLING_KEY = "sk_demo_••••••••••••••••••••••"',
    },
    {
      id: "email",
      category: "email",
      confidence: 0.91,
      secret: "// reported by alex.rivera@example.com on the 0.4 rollout",
      after: "// reported by ‹redacted-email› on the 0.4 rollout",
      kept: true,
    },
    {
      id: "bearer-token",
      category: "bearer-token",
      confidence: 0.87,
      secret: 'Authorization: "Bearer demo.example.token.value"',
      after: 'Authorization: "Bearer ‹redacted-token›"',
    },
  ] as Three<RedactionMatch>,
} as const;

export const COMPARISON_MARKS = {
  yes: { glyph: "✓", label: "yes" },
  partial: { glyph: "~", label: "partial" },
  "not-documented": { glyph: "–", label: "not documented" },
} as const satisfies Record<ComparisonStatus, { glyph: string; label: string }>;

export const COMPARISON = {
  title: "how it compares to similar tools",
  intro:
    "here is what peasant labs does next to the closest public tools in this space, checked against their public docs and our own source.",
  bundleDefinition:
    "peasant labs means peasant, village, and the schema they share. the other column covers similar tools and the documentation they publish.",
  meaningNote:
    "a dash means we did not find it in those tools' public docs. it does not mean they cannot do it.",
  /*
   * `qualification` and `evidence` below are no longer rendered — the page shows
   * marks only. They stay as the internal record of what each mark was checked
   * against, and the fixture still resolves every evidence id, so a claim cannot
   * drift away from its source unnoticed.
   */
  rows: [
    {
      id: "keep-it-local",
      capability: "keep everything on your own machine",
      peasantLabs: {
        status: "yes",
        qualification:
          "sessions are stored in a local database, and anything leaving it is an explicit action.",
        evidence: ["peasant-readme"],
      },
      entire: {
        status: "yes",
        qualification: "Entire documents local checkpoints with pushing turned off.",
        evidence: ["entire-checkpoint-storage", "entire-keep-local"],
      },
    },
    {
      id: "read-past-sessions",
      capability: "read the sessions your agents already saved",
      peasantLabs: {
        status: "yes",
        qualification:
          "reads Claude Code, OpenCode, Codex, Cursor, and Strike sessions into one record.",
        evidence: ["peasant-adapters", "peasant-readme"],
      },
      entire: {
        status: "yes",
        qualification:
          "Entire documents importing past agent history and covers more integrations.",
        evidence: ["entire-import-history", "entire-agents"],
      },
    },
    {
      id: "search-past-work",
      capability: "search your past work",
      peasantLabs: {
        status: "partial",
        qualification: "keyword search over saved messages, not meaning-based search.",
        evidence: ["peasant-search"],
      },
      entire: {
        status: "yes",
        qualification: "Entire documents combined meaning-based and keyword search.",
        evidence: ["entire-search"],
      },
    },
    {
      id: "publish-selected",
      capability: "publish only the sessions you pick",
      peasantLabs: {
        status: "yes",
        qualification: "publishing is one command per copy, and the original stays local.",
        evidence: ["peasant-readme", "village-readme"],
      },
      entire: {
        status: "yes",
        qualification:
          "Entire documents sharing through Entire.io and its repository service.",
        evidence: ["entire-platform", "entire-dispatches"],
      },
    },
    {
      id: "reuse-license",
      capability: "set a reuse license on what you share",
      peasantLabs: {
        status: "yes",
        qualification:
          "an optional Creative Commons choice travels with each published copy.",
        evidence: ["village-governance", "peasant-pull"],
      },
      entire: {
        status: "not-documented",
        qualification:
          "we found no per-session reuse license in Entire's public docs.",
        evidence: ["entire-declared-corpus-2026-07-28"],
      },
    },
    {
      id: "shared-groups",
      capability: "share into a group other people can join",
      peasantLabs: {
        status: "yes",
        qualification:
          "village groups are either open to contributions or approved by the owner.",
        evidence: ["village-collectives"],
      },
      entire: {
        status: "not-documented",
        qualification:
          "we found no equivalent group moderation model in Entire's public docs.",
        evidence: ["entire-declared-corpus-2026-07-28"],
      },
    },
    /*
     * No availability row: the table compares what the products do, and a
     * release-date gap stops being a capability difference the moment peasant
     * ships. The advertised state still lives on each product card.
     */
  ] as Six<ComparisonRow>,
} as const;

export const SITEMAP_URLS = [
  SITE_URL,
  `${SITE_URL}/projects`,
  `${SITE_URL}/projects/peasant`,
  `${SITE_URL}/projects/village`,
] as const;

export function metadataForRoute(route: RouteMetadata): Metadata {
  const absoluteUrl = new URL(route.canonical, SITE_URL).toString();

  return {
    title: route.title,
    description: route.description,
    alternates: { canonical: route.canonical },
    openGraph: {
      title: route.title,
      description: route.description,
      type: "website",
      url: absoluteUrl,
      siteName: SITE_NAME,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: route.title,
      description: route.description,
    },
  };
}
