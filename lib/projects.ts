import type { Metadata } from "next";

export const SITE_URL = "https://peasantlabs.org" as const;
export const SITE_NAME = "Peasant Labs" as const;

export type ProjectSlug = "peasant" | "village";
export type Five<T> = readonly [T, T, T, T, T];
export type Fourteen<T> = readonly [
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
];

export type AdvertisedState =
  | "public-release"
  | "private-preview"
  | "current-source"
  | "private-contributor-development"
  | "not-publicly-available";

export type ComparisonStatus =
  | "supported"
  | "partial"
  | "not-documented"
  | "not-in-current-scope";

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
  verifiedOn: "2026-07-28",
  reverifyBy: "2026-08-27",
  reviewOwner: "Peasant Labs website maintainers",
} as const;

export const EVIDENCE = {
  "peasant-rc2-private-release": {
    id: "peasant-rc2-private-release",
    label: "Peasant private rc2 release",
    claim: "The observed Peasant product release is the private prerelease v0.1.0-rc2.",
    sourceScope: "private-preview",
    advertisedState: "private-preview",
    revisionOrVersion:
      "v0.1.0-rc2 at 917ea1a4a03b26dffe0bfd287fe53b6ed5f12427",
    internalProvenance: "Peasant private release tag and commit",
    sourceIds: [],
    ...REVIEW,
  },
  "peasant-current-corpus-2026-07-28": {
    id: "peasant-current-corpus-2026-07-28",
    label: "Peasant current-source corpus",
    claim:
      "The reviewed Peasant corpus covers its README, adapter registry, search, Kickstart, pull, and license state.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "ec322ef19d65d4a3a9085ad5601c765a4b9990ec",
    internalProvenance: "Peasant current source reviewed at the pinned revision",
    sourceIds: [],
    ...REVIEW,
  },
  "peasant-readme": {
    id: "peasant-readme",
    label: "Peasant current README",
    claim:
      "Peasant documents local SQLite storage, normalized transcript detail, explicit Village push and pull, analytics, and Git associations where observed.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "ec322ef19d65d4a3a9085ad5601c765a4b9990ec",
    internalProvenance: "peasant/develop/README.md",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-adapters": {
    id: "peasant-adapters",
    label: "Peasant adapter registry",
    claim:
      "Current source registers adapters for Claude Code, OpenCode, Codex, and Cursor.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "ec322ef19d65d4a3a9085ad5601c765a4b9990ec",
    internalProvenance: "peasant/develop/internal/ingest/adapter.go:50-63",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-selection-redaction": {
    id: "peasant-selection-redaction",
    label: "Peasant selection and redaction guide",
    claim:
      "Kickstart persists selected projects, branches, and sessions and documents Minimal, Standard, and Maximum redaction levels.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "ec322ef19d65d4a3a9085ad5601c765a4b9990ec",
    internalProvenance: "peasant/develop/docs/KICKSTART.md",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-search": {
    id: "peasant-search",
    label: "Peasant local full-text search",
    claim:
      "Current source provides local FTS5 full-text search over recorded message entries.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "ec322ef19d65d4a3a9085ad5601c765a4b9990ec",
    internalProvenance:
      "peasant/develop/internal/store/schema_v35.go and internal/api/provider.go",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-pull": {
    id: "peasant-pull",
    label: "Peasant Village pull guide",
    claim:
      "Pulled foreign transcripts use a separate one-way namespace and do not become owned analytics or re-push candidates.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "ec322ef19d65d4a3a9085ad5601c765a4b9990ec",
    internalProvenance: "peasant/develop/docs/pull.md",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-license": {
    id: "peasant-license",
    label: "Peasant placeholder license",
    claim:
      "Peasant has a placeholder custom license and must not be described as open source.",
    sourceScope: "current-source",
    advertisedState: "not-publicly-available",
    revisionOrVersion: "ec322ef19d65d4a3a9085ad5601c765a4b9990ec",
    internalProvenance: "peasant/develop/LICENSE:1-9",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "peasant-schema-pin": {
    id: "peasant-schema-pin",
    label: "Peasant schema consumer pin",
    claim: "Peasant consumed github.com/peasant-labs/schema v0.1.0-rc9.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion:
      "Peasant ec322ef19d65d4a3a9085ad5601c765a4b9990ec, schema v0.1.0-rc9",
    internalProvenance: "peasant/develop/go.mod:15",
    sourceIds: ["peasant-current-corpus-2026-07-28"],
    ...REVIEW,
  },
  "village-readme": {
    id: "village-readme",
    label: "Village current README",
    claim:
      "Village stores selected published copies and documents a private contributor Docker Compose stack and Peasant-driven publishing.",
    sourceScope: "private-contributor-development",
    advertisedState: "private-contributor-development",
    revisionOrVersion: "430ab072c59f42c8917994cc4f2ddf3f68cf2529",
    internalProvenance: "village/develop/README.md",
    sourceIds: [],
    ...REVIEW,
  },
  "village-collectives": {
    id: "village-collectives",
    label: "Village collective controls",
    claim:
      "Current source describes collectives as groups governing shared data with open and curated contribution modes.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "430ab072c59f42c8917994cc4f2ddf3f68cf2529",
    internalProvenance:
      "village/develop/frontend/src/app/groups and collective settings routes",
    sourceIds: ["village-readme"],
    ...REVIEW,
  },
  "village-governance": {
    id: "village-governance",
    label: "Village governance invariants",
    claim:
      "Village documents optional CC licensing, public/private/shared visibility, trigger-written append-only governance events, and SQL-enforced pull authorization.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "430ab072c59f42c8917994cc4f2ddf3f68cf2529",
    internalProvenance: "village/develop/docs/database-invariants.md",
    sourceIds: ["village-readme"],
    ...REVIEW,
  },
  "village-schema-pin": {
    id: "village-schema-pin",
    label: "Village schema consumer pin",
    claim: "Village consumed github.com/peasant-labs/schema v0.1.0-rc9.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion:
      "Village 430ab072c59f42c8917994cc4f2ddf3f68cf2529, schema v0.1.0-rc9",
    internalProvenance: "village/develop/backend/go.mod:16",
    sourceIds: ["village-readme"],
    ...REVIEW,
  },
  "schema-rc10": {
    id: "schema-rc10",
    label: "Public Schema rc10 release",
    claim:
      "The public Apache-2.0 Schema release provides canonical Go, TypeScript, Zod, and OpenAPI contracts.",
    sourceScope: "public-release",
    advertisedState: "public-release",
    revisionOrVersion:
      "v0.1.0-rc10 at d80a744010cc4dfe0ba763a96b9073f340e75c32",
    internalProvenance: "schema release and commit-pinned README",
    sourceIds: [],
    publicHref:
      "https://github.com/peasant-labs/schema/releases/tag/v0.1.0-rc10",
    publishedOn: "2026-07-28T13:54:46Z",
    ...REVIEW,
  },
  "schema-current": {
    id: "schema-current",
    label: "Schema current source",
    claim:
      "Current Schema source identifies Village API 0.9.0, Peasant Local API 0.6.0, and Types 0.6.0.",
    sourceScope: "current-source",
    advertisedState: "current-source",
    revisionOrVersion: "8870b78eba91bd28552872d2dda18797dc5afff0",
    internalProvenance: "schema/develop/README.md and versions.go",
    sourceIds: ["schema-rc10"],
    publicHref: "https://github.com/peasant-labs/schema",
    ...REVIEW,
  },
  "fairtrade-0.0.9": {
    id: "fairtrade-0.0.9",
    label: "Fairtrade 0.0.9 package",
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
      "Peasant Labs means Peasant plus Village plus Schema; Entire means Entire CLI plus Entire.io and its documented repository service.",
    sourceScope: "bundle-definition",
    revisionOrVersion: "comparison scope verified 2026-07-28",
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
    claim: "Entire describes its product positioning and qualified resume promise.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-07-28",
    internalProvenance: "Official Entire homepage",
    sourceIds: [],
    publicHref: "https://entire.io/",
    ...REVIEW,
  },
  "entire-projects": {
    id: "entire-projects",
    label: "Entire projects directory",
    claim: "Entire publishes an official directory of its product areas.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor docs index reviewed 2026-07-28",
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
    revisionOrVersion: "public repository reviewed 2026-07-28",
    internalProvenance: "Official Entire CLI repository",
    sourceIds: [],
    publicHref: "https://github.com/entireio/cli",
    ...REVIEW,
  },
  "entire-cli-v0.9.0": {
    id: "entire-cli-v0.9.0",
    label: "Entire CLI v0.9.0",
    claim: "Entire CLI v0.9.0 is a stable public release.",
    sourceScope: "public-release",
    advertisedState: "public-release",
    revisionOrVersion:
      "v0.9.0 at 8b77ad43132d18f7958825c9dcd26544ab8f5d92",
    internalProvenance: "Official Entire CLI release",
    sourceIds: ["entire-cli-repo"],
    publicHref: "https://github.com/entireio/cli/releases/tag/v0.9.0",
    publishedOn: "2026-07-27T12:31:54Z",
    ...REVIEW,
  },
  "entire-quickstart": {
    id: "entire-quickstart",
    label: "Entire quickstart",
    claim: "Entire documents checkpoint setup and a Git-linked workflow.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
    internalProvenance: "Official Entire checkpoint storage guide",
    sourceIds: [],
    publicHref:
      "https://docs.entire.io/guides/checkpoints/store-checkpoint-data",
    ...REVIEW,
  },
  "entire-keep-local": {
    id: "entire-keep-local",
    label: "Entire local checkpoint mode",
    claim: "Entire documents keeping checkpoints local with push disabled.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
    internalProvenance: "Official Entire semantic search guide",
    sourceIds: [],
    publicHref:
      "https://docs.entire.io/guides/search/semantic-search/overview",
    ...REVIEW,
  },
  "entire-dispatches": {
    id: "entire-dispatches",
    label: "Entire dispatches",
    claim:
      "Entire documents shareable Markdown summaries across repositories, branches, and time windows.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-07-28",
    internalProvenance: "Official Entire dispatches guide",
    sourceIds: [],
    publicHref: "https://docs.entire.io/guides/dispatches/overview",
    ...REVIEW,
  },
  "entire-repositories": {
    id: "entire-repositories",
    label: "Entire repository service",
    claim:
      "Entire documents regional EntireDB Git mirrors while GitHub remains the source repository.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
    internalProvenance: "Official Entire repository limitations",
    sourceIds: [],
    publicHref: "https://docs.entire.io/guides/repositories/limitations",
    ...REVIEW,
  },
  "entire-privacy": {
    id: "entire-privacy",
    label: "Entire privacy policy",
    claim: "The Entire privacy policy is part of the declared review corpus.",
    sourceScope: "vendor-documented",
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "vendor page reviewed 2026-07-28",
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
    revisionOrVersion: "declared official corpus reviewed 2026-07-28",
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

export type ProjectPageContent = Readonly<{
  slug: ProjectSlug;
  name: "Peasant" | "Village";
  route: `/projects/${ProjectSlug}`;
  metadata: RouteMetadata;
  card: EvidenceBacked &
    Readonly<{
      outcome: string;
      proof: readonly [string, string, string];
      action: string;
      availability: string;
    }>;
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
  figure: HeroFigureContent;
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

export const SUITE = {
  metadata: {
    title: "projects | Peasant Labs",
    description:
      "Peasant keeps supported coding-agent session history local. Village publishes selected records to a governed commons.",
    canonical: "/projects",
  },
  title: "keep the work. share what matters.",
  intro:
    "Peasant builds a local record from retained sessions across supported harnesses. Village receives only the copies a user explicitly publishes, then applies discovery and governance around those copies.",
  figure: {
    accessibleName:
      "placeholder for the Peasant Labs suite workflow showing a selected local record, deliberate review, and its governed published copy",
    stateText: "Peasant Labs suite workflow screenshot forthcoming",
    caption:
      "the future image will show a selected local record in Peasant, its deliberate review boundary, and the governed copy explicitly published to Village.",
  } satisfies HeroFigureContent,
  storyTitle: "from local history to shared context",
  story: [
    {
      id: "record",
      title: "record locally",
      body: "discover selected retained sessions, normalize their turns and tool activity, and keep the working record in Peasant.",
    },
    {
      id: "review",
      title: "review deliberately",
      body: "inspect project context and redaction findings before taking an explicit sharing action.",
    },
    {
      id: "share",
      title: "share a selected copy",
      body: "publish a chosen record to Village for governed discovery, then pull permitted foreign context into a separate local namespace.",
    },
  ] as const,
  contractTitle: "one contract from local to shared",
  contractBody:
    "the public Schema contract carries ordered turns, tool calls, outcomes, Git context, annotations, and sharing metadata between the two products. Peasant and Village were observed on Schema rc9 while rc10 was the public Schema release on 2026-07-28.",
  contractEvidence: [
    "schema-rc10",
    "peasant-schema-pin",
    "village-schema-pin",
  ] as const satisfies readonly [EvidenceId, ...EvidenceId[]],
} as const;

export const PROJECTS = {
  peasant: {
    slug: "peasant",
    name: "Peasant",
    route: "/projects/peasant",
    metadata: {
      title: "Peasant: local coding-agent project history",
      description:
        "Peasant normalizes supported coding-agent sessions into a local project history for analysis, review, redaction, and explicit sharing.",
      canonical: "/projects/peasant",
    },
    card: {
      outcome:
        "turn retained sessions from supported harnesses into one inspectable local project record.",
      proof: [
        "four current-source adapters",
        "local SQLite analysis",
        "explicit review and sharing",
      ],
      action: "explore Peasant",
      availability: "private preview and current source",
      evidence: ["peasant-adapters", "peasant-readme"],
    },
    hero: {
      title: "one history across the supported tools you use",
      body:
        "Peasant imports retained sessions from a finite set of supported coding-agent harnesses, normalizes them into one local record, and keeps sharing as an explicit choice.",
      state: "current-source",
      evidence: ["peasant-adapters", "peasant-readme"],
    },
    availability: {
      title: "private preview",
      body:
        "the observed product release is private v0.1.0-rc2. newer behavior on this page is verified in current source and is not presented as a signed-out public download.",
      qualification:
        "preview repository or release access is required before any install or run command can work.",
      state: "private-preview",
      evidence: ["peasant-rc2-private-release", "peasant-license"],
    },
    figure: {
      accessibleName:
        "placeholder for the Peasant project timeline showing selected sessions and available Git associations",
      stateText: "Peasant project timeline screenshot forthcoming",
      caption:
        "the future image will show a local project history with session context and association limits visible.",
    },
    features: [
      {
        id: "supported-harness-history",
        title: "one history across supported harnesses",
        body:
          "current source has four adapter factories feeding one canonical session-detail path, so retained work is not confined to one supported transcript format.",
        qualification:
          "adapter coverage is finite and current-source behavior may be newer than private rc2.",
        state: "current-source",
        evidence: ["peasant-adapters", "peasant-readme"],
      },
      {
        id: "project-context",
        title: "project context beyond the transcript",
        body:
          "selection, project and branch identity, timing, tool activity, and durable session-to-commit records add context around the conversation.",
        qualification:
          "Git associations appear only where Peasant detects them; no association is promised for every session.",
        state: "current-source",
        evidence: ["peasant-readme", "peasant-selection-redaction"],
      },
      {
        id: "local-analysis",
        title: "local analysis before publication",
        body:
          "the local store supports transcript browsing, metrics, project views, and full-text search over recorded message entries.",
        qualification:
          "search is local full-text search, not semantic search, and optional network actions remain separate.",
        state: "current-source",
        evidence: ["peasant-readme", "peasant-search"],
      },
      {
        id: "redaction-review",
        title: "review what leaves the machine",
        body:
          "a user chooses a redaction level and can inspect an explicit publish path instead of enabling background publication.",
        qualification:
          "redaction reduces exposure but cannot guarantee that every sensitive value is detected.",
        state: "current-source",
        evidence: ["peasant-selection-redaction", "peasant-readme"],
      },
      {
        id: "schema-backed-sharing",
        title: "one typed record from local to shared",
        body:
          "the Schema-backed detail carries ordered turns, tool calls, outcomes, timing, Git context, annotations, and sharing metadata instead of flattening work into chat text.",
        qualification:
          "the public Apache-2.0 license applies to Schema only, not to the private Peasant product.",
        state: "current-source",
        evidence: ["schema-rc10", "peasant-schema-pin", "peasant-readme"],
      },
    ],
    flow: {
      title: "from session to project history",
      intro:
        "the record grows through explicit, bounded steps. missing source files or undetected associations remain missing rather than being inferred.",
      steps: [
        "discover retained sessions selected from supported local stores",
        "normalize messages, turns, tool calls, and session metadata",
        "store and analyze the record in local SQLite-backed surfaces",
        "attach project and Git context where source evidence supports it",
        "review redaction and explicitly choose whether to publish a copy",
      ],
      evidence: [
        "peasant-adapters",
        "peasant-readme",
        "peasant-selection-redaction",
      ],
    },
    proof: {
      title: "history, redaction, and local analysis",
      body:
        "Peasant keeps source facts and user interpretation distinct: detected associations remain durable facts, while annotations and publishing require deliberate actions.",
      points: [
        "selected project and branch discovery bounds what enters the record",
        "local full-text search opens recorded message context without claiming semantic retrieval",
        "configurable redaction and dry-run publishing keep review before transfer",
      ],
      evidence: [
        "peasant-selection-redaction",
        "peasant-search",
        "peasant-readme",
      ],
    },
    access: [
      {
        id: "preview-access",
        title: "obtain preview access",
        body:
          "use a private preview release or repository checkout supplied by a maintainer. there is no signed-out public artifact linked from this page.",
        qualification:
          "the observed private baseline is v0.1.0-rc2 and its placeholder product license is not a public open-source grant.",
        state: "private-preview",
        evidence: ["peasant-rc2-private-release", "peasant-license"],
      },
    ],
    run: [
      {
        id: "configure",
        title: "configure selected sources",
        body:
          "run the setup wizard after the preview binary is available on PATH.",
        qualification: "post-access command for a private preview build.",
        state: "private-preview",
        command: "peasant kickstart",
        evidence: ["peasant-readme", "peasant-selection-redaction"],
      },
      {
        id: "ingest",
        title: "ingest retained sessions",
        body:
          "process discovered sessions that match the configured selection.",
        qualification:
          "results depend on retained source transcripts, supported formats, selection, and successful parsing.",
        state: "current-source",
        command: "peasant ingest",
        evidence: ["peasant-readme", "peasant-selection-redaction"],
      },
      {
        id: "open-dashboard",
        title: "open the local dashboard",
        body: "start the dashboard backed by the local Peasant store.",
        qualification: "post-access command; the documented default port is 8690.",
        state: "private-preview",
        command: "peasant web start",
        evidence: ["peasant-readme"],
      },
    ],
    stories: [
      {
        id: "multi-harness-developer",
        actor: "a developer working across supported harnesses",
        need: "needs one place to review retained work across branches",
        action:
          "selects the relevant projects and sessions, then ingests them into Peasant",
        outcome:
          "gets one local project record without claiming coverage of unsupported or deleted source data",
        evidence: ["peasant-adapters", "peasant-selection-redaction"],
      },
      {
        id: "maintainer-context",
        actor: "a maintainer reviewing a change",
        need: "needs the session context behind a feature when an association exists",
        action:
          "opens the project history and follows an observed session-to-commit association",
        outcome:
          "can inspect the reasoning and tool activity while an unavailable association remains visibly unavailable",
        evidence: ["peasant-readme"],
      },
      {
        id: "review-before-share",
        actor: "a developer preparing one session for sharing",
        need: "needs to reduce sensitive exposure without publishing every local session",
        action:
          "reviews the selected session under a configured redaction level before an explicit push",
        outcome:
          "keeps non-selected local history local and sees the limits of redaction before transfer",
        evidence: ["peasant-selection-redaction", "peasant-readme"],
      },
    ],
    outputs: [
      {
        id: "kickstart-summary",
        label: "illustrative setup summary from the current Kickstart guide",
        qualification:
          "documentation fixture only. counts describe the guide example, not product performance or availability.",
        state: "current-source",
        lines: [
          "Redaction:    standard",
          "Selected:     12 session(s)",
          "New branches: Auto-ingest",
        ],
        evidence: ["peasant-selection-redaction"],
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
        label: "see Village",
        href: "/projects/village",
        kind: "internal",
      },
      {
        id: "comparison",
        label: "compare the operating models",
        href: "/projects#comparison",
        kind: "internal",
      },
      {
        id: "schema",
        label: "view the public Schema release",
        href: "https://github.com/peasant-labs/schema/releases/tag/v0.1.0-rc10",
        kind: "public-source",
      },
    ],
    requiredEvidence: [
      "peasant-rc2-private-release",
      "peasant-current-corpus-2026-07-28",
      "peasant-readme",
      "peasant-adapters",
      "peasant-selection-redaction",
      "peasant-search",
      "peasant-pull",
      "peasant-license",
      "peasant-schema-pin",
      "schema-rc10",
    ],
  },
  village: {
    slug: "village",
    name: "Village",
    route: "/projects/village",
    metadata: {
      title: "Village: a governed commons for agent sessions",
      description:
        "Village stores selected published session copies for governed discovery, collective access, licensing, audit history, and one-way pull.",
      canonical: "/projects/village",
    },
    card: {
      outcome:
        "publish selected session copies into a commons with explicit access, reuse, and policy history.",
      proof: [
        "published copies, not source replacement",
        "open or curated collectives",
        "one-way authorized pull",
      ],
      action: "explore Village",
      availability: "private contributor development",
      evidence: ["village-readme", "village-collectives", "village-governance"],
    },
    hero: {
      title: "a commons for selected agent work",
      body:
        "Village receives copies that a Peasant user explicitly publishes, then applies discovery, collective access, optional reuse licensing, and governance history around those copies.",
      state: "current-source",
      evidence: ["village-readme", "village-governance"],
    },
    availability: {
      title: "private contributor development",
      body:
        "no public hosted service, release, product license, or self-host distribution was verified. the documented Docker Compose path is for contributors with private repository access.",
      qualification:
        "repository access, GitHub OAuth credentials, a GitHub token, Docker, Go, Node, and pnpm are prerequisites.",
      state: "private-contributor-development",
      evidence: ["village-readme"],
    },
    figure: {
      accessibleName:
        "placeholder for the Village collective view showing published session copies and governance state",
      stateText: "Village collective view screenshot forthcoming",
      caption:
        "the future image will show a published copy, its collective access, reuse license, and policy history.",
    },
    features: [
      {
        id: "published-copy-boundary",
        title: "publish a copy, keep the local source",
        body:
          "Village stores selected published copies and indexes them for discovery and sharing while Peasant remains the local source store.",
        qualification:
          "publication is an explicit Peasant action; Village does not ingest every local harness file.",
        state: "current-source",
        evidence: ["village-readme", "peasant-readme"],
      },
      {
        id: "collective-sharing",
        title: "share through collectives",
        body:
          "collectives organize people and shared records with open contribution or owner-curated approval modes.",
        qualification:
          "access still follows the configured collective and transcript permissions.",
        state: "current-source",
        evidence: ["village-collectives"],
      },
      {
        id: "access-and-license",
        title: "choose access and reuse separately",
        body:
          "visibility uses the closed public, private, or shared set while an optional contract-defined CC license records the reuse grant.",
        qualification:
          "an unset license grants nothing, CC grants cannot be cleared for prior recipients, and this page is not legal advice.",
        state: "current-source",
        evidence: ["village-governance", "schema-rc10"],
      },
      {
        id: "governance-history",
        title: "preserve a policy change history",
        body:
          "database triggers write append-only events for publication, visibility, license, combined governance changes, and retraction.",
        qualification:
          "this is a product audit history, not a claim of regulatory certification or compliance.",
        state: "current-source",
        evidence: ["village-governance"],
      },
      {
        id: "one-way-pull",
        title: "pull context without republishing it",
        body:
          "authorized foreign transcripts and annotations return to a separate local namespace for reference.",
        qualification:
          "pulled records do not enter owned analytics or become current re-push candidates.",
        state: "current-source",
        evidence: ["peasant-pull", "village-governance"],
      },
    ],
    flow: {
      title: "publish. discover. pull.",
      intro:
        "the shared record moves only through explicit actions and permission checks. the local source and the published copy keep different ownership roles.",
      steps: [
        "select and review a locally owned session in Peasant",
        "explicitly publish a redacted copy with visibility and optional license",
        "discover permitted copies through Village and its collectives",
        "apply trigger-written history when visibility or licensing changes",
        "pull authorized foreign context into Peasant's separate one-way namespace",
      ],
      evidence: [
        "village-readme",
        "village-collectives",
        "village-governance",
        "peasant-pull",
      ],
    },
    proof: {
      title: "commons, governance, and ownership",
      body:
        "Village separates three questions that are easy to collapse: who can access a copy now, which reuse grant applies, and what policy changes were recorded.",
      points: [
        "public, private, and shared visibility define current access scope",
        "optional CC identifiers travel through the publish and pull contract",
        "append-only policy events retain the actor and post-change snapshot",
      ],
      evidence: ["village-governance", "schema-rc10", "peasant-pull"],
    },
    access: [
      {
        id: "contributor-access",
        title: "open the Village source repository",
        body:
          "Peasant Labs is open-sourcing the governance and access-control layer for agentic coding data in the Village repository.",
        qualification:
          "the repository is private now, so signed-out visitors may receive a 404 until its visibility changes. this link is not a public download, self-host release, product license, or license grant.",
        state: "not-publicly-available",
        action: {
          label: "open the Village repository",
          accessibleName: "open the Village repository on GitHub; currently private",
          href: "https://github.com/peasant-labs/village",
        },
        evidence: ["village-readme"],
      },
      {
        id: "configure-development",
        title: "configure the private development stack",
        body:
          "copy the environment template, then supply GitHub OAuth credentials, a GitHub token, and the other documented secrets.",
        qualification:
          "private contributor-development command; it is not a public install path.",
        state: "private-contributor-development",
        command: "cp .env.example .env",
        evidence: ["village-readme"],
      },
    ],
    run: [
      {
        id: "publish-from-peasant",
        title: "publish from Peasant",
        body:
          "after authentication and review, publishing is initiated by the Peasant CLI rather than an upload control in Village.",
        qualification:
          "private current-source flow; publication remains an explicit user action.",
        state: "current-source",
        command: "peasant village push",
        evidence: ["peasant-readme", "village-readme"],
      },
    ],
    stories: [
      {
        id: "selected-publisher",
        actor: "a project maintainer",
        need: "wants to publish one useful session while keeping other local work private",
        action:
          "selects, reviews, redacts, and explicitly publishes one copy from Peasant",
        outcome:
          "Village receives only the chosen published copy with its configured governance state",
        evidence: ["peasant-readme", "village-readme", "village-governance"],
      },
      {
        id: "collective-curator",
        actor: "a collective owner",
        need: "wants contributions reviewed before they join a curated collection",
        action:
          "uses the curated acceptance mode to approve or reject submitted shares",
        outcome:
          "the collective exposes only contributions accepted under its documented mode",
        evidence: ["village-collectives"],
      },
      {
        id: "authorized-pull",
        actor: "a permitted teammate",
        need: "needs the transcript and annotations behind a shared decision in local tools",
        action: "pulls the allowed published copy through the authorized Village surface",
        outcome:
          "gets a separately identified foreign record that cannot silently become owned or re-publishable",
        evidence: ["peasant-pull", "village-governance"],
      },
      {
        id: "policy-steward",
        actor: "a commons steward",
        need: "needs to know when access or licensing changed",
        action: "reviews the trigger-written governance event sequence",
        outcome:
          "sees actor-attributed policy snapshots ordered independently of the mutable transcript row",
        evidence: ["village-governance"],
      },
    ],
    outputs: [
      {
        id: "governance-record",
        label: "illustrative governance record derived from current invariants",
        qualification:
          "illustrative field values only. no account, hosted service, or completed publication is implied.",
        state: "current-source",
        lines: [
          "event: governance_changed",
          "visibility: shared",
          "license: CC-BY-4.0",
        ],
        evidence: ["village-governance", "schema-rc10"],
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
        id: "peasant",
        label: "see Peasant",
        href: "/projects/peasant",
        kind: "internal",
      },
      {
        id: "comparison",
        label: "compare the operating models",
        href: "/projects#comparison",
        kind: "internal",
      },
      {
        id: "schema",
        label: "view the public Schema release",
        href: "https://github.com/peasant-labs/schema/releases/tag/v0.1.0-rc10",
        kind: "public-source",
      },
    ],
    requiredEvidence: [
      "village-readme",
      "village-collectives",
      "village-governance",
      "village-schema-pin",
      "peasant-readme",
      "peasant-pull",
      "schema-rc10",
    ],
  },
} as const satisfies Record<ProjectSlug, ProjectPageContent>;

export type ComparisonGroup =
  | "shared-baseline"
  | "retrieval-and-continuation"
  | "sharing-and-governance"
  | "infrastructure-and-maturity";

export type ComparisonCell = Readonly<{
  status: ComparisonStatus;
  sourceScope: SourceScope;
  qualification: string;
  evidence: readonly [EvidenceId, ...EvidenceId[]];
}>;

export type ComparisonRow = Readonly<{
  id: string;
  group: ComparisonGroup;
  capability: string;
  peasantLabs: ComparisonCell;
  entire: ComparisonCell;
  takeaway: string;
}>;

export const COMPARISON = {
  title: "an independent comparison with Entire",
  scrollHelp: "scroll horizontally to compare all columns.",
  caption:
    "independent comparison: Peasant plus Village plus Schema versus Entire CLI plus Entire.io and its documented repository service. verified 2026-07-28.",
  bundleDefinition:
    "Peasant Labs means Peasant, Village, and the public Schema contract. Entire means Entire CLI, Entire.io, and its documented repository service.",
  verifiedOn: "2026-07-28",
  reverifyBy: "2026-08-27",
  reviewOwner: "Peasant Labs website maintainers",
  meaningNote:
    "not documented means no equivalent was found in the reviewed materials, not that one cannot exist.",
  changeNote:
    "product capabilities change. this comparison uses public Entire documentation and source-scoped Peasant Labs evidence reviewed on 2026-07-28.",
  groups: [
    { id: "shared-baseline", label: "shared baseline" },
    {
      id: "retrieval-and-continuation",
      label: "retrieval and continuation",
    },
    { id: "sharing-and-governance", label: "sharing and governance" },
    {
      id: "infrastructure-and-maturity",
      label: "infrastructure and maturity",
    },
  ] as const,
  rows: [
    {
      id: "existing-local-agent-history",
      group: "shared-baseline",
      capability: "bring existing local agent history into one tool",
      peasantLabs: {
        status: "supported",
        sourceScope: "current-source",
        qualification:
          "four current-source adapters feed one canonical Peasant session-detail path.",
        evidence: ["peasant-adapters", "peasant-readme", "schema-rc10"],
      },
      entire: {
        status: "supported",
        sourceScope: "vendor-documented",
        qualification:
          "Entire documents historical import, eight named built-ins, and executable plugins.",
        evidence: ["entire-agents", "entire-import-history"],
      },
      takeaway:
        "both import cross-agent history; Entire documents broader integration coverage.",
    },
    {
      id: "session-context-linked-to-git",
      group: "shared-baseline",
      capability: "connect session context to Git work",
      peasantLabs: {
        status: "partial",
        sourceScope: "current-source",
        qualification:
          "Peasant stores durable associations only where commit detection observes them.",
        evidence: ["peasant-readme"],
      },
      entire: {
        status: "supported",
        sourceScope: "vendor-documented",
        qualification:
          "Entire documents automatic Git-linked checkpoints as a core workflow.",
        evidence: ["entire-quickstart", "entire-agents"],
      },
      takeaway:
        "both connect context to Git; Entire's automatic checkpoint model is the clearer public promise.",
    },
    {
      id: "keep-captured-history-local",
      group: "shared-baseline",
      capability: "keep captured history local",
      peasantLabs: {
        status: "supported",
        sourceScope: "current-source",
        qualification:
          "local SQLite is the base store; optional network actions are separate and explicit.",
        evidence: ["peasant-readme"],
      },
      entire: {
        status: "supported",
        sourceScope: "vendor-documented",
        qualification:
          "Entire documents local checkpoints with push disabled and multiple storage placements.",
        evidence: ["entire-checkpoint-storage", "entire-keep-local"],
      },
      takeaway: "both offer local operation modes; neither gets an exclusivity claim.",
    },
    {
      id: "cross-product-language-contract",
      group: "retrieval-and-continuation",
      capability: "use one typed contract across products and languages",
      peasantLabs: {
        status: "supported",
        sourceScope: "public-release",
        qualification:
          "public Schema rc10 exposes Go, TypeScript, Zod, and OpenAPI contracts; both products were observed on rc9.",
        evidence: ["schema-rc10", "peasant-schema-pin", "village-schema-pin"],
      },
      entire: {
        status: "not-documented",
        sourceScope: "vendor-documented",
        qualification:
          "no equivalent affirmative cross-language transcript contract was found in the declared official corpus.",
        evidence: ["entire-declared-corpus-2026-07-28"],
      },
      takeaway:
        "Peasant Labs has a public source-backed contract; Entire's equivalent is not documented, not absent.",
    },
    {
      id: "analyze-session-and-project-behavior",
      group: "retrieval-and-continuation",
      capability: "analyze session and project behavior",
      peasantLabs: {
        status: "supported",
        sourceScope: "current-source",
        qualification:
          "Peasant documents local transcripts, metrics, trends, project views, changes, and search.",
        evidence: ["peasant-readme", "peasant-search"],
      },
      entire: {
        status: "supported",
        sourceScope: "vendor-documented",
        qualification:
          "Entire documents sessions, checkpoints, diffs, activity, search, review, and summaries.",
        evidence: ["entire-platform", "entire-search", "entire-dispatches"],
      },
      takeaway:
        "Peasant emphasizes local analysis; Entire emphasizes Git checkpoint review and retrieval.",
    },
    {
      id: "search-past-intent",
      group: "retrieval-and-continuation",
      capability: "search past intent",
      peasantLabs: {
        status: "partial",
        sourceScope: "current-source",
        qualification:
          "Peasant provides local FTS5 full-text search over recorded message entries, not semantic search.",
        evidence: ["peasant-search"],
      },
      entire: {
        status: "supported",
        sourceScope: "vendor-documented",
        qualification:
          "Entire documents hybrid semantic and keyword search across checkpoints, sessions, and commits.",
        evidence: ["entire-search"],
      },
      takeaway:
        "Entire documents semantic and cross-repository search; Peasant currently claims local full-text search only.",
    },
    {
      id: "continue-work-across-agents",
      group: "retrieval-and-continuation",
      capability: "continue work across agents",
      peasantLabs: {
        status: "not-documented",
        sourceScope: "current-source",
        qualification:
          "no general cross-agent resume contract was verified in the declared Peasant current-source corpus.",
        evidence: ["peasant-current-corpus-2026-07-28"],
      },
      entire: {
        status: "partial",
        sourceScope: "vendor-documented",
        qualification:
          "Entire advertises resume across agents with explicit integration-specific limits.",
        evidence: ["entire-home", "entire-agents"],
      },
      takeaway: "Entire has the documented advantage, with visible integration limits.",
    },
    {
      id: "publish-and-share-selected-context",
      group: "sharing-and-governance",
      capability: "publish and share selected context",
      peasantLabs: {
        status: "supported",
        sourceScope: "current-source",
        qualification:
          "private current source supports explicit Peasant publishing into Village visibility and collective controls.",
        evidence: [
          "peasant-readme",
          "village-readme",
          "village-collectives",
          "village-governance",
        ],
      },
      entire: {
        status: "supported",
        sourceScope: "vendor-documented",
        qualification:
          "Entire documents repository access, Entire.io sharing, checkpoints, and dispatches.",
        evidence: ["entire-platform", "entire-checkpoint-storage", "entire-dispatches"],
      },
      takeaway: "both share context through different access and storage models.",
    },
    {
      id: "per-transcript-reuse-license",
      group: "sharing-and-governance",
      capability: "apply a per-transcript reuse license",
      peasantLabs: {
        status: "supported",
        sourceScope: "current-source",
        qualification:
          "private current source carries an optional CC selection through publish and pull; legal copy remains qualified.",
        evidence: ["village-governance", "peasant-pull", "schema-rc10"],
      },
      entire: {
        status: "not-documented",
        sourceScope: "vendor-documented",
        qualification:
          "no equivalent affirmative per-transcript reuse-license behavior was found in the declared official corpus.",
        evidence: ["entire-declared-corpus-2026-07-28"],
      },
      takeaway:
        "this is a source-backed Peasant Labs distinction; it does not establish that Entire lacks the capability.",
    },
    {
      id: "collective-contribution-governance",
      group: "sharing-and-governance",
      capability: "govern collective contributions",
      peasantLabs: {
        status: "supported",
        sourceScope: "current-source",
        qualification:
          "Village current source documents open contribution and owner-curated approval modes.",
        evidence: ["village-collectives"],
      },
      entire: {
        status: "not-documented",
        sourceScope: "vendor-documented",
        qualification:
          "no equivalent affirmative collective moderation model was found in the declared official corpus.",
        evidence: ["entire-declared-corpus-2026-07-28"],
      },
      takeaway:
        "Peasant Labs documents open and curated collectives; Entire's equivalent is not documented.",
    },
    {
      id: "visibility-license-change-history",
      group: "sharing-and-governance",
      capability: "preserve visibility and license change history",
      peasantLabs: {
        status: "supported",
        sourceScope: "current-source",
        qualification:
          "Village current source documents trigger-written append-only governance events with policy snapshots.",
        evidence: ["village-governance"],
      },
      entire: {
        status: "not-documented",
        sourceScope: "vendor-documented",
        qualification:
          "no equivalent affirmative transcript policy-history behavior was found in the declared official corpus.",
        evidence: ["entire-declared-corpus-2026-07-28"],
      },
      takeaway:
        "this is a narrow policy-history distinction, not a certification or compliance claim.",
    },
    {
      id: "one-way-pull-with-foreign-ownership",
      group: "sharing-and-governance",
      capability: "pull shared foreign context without changing ownership",
      peasantLabs: {
        status: "supported",
        sourceScope: "current-source",
        qualification:
          "pulled Village records land in a separate one-way namespace outside owned analytics and re-push candidates.",
        evidence: ["peasant-pull", "village-governance"],
      },
      entire: {
        status: "not-documented",
        sourceScope: "vendor-documented",
        qualification:
          "this ownership and non-republication boundary was not found; Entire documents different resume and shared-history behavior.",
        evidence: [
          "entire-declared-corpus-2026-07-28",
          "entire-agents",
          "entire-platform",
        ],
      },
      takeaway: "the products document different semantics, not a generic feature advantage.",
    },
    {
      id: "distributed-git-mirrors",
      group: "infrastructure-and-maturity",
      capability: "operate distributed Git mirrors for agent workloads",
      peasantLabs: {
        status: "not-in-current-scope",
        sourceScope: "bundle-definition",
        qualification:
          "distributed Git mirrors are outside the defined Peasant plus Village plus Schema bundle.",
        evidence: ["bundle-definition"],
      },
      entire: {
        status: "supported",
        sourceScope: "vendor-documented",
        qualification:
          "Entire documents regional EntireDB mirrors while GitHub remains the source repository.",
        evidence: ["entire-repositories"],
      },
      takeaway: "Entire has the documented advantage.",
    },
    {
      id: "public-cli-release-maturity",
      group: "infrastructure-and-maturity",
      capability: "consume a stable public CLI release",
      peasantLabs: {
        status: "partial",
        sourceScope: "private-preview",
        qualification:
          "the observed Peasant release is private prerelease v0.1.0-rc2; signed-out public availability was not verified.",
        evidence: [
          "peasant-rc2-private-release",
          "peasant-readme",
          "peasant-license",
        ],
      },
      entire: {
        status: "supported",
        sourceScope: "public-release",
        qualification: "Entire CLI v0.9.0 is a verified stable public release.",
        evidence: ["entire-cli-v0.9.0"],
      },
      takeaway: "Entire is further along in verified public CLI release maturity.",
    },
  ] as Fourteen<ComparisonRow>,
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
