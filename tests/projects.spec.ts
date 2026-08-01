import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDocument } from "yaml";

const FIXTURE_PATH = resolve("testdata/projects/projects.yaml");
const COMPARISON_STATUSES = ["yes", "partial", "not-documented"] as const;
const ADVERTISED_STATES = [
  "public-release",
  "private-preview",
  "current-source",
  "private-contributor-development",
  "not-publicly-available",
] as const;
const SOURCE_SCOPES = [
  ...ADVERTISED_STATES,
  "vendor-documented",
  "bundle-definition",
] as const;
const COMPARISON_MARKS = {
  yes: "✓",
  partial: "~",
  "not-documented": "–",
} as const;
const THEMES = ["dark", "light"] as const;
const PROJECT_IDS = ["peasant", "village"] as const;

type ComparisonStatus = (typeof COMPARISON_STATUSES)[number];
type AdvertisedState = (typeof ADVERTISED_STATES)[number];
type SourceScope = (typeof SOURCE_SCOPES)[number];
type Theme = (typeof THEMES)[number];
type ProjectId = (typeof PROJECT_IDS)[number];

type MetadataFixture = {
  title: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
  };
};

type RouteFixture = {
  id: string;
  path: string;
  h1: string;
  metadata: MetadataFixture;
};

type EvidenceRefFixture = {
  id: string;
  evidence: string[];
};

type InstructionFixture = EvidenceRefFixture & {
  body: string;
  command: string | null;
  action: {
    label: string;
    accessibleName: string;
    target: string;
  } | null;
  qualification: string;
};

type HeroFigureFixture = {
  accessibleName: string;
  stateText: string;
  caption: string;
  aspectRatio: string;
};

type VillageFixture = {
  route: string;
  hero: { title: string };
  start: {
    title: string;
    stepsLabel: string;
    continueLabel: string;
    doneLabel: string;
    backLabel: string;
    copyAllLabel: string;
    steps: StartStepFixture[];
  };
  community: {
    title: string;
    joinLabel: string;
  };
  example: {
    head: string;
    title: string;
    desc: string;
    bullets: string[];
    members: string;
    transcripts: string;
    linked: string;
  };
  governance: {
    title: string;
  };
  related: Array<{ id: string; target: string }>;
};

type EvidenceFixture = {
  id: string;
  sourceScope: SourceScope;
  advertisedState: AdvertisedState | null;
  revisionOrVersion: string;
  sourceIds: string[];
  verifiedOn: string;
  reverifyBy: string;
  publicHref: string | null;
  internalProvenance: string;
};

type ComparisonCellFixture = {
  status: ComparisonStatus;
  qualification: string;
  sources: string[];
};

type ComparisonRowFixture = {
  id: string;
  capability: string;
  peasantLabs: ComparisonCellFixture;
  entire: ComparisonCellFixture;
};

type StartStepFixture = {
  id: string;
  title: string;
  comment: string;
  command: string | null;
};

/** a walkthrough step in fairtrade's onboarding component: title plus its command. */
type StoryStepFixture = {
  id: string;
  title: string;
  command: string;
};

type ProjectFixture = {
  version: number;
  copyPolicy: {
    preservedSentenceStarts: string[];
  };
  site: {
    baseUrl: string;
    routes: RouteFixture[];
    sitemap: string[];
  };
  catalog: {
    cards: Array<{
      id: ProjectId;
      label: string;
      target: string;
      action: string;
      kind: string;
    }>;
    whatTitle: string;
    cardsTitle: string;
  };
  viewer: {
    title: string;
    label: string;
    sessionId: string;
    disclosure: string;
    turns: number;
    /** the tab the viewer opens on, and one it must still be able to reach. */
    openingTab: string;
    otherTab: string;
  };
  install: {
    command: string;
  };
  story: {
    title: string;
    stepsLabel: string;
    steps: StoryStepFixture[];
  };
  redaction: {
    title: string;
    note: string;
    level: string;
    /** the levels that were withdrawn — the panel must offer none of them. */
    removedLevels: string[];
    matches: Array<{
      id: string;
      category: string;
      kept: boolean;
      secret: string;
      after: string;
    }>;
  };
  community: {
    title: string;
    points: string[];
  };
  faq: {
    title: string;
    label: string;
    forbiddenClaims: string[];
    questions: Array<{ id: string; question: string }>;
  };
  peasant: {
    route: string;
    hero: { title: string };
    start: {
      title: string;
      stepsLabel: string;
      continueLabel: string;
      doneLabel: string;
      backLabel: string;
      copyAllLabel: string;
      steps: StartStepFixture[];
    };
    uses: Array<{ id: string; title: string }>;
    related: Array<{ id: string; target: string }>;
  };
  village: VillageFixture;
  evidence: EvidenceFixture[];
  comparison: {
    title: string;
    intro: string;
    bundleDefinition: string;
    meaningNote: string;
    rows: ComparisonRowFixture[];
  };
  viewports: Array<{
    id: string;
    width: number;
    height: number;
    theme: Theme;
    reflowEquivalent: {
      sourceCssWidth: number;
      zoomPercent: number;
      browserZoomEmulated: false;
    } | null;
  }>;
  invalidCase: {
    kind: "expected-value-mismatch";
    route: string;
    selector: string;
    expectedFirstText: string;
  };
};

function fixtureError(location: string, problem: string, fix: string): never {
  throw new Error(
    `Project fixture validation failed at ${location} while loading ${FIXTURE_PATH}: ${problem}. ` +
      `Mounted project-page assertions are unsafe until this is corrected. Fix: ${fix}.`,
  );
}

function exactObject(
  value: unknown,
  location: string,
  expectedKeys: readonly string[],
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fixtureError(location, "expected a mapping", "provide the documented mapping fields");
  }

  const object = value as Record<string, unknown>;
  const actualKeys = Object.keys(object);
  const unknownKeys = actualKeys.filter((key) => !expectedKeys.includes(key));
  const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key));
  if (unknownKeys.length > 0) {
    fixtureError(
      location,
      `unknown field(s): ${unknownKeys.join(", ")}`,
      "remove them or add an intentional parser contract",
    );
  }
  if (missingKeys.length > 0) {
    fixtureError(
      location,
      `missing field(s): ${missingKeys.join(", ")}`,
      "supply every required field",
    );
  }
  return object;
}

function nonEmptyString(value: unknown, location: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fixtureError(location, "expected a non-empty string", "supply a reviewed literal value");
  }
  return value;
}

function nullableString(value: unknown, location: string): string | null {
  return value === null ? null : nonEmptyString(value, location);
}

function positiveInteger(value: unknown, location: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    fixtureError(location, "expected a positive integer", "supply a bounded integer greater than zero");
  }
  return value;
}

function nonEmptyArray(value: unknown, location: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    fixtureError(location, "expected a non-empty sequence", "restore the reviewed fixture corpus");
  }
  return value;
}

function stringArray(value: unknown, location: string): string[] {
  return nonEmptyArray(value, location).map((item, index) =>
    nonEmptyString(item, `${location}[${index}]`),
  );
}

function enumValue<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  location: string,
): T[number] {
  const parsed = nonEmptyString(value, location);
  if (!allowed.includes(parsed)) {
    fixtureError(
      location,
      `unsupported value ${JSON.stringify(parsed)}`,
      `use exactly one of ${allowed.join(" | ")}`,
    );
  }
  return parsed as T[number];
}

function uniqueBy<T>(
  values: readonly T[],
  identity: (value: T) => string,
  location: string,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    const id = identity(value);
    if (seen.has(id)) {
      fixtureError(location, `duplicate identity ${JSON.stringify(id)}`, "make every identity unique");
    }
    seen.add(id);
  }
}

function httpsUrl(value: string, location: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    fixtureError(location, `invalid URL ${JSON.stringify(value)}`, "supply an absolute HTTPS URL");
  }
  if (parsed.protocol !== "https:") {
    fixtureError(location, `non-HTTPS URL ${JSON.stringify(value)}`, "use a signed-out-safe HTTPS URL");
  }
  return value;
}

function internalPath(value: string, location: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) {
    fixtureError(location, `invalid internal path ${JSON.stringify(value)}`, "start the route with one slash");
  }
  return value;
}

function checkedDate(value: unknown, location: string): string {
  const date = nonEmptyString(value, location);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    fixtureError(location, `invalid review date ${JSON.stringify(date)}`, "use an actual YYYY-MM-DD date");
  }
  return date;
}

function checkReviewWindow(verifiedOn: string, reverifyBy: string, location: string): void {
  if (reverifyBy < verifiedOn) {
    fixtureError(location, "reverifyBy precedes verifiedOn", "set a review deadline after verification");
  }
  const today = new Date().toISOString().slice(0, 10);
  if (reverifyBy < today) {
    fixtureError(
      location,
      `evidence expired on ${reverifyBy}`,
      "reverify every cited claim and update the source ledger before publication",
    );
  }
}

function checkRevision(value: string, location: string): void {
  if (value.length < 8 || /\b(?:latest|head|main|develop)\b/i.test(value)) {
    fixtureError(
      location,
      `revision is not immutable enough: ${JSON.stringify(value)}`,
      "pin a release, commit, or dated vendor-documentation review",
    );
  }
}

function parseMetadata(value: unknown, location: string): MetadataFixture {
  const object = exactObject(value, location, [
    "title",
    "description",
    "canonical",
    "openGraph",
    "twitter",
  ]);
  const openGraph = exactObject(object.openGraph, `${location}.openGraph`, [
    "title",
    "description",
    "url",
    "type",
  ]);
  const twitter = exactObject(object.twitter, `${location}.twitter`, [
    "card",
    "title",
    "description",
  ]);
  return {
    title: nonEmptyString(object.title, `${location}.title`),
    description: nonEmptyString(object.description, `${location}.description`),
    canonical: httpsUrl(
      nonEmptyString(object.canonical, `${location}.canonical`),
      `${location}.canonical`,
    ),
    openGraph: {
      title: nonEmptyString(openGraph.title, `${location}.openGraph.title`),
      description: nonEmptyString(openGraph.description, `${location}.openGraph.description`),
      url: httpsUrl(
        nonEmptyString(openGraph.url, `${location}.openGraph.url`),
        `${location}.openGraph.url`,
      ),
      type: nonEmptyString(openGraph.type, `${location}.openGraph.type`),
    },
    twitter: {
      card: nonEmptyString(twitter.card, `${location}.twitter.card`),
      title: nonEmptyString(twitter.title, `${location}.twitter.title`),
      description: nonEmptyString(twitter.description, `${location}.twitter.description`),
    },
  };
}

function parseEvidenceRef(value: unknown, location: string): EvidenceRefFixture {
  const object = exactObject(value, location, ["id", "evidence"]);
  return {
    id: nonEmptyString(object.id, `${location}.id`),
    evidence: stringArray(object.evidence, `${location}.evidence`),
  };
}

function parseInstruction(value: unknown, location: string): InstructionFixture {
  const object = exactObject(value, location, [
    "id",
    "body",
    "command",
    "action",
    "qualification",
    "evidence",
  ]);
  let action = null;
  if (object.action !== null) {
    const actionObject = exactObject(object.action, `${location}.action`, [
      "label",
      "accessibleName",
      "target",
    ]);
    action = {
      label: nonEmptyString(actionObject.label, `${location}.action.label`),
      accessibleName: nonEmptyString(
        actionObject.accessibleName,
        `${location}.action.accessibleName`,
      ),
      target: httpsUrl(
        nonEmptyString(actionObject.target, `${location}.action.target`),
        `${location}.action.target`,
      ),
    };
  }
  return {
    id: nonEmptyString(object.id, `${location}.id`),
    body: nonEmptyString(object.body, `${location}.body`),
    command: nullableString(object.command, `${location}.command`),
    action,
    qualification: nonEmptyString(object.qualification, `${location}.qualification`),
    evidence: stringArray(object.evidence, `${location}.evidence`),
  };
}

function parseHeroFigure(value: unknown, location: string): HeroFigureFixture {
  const figure = exactObject(value, location, [
    "accessibleName",
    "stateText",
    "caption",
    "aspectRatio",
  ]);
  const aspectRatio = nonEmptyString(figure.aspectRatio, `${location}.aspectRatio`);
  if (!/^\d+\s*\/\s*\d+$/.test(aspectRatio)) {
    fixtureError(
      `${location}.aspectRatio`,
      `invalid aspect ratio ${JSON.stringify(aspectRatio)}`,
      "use a positive width / height ratio",
    );
  }
  return {
    accessibleName: nonEmptyString(figure.accessibleName, `${location}.accessibleName`),
    stateText: nonEmptyString(figure.stateText, `${location}.stateText`),
    caption: nonEmptyString(figure.caption, `${location}.caption`),
    aspectRatio,
  };
}

function parseVillage(value: unknown, location: string): VillageFixture {
  const object = exactObject(value, location, [
    "route",
    "hero",
    "start",
    "community",
    "example",
    "governance",
    "related",
  ]);
  const hero = exactObject(object.hero, `${location}.hero`, ["title"]);
  const startObject = exactObject(object.start, `${location}.start`, [
    "title",
    "stepsLabel",
    "continueLabel",
    "doneLabel",
    "backLabel",
    "copyAllLabel",
    "steps",
  ]);
  const steps = nonEmptyArray(startObject.steps, `${location}.start.steps`).map((item, index) =>
    parseStartStep(item, `${location}.start.steps[${index}]`),
  );
  uniqueBy(steps, (step) => step.id, `${location}.start.steps.id`);
  if (steps.filter((step) => step.command !== null).length < 2) {
    fixtureError(
      `${location}.start.steps`,
      "fewer than two steps carry a command",
      "a copy-all control only earns its place over a multi-command sequence",
    );
  }
  const community = exactObject(object.community, `${location}.community`, [
    "title",
    "joinLabel",
  ]);
  const example = exactObject(object.example, `${location}.example`, [
    "head",
    "title",
    "desc",
    "bullets",
    "members",
    "transcripts",
    "linked",
  ]);
  const bullets = stringArray(example.bullets, `${location}.example.bullets`);
  if (bullets.length !== 2) {
    fixtureError(
      `${location}.example.bullets`,
      `expected exactly two bullets, found ${bullets.length}`,
      "keep the fairtrade collective card's two policy bullets",
    );
  }
  const governance = exactObject(object.governance, `${location}.governance`, ["title"]);
  const related = nonEmptyArray(object.related, `${location}.related`).map((item, index) => {
    const link = exactObject(item, `${location}.related[${index}]`, ["id", "target"]);
    return {
      id: nonEmptyString(link.id, `${location}.related[${index}].id`),
      target: nonEmptyString(link.target, `${location}.related[${index}].target`),
    };
  });
  uniqueBy(related, (link) => link.id, `${location}.related.id`);

  return {
    route: internalPath(nonEmptyString(object.route, `${location}.route`), `${location}.route`),
    hero: { title: nonEmptyString(hero.title, `${location}.hero.title`) },
    start: {
      title: nonEmptyString(startObject.title, `${location}.start.title`),
      stepsLabel: nonEmptyString(startObject.stepsLabel, `${location}.start.stepsLabel`),
      continueLabel: nonEmptyString(startObject.continueLabel, `${location}.start.continueLabel`),
      doneLabel: nonEmptyString(startObject.doneLabel, `${location}.start.doneLabel`),
      backLabel: nonEmptyString(startObject.backLabel, `${location}.start.backLabel`),
      copyAllLabel: nonEmptyString(startObject.copyAllLabel, `${location}.start.copyAllLabel`),
      steps,
    },
    community: {
      title: nonEmptyString(community.title, `${location}.community.title`),
      joinLabel: nonEmptyString(community.joinLabel, `${location}.community.joinLabel`),
    },
    example: {
      head: nonEmptyString(example.head, `${location}.example.head`),
      title: nonEmptyString(example.title, `${location}.example.title`),
      desc: nonEmptyString(example.desc, `${location}.example.desc`),
      bullets,
      members: nonEmptyString(example.members, `${location}.example.members`),
      transcripts: nonEmptyString(example.transcripts, `${location}.example.transcripts`),
      linked: nonEmptyString(example.linked, `${location}.example.linked`),
    },
    governance: {
      title: nonEmptyString(governance.title, `${location}.governance.title`),
    },
    related,
  };
}

function parseEvidence(value: unknown, location: string): EvidenceFixture {
  const object = exactObject(value, location, [
    "id",
    "sourceScope",
    "advertisedState",
    "revisionOrVersion",
    "sourceIds",
    "verifiedOn",
    "reverifyBy",
    "publicHref",
    "internalProvenance",
  ]);
  const revisionOrVersion = nonEmptyString(
    object.revisionOrVersion,
    `${location}.revisionOrVersion`,
  );
  checkRevision(revisionOrVersion, `${location}.revisionOrVersion`);
  const verifiedOn = checkedDate(object.verifiedOn, `${location}.verifiedOn`);
  const reverifyBy = checkedDate(object.reverifyBy, `${location}.reverifyBy`);
  checkReviewWindow(verifiedOn, reverifyBy, location);
  const publicHref = nullableString(object.publicHref, `${location}.publicHref`);
  if (publicHref !== null) {
    httpsUrl(publicHref, `${location}.publicHref`);
  }
  return {
    id: nonEmptyString(object.id, `${location}.id`),
    sourceScope: enumValue(object.sourceScope, SOURCE_SCOPES, `${location}.sourceScope`),
    advertisedState:
      object.advertisedState === null
        ? null
        : enumValue(object.advertisedState, ADVERTISED_STATES, `${location}.advertisedState`),
    revisionOrVersion,
    sourceIds: Array.isArray(object.sourceIds)
      ? object.sourceIds.map((item, index) =>
          nonEmptyString(item, `${location}.sourceIds[${index}]`),
        )
      : fixtureError(location, "sourceIds must be a sequence", "use [] when there are no parent sources"),
    verifiedOn,
    reverifyBy,
    publicHref,
    internalProvenance: nonEmptyString(object.internalProvenance, `${location}.internalProvenance`),
  };
}

function parseComparisonCell(value: unknown, location: string): ComparisonCellFixture {
  const object = exactObject(value, location, ["status", "qualification", "sources"]);
  const status = enumValue(object.status, COMPARISON_STATUSES, `${location}.status`);
  const qualification = nonEmptyString(object.qualification, `${location}.qualification`);
  const sources = stringArray(object.sources, `${location}.sources`);
  if (status === "not-documented" && !sources.includes("entire-declared-corpus-2026-07-28") && location.endsWith(".entire")) {
    fixtureError(location, "not-documented lacks the declared Entire corpus", "cite the dated declared-corpus evidence ID");
  }
  if (
    status === "not-documented" &&
    location.endsWith(".peasantLabs") &&
    !sources.includes("peasant-current-corpus-2026-07-28")
  ) {
    fixtureError(
      location,
      "not-documented lacks the declared peasant current-source corpus",
      "cite the dated peasant corpus evidence ID",
    );
  }
  return { status, qualification, sources };
}

/**
 * A story step is not a terminal line: it carries no shell comment, and every
 * step names a real command, so the walkthrough cannot grow a step the product
 * has no way to run.
 */
function parseStoryStep(value: unknown, location: string): StoryStepFixture {
  const object = exactObject(value, location, ["id", "title", "command"]);
  return {
    id: nonEmptyString(object.id, `${location}.id`),
    title: nonEmptyString(object.title, `${location}.title`),
    command: nonEmptyString(object.command, `${location}.command`),
  };
}

function parseStartStep(value: unknown, location: string): StartStepFixture {
  const object = exactObject(value, location, ["id", "title", "comment", "command"]);
  const comment = nonEmptyString(object.comment, `${location}.comment`);
  if (!comment.startsWith("# ")) {
    fixtureError(
      `${location}.comment`,
      `terminal annotation is not a shell comment: ${JSON.stringify(comment)}`,
      "start the annotation with '# ' so it reads as a comment beside the command",
    );
  }
  return {
    id: nonEmptyString(object.id, `${location}.id`),
    title: nonEmptyString(object.title, `${location}.title`),
    comment,
    command: nullableString(object.command, `${location}.command`),
  };
}

function loadFixture(): ProjectFixture {
  let source: string;
  try {
    source = readFileSync(FIXTURE_PATH, "utf8");
  } catch (error) {
    fixtureError("root", `could not read fixture: ${String(error)}`, "restore the fixture file");
  }
  if (source.trim() === "") {
    fixtureError("root", "fixture is empty", "restore the reviewed YAML corpus");
  }

  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length > 0) {
    fixtureError(
      "root",
      document.errors.map((error) => error.message).join("; "),
      "correct invalid YAML or duplicate mapping keys",
    );
  }
  const root = exactObject(document.toJS(), "root", [
    "version",
    "copyPolicy",
    "site",
    "catalog",
    "viewer",
    "install",
    "story",
    "redaction",
    "community",
    "faq",
    "peasant",
    "village",
    "evidence",
    "comparison",
    "viewports",
    "invalidCase",
  ]);
  if (root.version !== 1) {
    fixtureError("root.version", `unsupported version ${String(root.version)}`, "use fixture version 1");
  }

  const copyPolicyObject = exactObject(root.copyPolicy, "copyPolicy", [
    "preservedSentenceStarts",
  ]);
  const preservedSentenceStarts = stringArray(
    copyPolicyObject.preservedSentenceStarts,
    "copyPolicy.preservedSentenceStarts",
  );
  uniqueBy(
    preservedSentenceStarts,
    (value) => value,
    "copyPolicy.preservedSentenceStarts",
  );

  const siteObject = exactObject(root.site, "site", ["baseUrl", "routes", "sitemap"]);
  const baseUrl = httpsUrl(nonEmptyString(siteObject.baseUrl, "site.baseUrl"), "site.baseUrl").replace(/\/$/, "");
  const routes = nonEmptyArray(siteObject.routes, "site.routes").map((item, index) => {
    const route = exactObject(item, `site.routes[${index}]`, ["id", "path", "h1", "metadata"]);
    return {
      id: nonEmptyString(route.id, `site.routes[${index}].id`),
      path: internalPath(nonEmptyString(route.path, `site.routes[${index}].path`), `site.routes[${index}].path`),
      h1: nonEmptyString(route.h1, `site.routes[${index}].h1`),
      metadata: parseMetadata(route.metadata, `site.routes[${index}].metadata`),
    };
  });
  if (routes.length !== 4) {
    fixtureError("site.routes", `expected four routes, found ${routes.length}`, "restore / and the three project routes");
  }
  uniqueBy(routes, (route) => route.id, "site.routes.id");
  uniqueBy(routes, (route) => route.path, "site.routes.path");
  for (const route of routes) {
    const expectedCanonical = route.path === "/" ? baseUrl : `${baseUrl}${route.path}`;
    if (route.metadata.canonical.replace(/\/$/, "") !== expectedCanonical) {
      fixtureError(
        `site.routes.${route.id}.metadata.canonical`,
        `expected ${expectedCanonical}, found ${route.metadata.canonical}`,
        "align canonical metadata with the route and site base URL",
      );
    }
  }
  const sitemap = stringArray(siteObject.sitemap, "site.sitemap").map((url, index) =>
    httpsUrl(url, `site.sitemap[${index}]`).replace(/\/$/, ""),
  );
  if (sitemap.length !== 4 || JSON.stringify(sitemap) !== JSON.stringify(routes.map((route) => route.metadata.canonical.replace(/\/$/, "")))) {
    fixtureError("site.sitemap", "sitemap does not exactly match route order", "list the four route canonicals in route order");
  }

  const catalogObject = exactObject(root.catalog, "catalog", [
    "cards",
    "whatTitle",
    "cardsTitle",
  ]);
  const viewerObject = exactObject(root.viewer, "viewer", [
    "title",
    "label",
    "sessionId",
    "disclosure",
    "turns",
    "openingTab",
    "otherTab",
  ]);
  const openingTab = nonEmptyString(viewerObject.openingTab, "viewer.openingTab");
  const otherTab = nonEmptyString(viewerObject.otherTab, "viewer.otherTab");
  if (openingTab === otherTab) {
    fixtureError(
      "viewer.otherTab",
      "the second tab is the one the viewer already opens on",
      "name a different tab, so switching away is what gets proven",
    );
  }
  const installObject = exactObject(root.install, "install", ["command"]);
  const installCommand = nonEmptyString(installObject.command, "install.command");
  if (!installCommand.startsWith("curl ")) {
    fixtureError(
      "install.command",
      `not a one-line install command: ${JSON.stringify(installCommand)}`,
      "give the reader a single copyable curl line",
    );
  }
  const cards = nonEmptyArray(catalogObject.cards, "catalog.cards").map((item, index) => {
    const card = exactObject(item, `catalog.cards[${index}]`, [
      "id",
      "label",
      "target",
      "action",
      "kind",
    ]);
    return {
      id: enumValue(card.id, PROJECT_IDS, `catalog.cards[${index}].id`),
      label: nonEmptyString(card.label, `catalog.cards[${index}].label`),
      target: internalPath(nonEmptyString(card.target, `catalog.cards[${index}].target`), `catalog.cards[${index}].target`),
      action: nonEmptyString(card.action, `catalog.cards[${index}].action`),
      kind: nonEmptyString(card.kind, `catalog.cards[${index}].kind`),
    };
  });
  if (cards.length !== 2 || cards.some((card, index) => card.id !== PROJECT_IDS[index])) {
    fixtureError("catalog.cards", "cards must be exactly peasant then village", "restore the two-card order");
  }
  uniqueBy(cards, (card) => card.id, "catalog.cards.id");

  const storyObject = exactObject(root.story, "story", ["title", "stepsLabel", "steps"]);
  const storySteps = nonEmptyArray(storyObject.steps, "story.steps").map((item, index) =>
    parseStoryStep(item, `story.steps[${index}]`),
  );
  uniqueBy(storySteps, (step) => step.id, "story.steps.id");

  const redactionObject = exactObject(root.redaction, "redaction", [
    "title",
    "note",
    "level",
    "removedLevels",
    "matches",
  ]);
  const redactionLevel = nonEmptyString(redactionObject.level, "redaction.level");
  const removedLevels = stringArray(redactionObject.removedLevels, "redaction.removedLevels");
  if (removedLevels.includes(redactionLevel)) {
    fixtureError(
      "redaction.removedLevels",
      `the level in force, ${JSON.stringify(redactionLevel)}, is also listed as withdrawn`,
      "list only the levels the product no longer ships",
    );
  }
  const redactionMatches = nonEmptyArray(redactionObject.matches, "redaction.matches").map(
    (item, index) => {
      const location = `redaction.matches[${index}]`;
      const match = exactObject(item, location, ["id", "category", "kept", "secret", "after"]);
      const kept = match.kept;
      if (typeof kept !== "boolean") {
        fixtureError(
          `${location}.kept`,
          `expected a boolean, found ${JSON.stringify(kept)}`,
          "state outright whether this match is sent or withheld",
        );
      }
      return {
        id: nonEmptyString(match.id, `${location}.id`),
        category: nonEmptyString(match.category, `${location}.category`),
        kept: kept as boolean,
        secret: nonEmptyString(match.secret, `${location}.secret`),
        after: nonEmptyString(match.after, `${location}.after`),
      };
    },
  );
  uniqueBy(redactionMatches, (match) => match.id, "redaction.matches.id");
  // A redaction demo that hides nothing, or hides everything, teaches the wrong
  // lesson: the panel exists to show that keeping a match is possible and counted.
  if (!redactionMatches.some((match) => match.kept)) {
    fixtureError(
      "redaction.matches",
      "no match is kept un-redacted",
      "keep one match so the panel shows what opting out looks like",
    );
  }
  if (!redactionMatches.some((match) => !match.kept)) {
    fixtureError(
      "redaction.matches",
      "every match is kept un-redacted",
      "redact at least one match so the default behaviour is visible",
    );
  }

  const communityObject = exactObject(root.community, "community", ["title", "points"]);
  const communityPoints = stringArray(communityObject.points, "community.points");

  const faqObject = exactObject(root.faq, "faq", [
    "title",
    "label",
    "forbiddenClaims",
    "questions",
  ]);
  const forbiddenClaims = stringArray(faqObject.forbiddenClaims, "faq.forbiddenClaims");
  const faqQuestions = nonEmptyArray(faqObject.questions, "faq.questions").map((item, index) => {
    const entry = exactObject(item, `faq.questions[${index}]`, ["id", "question"]);
    const question = nonEmptyString(entry.question, `faq.questions[${index}].question`);
    if (!question.endsWith("?")) {
      fixtureError(
        `faq.questions[${index}].question`,
        `not phrased as a question: ${JSON.stringify(question)}`,
        "write the reader's actual question, ending in a question mark",
      );
    }
    return { id: nonEmptyString(entry.id, `faq.questions[${index}].id`), question };
  });
  uniqueBy(faqQuestions, (entry) => entry.id, "faq.questions.id");

  const peasantObject = exactObject(root.peasant, "peasant", [
    "route",
    "hero",
    "start",
    "uses",
    "related",
  ]);
  const peasantHero = exactObject(peasantObject.hero, "peasant.hero", ["title"]);
  const startObject = exactObject(peasantObject.start, "peasant.start", [
    "title",
    "stepsLabel",
    "continueLabel",
    "doneLabel",
    "backLabel",
    "copyAllLabel",
    "steps",
  ]);
  const startSteps = nonEmptyArray(startObject.steps, "peasant.start.steps").map((item, index) =>
    parseStartStep(item, `peasant.start.steps[${index}]`),
  );
  uniqueBy(startSteps, (step) => step.id, "peasant.start.steps.id");
  if (startSteps.filter((step) => step.command !== null).length < 2) {
    fixtureError(
      "peasant.start.steps",
      "fewer than two steps carry a command",
      "a copy-all control only earns its place over a multi-command sequence",
    );
  }
  const peasantUses = nonEmptyArray(peasantObject.uses, "peasant.uses").map((item, index) => {
    const use = exactObject(item, `peasant.uses[${index}]`, ["id", "title"]);
    return {
      id: nonEmptyString(use.id, `peasant.uses[${index}].id`),
      title: nonEmptyString(use.title, `peasant.uses[${index}].title`),
    };
  });
  uniqueBy(peasantUses, (use) => use.id, "peasant.uses.id");
  const peasantRelated = nonEmptyArray(peasantObject.related, "peasant.related").map(
    (item, index) => {
      const link = exactObject(item, `peasant.related[${index}]`, ["id", "target"]);
      return {
        id: nonEmptyString(link.id, `peasant.related[${index}].id`),
        target: nonEmptyString(link.target, `peasant.related[${index}].target`),
      };
    },
  );
  uniqueBy(peasantRelated, (link) => link.id, "peasant.related.id");

  const village = parseVillage(root.village, "village");
  // both product detail pages are plain explainers now; comparison still carries
  // the source-scoped evidence. Both routes must still be reachable from a card.
  const peasantRoute = internalPath(
    nonEmptyString(peasantObject.route, "peasant.route"),
    "peasant.route",
  );
  const routeByCard = new Map<string, string>([
    ["peasant", peasantRoute],
    ["village", village.route],
  ]);
  for (const card of cards) {
    if (card.target !== routeByCard.get(card.id)) {
      fixtureError(
        `catalog.cards.${card.id}.target`,
        `card target ${card.target} differs from the page route ${routeByCard.get(card.id)}`,
        "use one exact route per product",
      );
    }
  }

  const evidence = nonEmptyArray(root.evidence, "evidence").map((item, index) =>
    parseEvidence(item, `evidence[${index}]`),
  );
  uniqueBy(evidence, (item) => item.id, "evidence.id");
  const evidenceIds = new Set(evidence.map((item) => item.id));

  const comparisonObject = exactObject(root.comparison, "comparison", [
    "title",
    "intro",
    "bundleDefinition",
    "meaningNote",
    "rows",
  ]);
  const rows = nonEmptyArray(comparisonObject.rows, "comparison.rows").map((item, index) => {
    const row = exactObject(item, `comparison.rows[${index}]`, [
      "id",
      "capability",
      "peasantLabs",
      "entire",
    ]);
    return {
      id: nonEmptyString(row.id, `comparison.rows[${index}].id`),
      capability: nonEmptyString(row.capability, `comparison.rows[${index}].capability`),
      peasantLabs: parseComparisonCell(row.peasantLabs, `comparison.rows[${index}].peasantLabs`),
      entire: parseComparisonCell(row.entire, `comparison.rows[${index}].entire`),
    };
  });
  if (rows.length !== 6) {
    fixtureError("comparison.rows", `expected six rows, found ${rows.length}`, "restore the balanced row inventory");
  }
  uniqueBy(rows, (row) => row.id, "comparison.rows.id");
  uniqueBy(rows, (row) => row.capability, "comparison.rows.capability");
  if (!rows.some((row) => row.peasantLabs.status === "yes" && row.entire.status === "yes")) {
    fixtureError("comparison.rows", "shared baseline is missing", "retain at least one row both products satisfy");
  }
  if (!rows.some((row) => row.entire.status === "yes" && row.peasantLabs.status !== "yes")) {
    fixtureError("comparison.rows", "Entire advantage is missing", "retain a sourced row where Entire is ahead");
  }
  if (!rows.some((row) => row.peasantLabs.status === "yes" && row.entire.status !== "yes")) {
    fixtureError("comparison.rows", "peasant labs distinction is missing", "retain a sourced row where peasant labs is ahead");
  }

  const referencedEvidence: Array<{ location: string; ids: string[] }> = [];
  for (const item of evidence) {
    referencedEvidence.push({ location: `evidence.${item.id}.sourceIds`, ids: item.sourceIds });
  }
  for (const row of rows) {
    referencedEvidence.push({ location: `comparison.${row.id}.peasantLabs`, ids: row.peasantLabs.sources });
    referencedEvidence.push({ location: `comparison.${row.id}.entire`, ids: row.entire.sources });
  }
  for (const reference of referencedEvidence) {
    for (const id of reference.ids) {
      if (!evidenceIds.has(id)) {
        fixtureError(reference.location, `unresolved evidence ID ${JSON.stringify(id)}`, "add the evidence record or correct the reference");
      }
    }
  }

  const viewports = nonEmptyArray(root.viewports, "viewports").map((item, index) => {
    const viewport = exactObject(item, `viewports[${index}]`, [
      "id",
      "width",
      "height",
      "theme",
      "reflowEquivalent",
    ]);
    const width = positiveInteger(viewport.width, `viewports[${index}].width`);
    let reflowEquivalent = null;
    if (viewport.reflowEquivalent !== null) {
      const reflow = exactObject(
        viewport.reflowEquivalent,
        `viewports[${index}].reflowEquivalent`,
        ["sourceCssWidth", "zoomPercent", "browserZoomEmulated"],
      );
      const sourceCssWidth = positiveInteger(
        reflow.sourceCssWidth,
        `viewports[${index}].reflowEquivalent.sourceCssWidth`,
      );
      const zoomPercent = positiveInteger(
        reflow.zoomPercent,
        `viewports[${index}].reflowEquivalent.zoomPercent`,
      );
      if (reflow.browserZoomEmulated !== false) {
        fixtureError(
          `viewports[${index}].reflowEquivalent.browserZoomEmulated`,
          "the CSS-pixel case must not claim browser zoom emulation",
          "set browserZoomEmulated to false",
        );
      }
      if (sourceCssWidth / (zoomPercent / 100) !== width) {
        fixtureError(
          `viewports[${index}].reflowEquivalent`,
          "source width and zoom do not equal the tested CSS viewport width",
          "make sourceCssWidth / zoom scale equal width",
        );
      }
      reflowEquivalent = { sourceCssWidth, zoomPercent, browserZoomEmulated: false } as const;
    }
    return {
      id: nonEmptyString(viewport.id, `viewports[${index}].id`),
      width,
      height: positiveInteger(viewport.height, `viewports[${index}].height`),
      theme: enumValue(viewport.theme, THEMES, `viewports[${index}].theme`),
      reflowEquivalent,
    };
  });
  uniqueBy(viewports, (viewport) => viewport.id, "viewports.id");
  if (!THEMES.every((theme) => viewports.some((viewport) => viewport.theme === theme)) || !viewports.some((viewport) => viewport.width === 320)) {
    fixtureError("viewports", "both themes or the 320px reflow boundary is missing", "restore bounded dark/light desktop/phone cases");
  }

  const invalidCaseObject = exactObject(root.invalidCase, "invalidCase", [
    "kind",
    "route",
    "selector",
    "expectedFirstText",
  ]);
  const invalidKind = enumValue(
    invalidCaseObject.kind,
    ["expected-value-mismatch"] as const,
    "invalidCase.kind",
  );

  return {
    version: 1,
    copyPolicy: { preservedSentenceStarts },
    site: { baseUrl, routes, sitemap },
    catalog: {
      cards,
      whatTitle: nonEmptyString(catalogObject.whatTitle, "catalog.whatTitle"),
      cardsTitle: nonEmptyString(catalogObject.cardsTitle, "catalog.cardsTitle"),
    },
    viewer: {
      title: nonEmptyString(viewerObject.title, "viewer.title"),
      label: nonEmptyString(viewerObject.label, "viewer.label"),
      sessionId: nonEmptyString(viewerObject.sessionId, "viewer.sessionId"),
      disclosure: nonEmptyString(viewerObject.disclosure, "viewer.disclosure"),
      turns: positiveInteger(viewerObject.turns, "viewer.turns"),
      openingTab,
      otherTab,
    },
    install: {
      command: installCommand,
    },
    story: {
      title: nonEmptyString(storyObject.title, "story.title"),
      stepsLabel: nonEmptyString(storyObject.stepsLabel, "story.stepsLabel"),
      steps: storySteps,
    },
    redaction: {
      title: nonEmptyString(redactionObject.title, "redaction.title"),
      note: nonEmptyString(redactionObject.note, "redaction.note"),
      level: redactionLevel,
      removedLevels,
      matches: redactionMatches,
    },
    community: {
      title: nonEmptyString(communityObject.title, "community.title"),
      points: communityPoints,
    },
    faq: {
      title: nonEmptyString(faqObject.title, "faq.title"),
      label: nonEmptyString(faqObject.label, "faq.label"),
      forbiddenClaims,
      questions: faqQuestions,
    },
    peasant: {
      route: peasantRoute,
      hero: { title: nonEmptyString(peasantHero.title, "peasant.hero.title") },
      start: {
        title: nonEmptyString(startObject.title, "peasant.start.title"),
        stepsLabel: nonEmptyString(startObject.stepsLabel, "peasant.start.stepsLabel"),
        continueLabel: nonEmptyString(startObject.continueLabel, "peasant.start.continueLabel"),
        doneLabel: nonEmptyString(startObject.doneLabel, "peasant.start.doneLabel"),
        backLabel: nonEmptyString(startObject.backLabel, "peasant.start.backLabel"),
        copyAllLabel: nonEmptyString(startObject.copyAllLabel, "peasant.start.copyAllLabel"),
        steps: startSteps,
      },
      uses: peasantUses,
      related: peasantRelated,
    },
    village,
    evidence,
    comparison: {
      title: nonEmptyString(comparisonObject.title, "comparison.title"),
      intro: nonEmptyString(comparisonObject.intro, "comparison.intro"),
      bundleDefinition: nonEmptyString(comparisonObject.bundleDefinition, "comparison.bundleDefinition"),
      meaningNote: nonEmptyString(comparisonObject.meaningNote, "comparison.meaningNote"),
      rows,
    },
    viewports,
    invalidCase: {
      kind: invalidKind,
      route: internalPath(nonEmptyString(invalidCaseObject.route, "invalidCase.route"), "invalidCase.route"),
      selector: nonEmptyString(invalidCaseObject.selector, "invalidCase.selector"),
      expectedFirstText: nonEmptyString(invalidCaseObject.expectedFirstText, "invalidCase.expectedFirstText"),
    },
  };
}

const fixture = loadFixture();
const evidenceById = new Map(fixture.evidence.map((evidence) => [evidence.id, evidence]));

function evidenceIds(locator: Locator): Promise<string[]> {
  return locator.locator("[data-evidence-id]").evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-evidence-id") ?? ""),
  );
}

async function expectEvidenceReference(
  locator: Locator,
  expected: EvidenceFixture,
  detailed = false,
): Promise<void> {
  await expect(locator).toHaveCount(1);
  await expect(locator).toHaveAttribute("data-source-scope", expected.sourceScope);
  await expect(locator).toHaveAttribute("data-verified-on", expected.verifiedOn);
  await expect(locator).toHaveAttribute("data-reverify-by", expected.reverifyBy);
  const href = await locator.evaluate((element) =>
    element instanceof HTMLAnchorElement
      ? element.getAttribute("href")
      : element.querySelector("a")?.getAttribute("href") ?? null,
  );
  expect(href).toBe(expected.publicHref);
  const linkSecurity = await locator.evaluate((element) => {
    const anchor =
      element instanceof HTMLAnchorElement ? element : element.querySelector<HTMLAnchorElement>("a");
    return anchor ? { target: anchor.target, rel: anchor.rel } : null;
  });
  if (expected.publicHref === null) {
    expect(linkSecurity).toBeNull();
  } else {
    expect(linkSecurity?.target).toBe("_blank");
    expect(linkSecurity?.rel.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
  }
  if (detailed) {
    await expect(locator).toContainText(expected.revisionOrVersion);
    await expect(locator).toContainText(expected.internalProvenance);
    await expect(locator).toContainText(`verified ${expected.verifiedOn}`);
    await expect(locator).toContainText(`reverify by ${expected.reverifyBy}`);
  }
}

async function expectMetadata(page: Page, metadata: MetadataFixture): Promise<void> {
  await expect(page).toHaveTitle(metadata.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", metadata.description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", metadata.canonical);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", metadata.openGraph.title);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", metadata.openGraph.description);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", metadata.openGraph.url);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", metadata.openGraph.type);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", metadata.twitter.card);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", metadata.twitter.title);
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", metadata.twitter.description);
}

async function chooseTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("peasant-labs-theme", selectedTheme);
  }, theme);
}

function numericAspectRatio(value: string): number {
  const [width, height] = value.split("/").map((part) => Number(part.trim()));
  return width / height;
}

function heroFigureForRoute(_route: RouteFixture): HeroFigureFixture | null {
  // product detail pages ship without hero figures until real screenshots exist.
  return null;
}

async function expectHeroFigure(page: Page, expected: HeroFigureFixture) {
  const figures = page.locator("figure[data-project-figure]");
  await expect(figures).toHaveCount(1);
  const figure = page.locator("header figure[data-project-figure][data-hero-figure]");
  await expect(figure).toHaveCount(1);
  await expect(figure).toHaveAttribute("aria-label", expected.accessibleName);
  await expect(figure.locator("[data-figure-state]")).toHaveText(expected.stateText);
  await expect(figure.locator("figcaption")).toHaveText(expected.caption);
  await expect(figure.locator("img")).toHaveCount(0);
  const geometry = await figure.evaluate((element) => {
    const slot = element.querySelector<HTMLElement>("[data-figure-state]");
    if (!slot) {
      throw new Error(
        "Hero figure geometry could not be verified because its media slot is missing; restore [data-figure-state] inside the semantic figure.",
      );
    }
    const figureRect = element.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    return {
      aspectRatio: getComputedStyle(slot).aspectRatio,
      renderedRatio: slotRect.width / slotRect.height,
      contained:
        slotRect.left >= figureRect.left &&
        slotRect.right <= figureRect.right &&
        slotRect.width <= element.clientWidth,
    };
  });
  expect(geometry.aspectRatio).toBe(expected.aspectRatio);
  expect(geometry.renderedRatio).toBeCloseTo(numericAspectRatio(expected.aspectRatio), 2);
  expect(geometry.contained).toBe(true);
}

function uppercaseSentenceOpenings(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== "")
    .filter((sentence) => {
      const firstLetter = sentence.search(/[A-Za-z]/);
      if (firstLetter === -1) {
        return false;
      }
      const opening = sentence.slice(firstLetter);
      if (
        fixture.copyPolicy.preservedSentenceStarts.some(
          (term) => opening === term || opening.startsWith(`${term} `) || opening.startsWith(`${term}:`),
        )
      ) {
        return false;
      }
      const first = opening[0];
      return first !== first.toLowerCase();
    });
}

async function authoredTextNodes(page: Page): Promise<string[]> {
  return page.locator(".pj-main").evaluate((main) => {
    // The demo transcript is quoted session content, not authored site copy, so
    // it keeps its natural sentence casing the same way code and citations do.
    //
    // Text hidden from assistive technology is decoration by definition, never
    // prose a reader is meant to read — the design system's avatars derive
    // uppercase initials from a name ("desert archivists" renders "DA"), and
    // this guard is about how sentences were authored, not about glyphs a
    // component generated.
    const excluded =
      ".pj-citations, .pj-evidence-ledger, [data-transcript-demo], [data-redaction-demo], code, pre, [aria-hidden='true']";
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    const values: string[] = [];
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      const value = node.textContent?.trim();
      if (parent && value && !parent.closest(excluded)) {
        values.push(value);
      }
      node = walker.nextNode();
    }
    return values;
  });
}

test("the fixture is a complete independent oracle", () => {
  expect(fixture.catalog.cards.map((card) => card.id)).toEqual([...PROJECT_IDS]);
  expect(fixture.village.start.steps.length).toBeGreaterThanOrEqual(3);
  expect(fixture.viewer.turns).toBeGreaterThanOrEqual(3);
  expect(fixture.peasant.start.steps.length).toBeGreaterThanOrEqual(3);
  expect(fixture.story.steps.length).toBeGreaterThanOrEqual(2);
  expect(fixture.community.points.length).toBeGreaterThanOrEqual(3);
  expect(fixture.faq.questions.length).toBeGreaterThanOrEqual(4);
  expect(fixture.comparison.rows).toHaveLength(6);
  expect(new Set(fixture.comparison.rows.flatMap((row) => [row.peasantLabs.status, row.entire.status]))).toEqual(
    new Set(COMPARISON_STATUSES),
  );
});

test("project copy is authored lowercase without corrupting preserved literals", async ({ page }) => {
  const projectRoutes = fixture.site.routes.filter((route) => route.path.startsWith("/projects"));
  const violations: Array<{ route: string; sentence: string }> = [];
  for (const route of projectRoutes) {
    await page.goto(route.path);
    for (const value of await authoredTextNodes(page)) {
      for (const sentence of uppercaseSentenceOpenings(value)) {
        violations.push({ route: route.path, sentence });
      }
    }
    const textTransforms = await page
      .locator(
        ".pj-main h1, .pj-main h2, .pj-main h3, [data-reading-text], [data-qualification], figcaption, [data-takeaway]",
      )
      .evaluateAll((elements) =>
        elements
          .filter((element) => !element.closest("[data-transcript-demo]"))
          .map((element) => getComputedStyle(element).textTransform),
      );
    expect(textTransforms, `${route.path} must use authored casing rather than CSS coercion`).toEqual(
      textTransforms.map(() => "none"),
    );
  }
  expect(violations).toEqual([]);
});

test("the page never claims a license the source review forbids", async ({ page }) => {
  // peasant ships under a placeholder license, so "open source" may only ever
  // appear as part of a denial. A stray affirmative claim is a licensing error.
  for (const route of ["/projects", fixture.peasant.route]) {
    const response = await page.goto(route);
    const serverHtml = (await response!.text()).toLowerCase();
    for (const claim of fixture.faq.forbiddenClaims) {
      expect(serverHtml, `${route} asserts ${JSON.stringify(claim)}`).not.toContain(
        claim.toLowerCase(),
      );
    }
  }
});

for (const route of fixture.site.routes) {
  test(`${route.path} returns exact server-rendered content and metadata`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    const serverHtml = await response!.text();
    expect(serverHtml).toContain(route.h1);
    if (route.path === fixture.village.route) {
      expect(serverHtml).toContain(fixture.village.start.title);
      expect(serverHtml).toContain(fixture.village.community.title);
      expect(serverHtml).toContain(fixture.village.example.title);
    }
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(route.h1);
    const expectedFigure = heroFigureForRoute(route);
    if (expectedFigure) {
      expect(serverHtml).toContain(expectedFigure.accessibleName);
      expect(serverHtml).toContain(expectedFigure.stateText);
      expect(serverHtml).toContain(expectedFigure.caption);
      await expectHeroFigure(page, expectedFigure);
    } else {
      await expect(page.locator("figure[data-project-figure]")).toHaveCount(0);
    }
    await expectMetadata(page, route.metadata);
  });
}

test("the sitemap exposes exactly the fixture routes", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  const locations = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/\/$/, ""));
  expect(locations).toEqual(fixture.site.sitemap);
  expect(body).not.toContain("<lastmod>");
});

test("the catalog has exactly two whole-card routes and working focus transfer", async ({ page }) => {
  await page.goto("/projects");
  const cards = page.locator("[data-project-card]");
  await expect(cards).toHaveCount(fixture.catalog.cards.length);
  expect(await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-project-card")))).toEqual(
    fixture.catalog.cards.map((card) => card.id),
  );

  for (const [index, expected] of fixture.catalog.cards.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute("href", expected.target);
    await expect(card).toContainText(expected.label);
    await expect(card).toContainText(expected.action);
  }

  for (const expected of fixture.catalog.cards) {
    await page.goto("/projects");
    await page.locator(`[data-project-card="${expected.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${expected.target}$`));
    await expect(page.locator("h1")).toBeFocused();
  }
});

test("village renders the title, get-started wizard, and join-community example", async ({ page }) => {
  const response = await page.goto(fixture.village.route);
  expect(response?.status()).toBe(200);
  const serverHtml = await response!.text();

  await expect(page.locator("h1")).toHaveText(fixture.village.hero.title);
  await expect(page.locator("[data-availability]")).toHaveCount(0);
  await expect(page.locator("[data-project-feature]")).toHaveCount(0);
  await expect(page.locator("[data-evidence-disclosure]")).toHaveCount(0);
  await expect(page.locator(".pj-citations")).toHaveCount(0);

  // Same get-started chrome as peasant: title, copy-all, fairtrade wizard.
  const start = page.locator("[data-start]");
  await expect(start).toHaveCount(1);
  await expect(start.locator("h2")).toHaveText(fixture.village.start.title);
  expect(serverHtml).toContain("five commands, start to finish. everything here runs on your own machine.");
  await expect(page.locator("[data-copy-all]")).toHaveAttribute(
    "aria-label",
    `copy ${fixture.village.start.copyAllLabel}`,
  );

  const wizard = start.locator(
    `section.swz[aria-label="${fixture.village.start.stepsLabel}"]`,
  );
  await expect(wizard).toHaveCount(1);
  const rail = wizard.locator("nav.swz-rail .swz-step");
  await expect(rail).toHaveCount(fixture.village.start.steps.length);
  for (const [index, expected] of fixture.village.start.steps.entries()) {
    await expect(rail.nth(index).locator(".swz-label")).toHaveText(expected.title);
    expect(serverHtml).toContain(expected.title);
  }

  // Village runs the same wizard as peasant, so it inherits the same rule: a check
  // marks a step the reader is past, and on arrival they are past none of them.
  await expect(wizard.locator(".swz-mark-check")).toHaveCount(0);
  const villageFoot = wizard.locator(".swz-foot");
  await villageFoot.getByRole("button").last().click();
  await expect(wizard.locator(".swz-mark-check")).toHaveCount(1);
  await villageFoot.getByRole("button").first().click();
  await expect(wizard.locator(".swz-mark-check")).toHaveCount(0);
  // ...including the rail: every marker is a jump target here too.
  await rail.last().click();
  await expect(wizard.locator(".swz-body-kicker")).toHaveText(
    `step ${fixture.village.start.steps.length}: ${fixture.village.start.steps.at(-1)!.title}`,
  );
  await rail.first().click();
  await expect(wizard.locator(".swz-mark-check")).toHaveCount(0);

  const join = page.locator("[data-village-join]");
  await expect(join.locator("h2")).toHaveText(fixture.village.community.title);
  const example = page.locator("[data-village-example]");
  await expect(example).toContainText(fixture.village.example.head);
  await expect(example).toContainText(fixture.village.example.title);
  await expect(example).toContainText(fixture.village.example.desc);
  for (const bullet of fixture.village.example.bullets) {
    await expect(example).toContainText(bullet);
  }
  await expect(example).toContainText(fixture.village.example.members);
  await expect(example).toContainText("members");
  await expect(example).toContainText(fixture.village.example.transcripts);
  await expect(example).toContainText("transcripts");
  await expect(example).toContainText(fixture.village.example.linked);
  // the imagery band is what makes it a card-img rather than a plain card.
  await expect(example.locator(".card-thumb img")).toHaveCount(1);
  // fairtrade writes its own join control as a small primary button leading with a
  // decorative UserPlus, so this one does too rather than inventing a plain button.
  const joinControl = page.locator("[data-join-collective]");
  await expect(joinControl).toHaveText(fixture.village.community.joinLabel);
  await expect(joinControl).toHaveClass(/\bbtn\b/);
  await expect(joinControl).toHaveClass(/\bbtn-sm\b/);
  await expect(joinControl).toHaveClass(/\bbtn-primary\b/);
  await expect(joinControl.locator("svg.lucide[aria-hidden='true']")).toHaveCount(1);

  const governance = page.locator("[data-village-governance]");
  await expect(governance).toHaveCount(1);
  await expect(governance.locator("h2")).toHaveText(fixture.village.governance.title);
  const governanceCard = governance.locator("[data-village-governance-card]");
  await expect(governanceCard).toContainText("governance axes");
  // every axis a collective governs, not just the one a join moves.
  for (const axis of ["identity", "data access", "contribution", "retention"]) {
    await expect(governanceCard).toContainText(axis);
  }

  const joinButton = page.locator("[data-join-collective]");
  await joinButton.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(fixture.village.community.joinLabel);
  await expect(dialog).toContainText("not discoverable");
  // the dialog addresses the collective by handle, the way village does, not by the
  // display name the card is titled with.
  await expect(dialog).toContainText(
    fixture.village.example.title.trim().replace(/\s+/g, "-"),
  );

  // three plain rows, each a key over the thing a join makes true. Not ConsentSummary:
  // that boxes every icon in a chip and sets the key beside its value instead.
  await expect(dialog.locator(".cns-summary")).toHaveCount(0);
  const axes = dialog.locator("[data-join-axes]");
  for (const [key, value] of [
    ["identity", "profile shown to owners only"],
    ["to other members", "you stay anon"],
    ["your transcripts", "none contributed on joining"],
  ]) {
    await expect(axes).toContainText(key);
    await expect(axes).toContainText(value);
  }
  await expect(axes.locator(".pj-village-join-axis")).toHaveCount(3);

  await expect(dialog).toContainText("i understand and consent");
  await expect(dialog.getByRole("button", { name: "reveal & join" })).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  for (const link of fixture.village.related) {
    await expect(page.locator(`[data-related-link="${link.id}"]`)).toHaveAttribute(
      "href",
      link.target,
    );
  }
  const sibling = fixture.village.related.find((link) => link.id === "peasant");
  expect(sibling).toBeDefined();
  await page.locator(`[data-related-link="${sibling!.id}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${sibling!.target}$`));
  await expect(page.locator("h1")).toBeFocused();
});

test("the getting-started wizard walks every step and copies each command", async ({ page }) => {
  // The sequence lives with the product it installs, not in the catalog.
  const response = await page.goto(`${fixture.peasant.route}#get-started`);
  const serverHtml = await response!.text();
  const start = page.locator("[data-start]");
  await expect(start).toHaveCount(1);

  // fairtrade's wizard surface and its own rail. The shell around the rail is ours
  // because fairtrade's StepWizard owns its position uncontrolled and only ever adds
  // to its completed set, which left a check standing over a re-opened step.
  const wizard = start.locator(`section.swz[aria-label="${fixture.peasant.start.stepsLabel}"]`);
  await expect(wizard).toHaveCount(1);
  await expect(start.locator("[data-terminal]")).toHaveCount(0);

  // The rail names the whole sequence up front, even though one step is in view.
  const rail = wizard.locator("nav.swz-rail .swz-step");
  await expect(rail).toHaveCount(fixture.peasant.start.steps.length);
  for (const [index, expected] of fixture.peasant.start.steps.entries()) {
    await expect(rail.nth(index).locator(".swz-label")).toHaveText(expected.title);
    // Step names are server-rendered, so the sequence is findable without JavaScript.
    expect(serverHtml).toContain(expected.title);
  }

  const body = wizard.locator(".swz-body");
  const back = wizard.getByRole("button", { name: fixture.peasant.start.backLabel, exact: true });
  const forward = wizard.locator(".swz-foot").getByRole("button").last();

  for (const [index, expected] of fixture.peasant.start.steps.entries()) {
    const isLast = index === fixture.peasant.start.steps.length - 1;

    // The rail marks exactly one step current, and it is the one on show.
    await expect(rail.nth(index)).toHaveAttribute("aria-current", "step");
    await expect(wizard.locator('[aria-current="step"]')).toHaveCount(1);
    // A check means "you are past this", so the rail carries exactly one per step
    // behind the reader — and none at all while they are still on the first.
    await expect(wizard.locator(".swz-mark-check")).toHaveCount(index);
    await expect(body.locator(".swz-body-kicker")).toHaveText(`step ${index + 1}: ${expected.title}`);
    await expect(body.locator(`[data-start-step="${expected.id}"]`)).toHaveCount(1);

    // The shell sigil belongs to the terminal on /projects, not to step prose.
    const prose = expected.comment.replace(/^#\s*/, "");
    await expect(body.locator("[data-reading-text]")).toHaveText(prose);
    expect(prose).not.toMatch(/^#/);

    // Only the step in view carries a command: the wizard shows one at a time.
    await expect(wizard.locator(".cli-cmd")).toHaveCount(expected.command === null ? 0 : 1);
    if (expected.command !== null) {
      await expect(body.locator("code")).toHaveText(`$ ${expected.command}`);

      const copy = body.getByRole("button", { name: /^copy / });
      await copy.focus();
      await page.keyboard.press("Enter");
      await expect(body.getByRole("button", { name: /^copied / })).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected.command);
    }

    // Back is dead on the first step and live everywhere after it.
    if (index === 0) {
      await expect(back).toBeDisabled();
    } else {
      await expect(back).toBeEnabled();
    }
    // The last step closes the sequence rather than promising another one.
    await expect(forward).toHaveText(
      isLast ? fixture.peasant.start.doneLabel : fixture.peasant.start.continueLabel,
    );

    if (!isLast) {
      await forward.click();
    }
  }

  // Walking back re-opens a finished step rather than locking the reader forward,
  // and the check over it goes with it — a reader standing on a step is not past it.
  await back.click();
  await expect(body.locator(".swz-body-kicker")).toHaveText(
    `step ${fixture.peasant.start.steps.length - 1}: ${fixture.peasant.start.steps.at(-2)!.title}`,
  );
  await expect(wizard.locator(".swz-mark-check")).toHaveCount(
    fixture.peasant.start.steps.length - 2,
  );
  // Every marker is a jump target, forward as well as back. Nothing here is gated,
  // so a reader who wants step four says so rather than pressing continue three times.
  await expect(rail.last()).toBeEnabled();
  await rail.last().click();
  await expect(body.locator(".swz-body-kicker")).toHaveText(
    `step ${fixture.peasant.start.steps.length}: ${fixture.peasant.start.steps.at(-1)!.title}`,
  );
  await expect(wizard.locator(".swz-mark-check")).toHaveCount(
    fixture.peasant.start.steps.length - 1,
  );

  // A completed marker is a jump target, so the rail is navigable both ways.
  await rail.first().click();
  await expect(body.locator(".swz-body-kicker")).toHaveText(
    `step 1: ${fixture.peasant.start.steps[0].title}`,
  );
  // Back at the top of the sequence, nothing behind the reader is claimed as done.
  await expect(wizard.locator(".swz-mark-check")).toHaveCount(0);

  const expectedCommands = fixture.peasant.start.steps
    .map((step) => step.command)
    .filter((command): command is string => command !== null);

  // "copy all" sits above the wizard and yields the whole sequence, in order.
  const copyAll = start.locator("[data-copy-all]");
  await expect(copyAll).toHaveCount(1);
  await expect(copyAll).toHaveAttribute("aria-label", `copy ${fixture.peasant.start.copyAllLabel}`);
  const wizardBox = await wizard.boundingBox();
  const copyAllBox = await copyAll.boundingBox();
  expect(copyAllBox).not.toBeNull();
  // above the rail and flush with the wizard's right edge, not inside the body
  expect(copyAllBox!.y + copyAllBox!.height).toBeLessThanOrEqual(wizardBox!.y);
  expect(copyAllBox!.x + copyAllBox!.width).toBeCloseTo(wizardBox!.x + wizardBox!.width, 0);
  await copyAll.focus();
  await expect(copyAll).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(start.getByRole("button", { name: `copied ${fixture.peasant.start.copyAllLabel}` })).toBeVisible();
  // The page writes "\n"; the Windows clipboard hands back "\r\n". Compare line by line.
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard.split(/\r?\n/)).toEqual(expectedCommands);

  // The install block is plain copy: source citations live with the comparison.
  await expect(start.locator(".pj-citations")).toHaveCount(0);
});

test("the install line sits above the explanation and is copyable", async ({ page }) => {
  const response = await page.goto("/projects");
  const serverHtml = await response!.text();
  expect(serverHtml).toContain(fixture.install.command);

  const install = page.locator("[data-install]");
  await expect(install).toHaveCount(1);
  await expect(install.locator("code")).toHaveText(`$ ${fixture.install.command}`);
  // The command stands alone: no note under it, and nothing else in the section.
  await expect(install.locator(".pj-install-note")).toHaveCount(0);
  await expect(install.locator("p")).toHaveCount(0);

  // Order matters: a reader who has decided should not have to scroll past prose,
  // and the viewer comes after the case for the project rather than before it.
  const order = await page.evaluate(() => {
    const marks = [
      ["install", "[data-install]"],
      ["what", "[data-what]"],
      ["story", "[data-story]"],
      ["viewer", "[data-viewer]"],
      ["community", "[data-community]"],
      ["redaction", "[data-redaction]"],
      ["tools", "[data-tools]"],
      ["comparison", "[data-comparison]"],
      ["faq", "[data-faq]"],
    ] as const;
    return [...document.querySelectorAll(marks.map(([, selector]) => selector).join(", "))].map(
      (node) => marks.find(([, selector]) => node.matches(selector))![0],
    );
  });
  expect(order).toEqual([
    "install",
    "what",
    "story",
    "viewer",
    "community",
    "redaction",
    "tools",
    "comparison",
    "faq",
  ]);

  // The full sequence belongs to the peasant page; the catalog keeps the one line.
  await expect(page.locator("[data-start]")).toHaveCount(0);
  await expect(page.locator("section.swz")).toHaveCount(0);

  const copy = install.getByRole("button", { name: /^copy / });
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect(install.getByRole("button", { name: /^copied / })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    fixture.install.command,
  );
});

test("the advertised install command resolves to a readable script", async ({ request }) => {
  /*
   * The command is copy-pasteable from four places on this site, and the path in
   * it and the route that serves it can drift apart with nothing to show for it
   * — `curl -f` swallows a 404 and pipes nothing, so a broken installer looks
   * exactly like a silent success.
   */
  const advertised = fixture.install.command.match(/https:\/\/\S+/);
  expect(advertised, "the install command names no URL").not.toBeNull();
  const response = await request.get(new URL(advertised![0]).pathname);
  expect(response.status()).toBe(200);

  // Readable in a browser, not an opaque download: it is about to run as root's
  // equal on someone's machine, so it has to be inspectable first.
  expect(response.headers()["content-type"]).toContain("text/plain");

  const script = await response.text();
  expect(script).toContain("peasant-labs/peasant");

  /*
   * And nothing executes until the last byte lands. A script piped into a shell
   * runs whatever arrived, so the body is functions and the final line calls
   * one: a dropped connection then defines some functions and does nothing,
   * rather than half-installing.
   */
  expect(script.trimEnd().endsWith('main "$@"')).toBe(true);
});

test("the transcript viewer mounts the real component over demo data", async ({ page }) => {
  await page.goto("/projects");
  const viewer = page.locator("[data-viewer]");
  await expect(viewer.locator("#viewer-heading")).toHaveText(fixture.viewer.title);

  // Sample data must announce itself, so a reader never mistakes it for a record.
  await expect(viewer).toContainText(fixture.viewer.disclosure);

  const demo = viewer.locator("[data-transcript-demo]");
  await expect(demo).toHaveCount(1);
  await expect(demo).toHaveAttribute("aria-label", fixture.viewer.label);
  await expect(demo).toHaveAttribute("data-contained-overflow", "true");

  // The fairtrade composite itself, not a screenshot of it.
  const app = demo.locator(".txn-app");
  await expect(app).toHaveCount(1);
  await expect(demo.locator("img")).toHaveCount(0);
  await expect(app).toContainText(fixture.viewer.sessionId);

  // It follows the site theme rather than shipping its own.
  await expect(app).toHaveAttribute("data-theme", "dark");
  await page.locator("[data-theme-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(app).toHaveAttribute("data-theme", "light");

  // Read-only: every capability is off, so no mutating action is offered. Match
  // whole names — the transcript's own tool rows are labelled "Edit <path>".
  for (const name of ["edit", "contribute", "export", "change visibility", "label"]) {
    await expect(demo.getByRole("button", { name, exact: true })).toHaveCount(0);
  }

  // The transcript is real enough to have derived its own tabs and turns.
  await expect(demo.getByRole("tab")).not.toHaveCount(0);

  /*
   * It opens on its own summary rather than in the middle of the raw log —
   * fairtrade's own default is the trace. The tab is a controlled prop, so the
   * switch is exercised too: owning the state wrongly renders tabs that refuse
   * to move, which looks identical until you click one.
   */
  await expect(demo.getByRole("tab", { selected: true })).toContainText(
    fixture.viewer.openingTab,
  );
  const other = demo.getByRole("tab", { name: new RegExp(`^${fixture.viewer.otherTab}\\b`) });
  await other.click();
  await expect(other).toHaveAttribute("aria-selected", "true");
});

test("the walkthrough rail runs unbroken from the last step into the viewer", async ({
  page,
}) => {
  await page.goto("/projects");
  const rail = await page.evaluate(() => {
    const y = window.scrollY;
    const edges = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Rail geometry could not be measured: ${selector} is missing.`);
      }
      const rect = element.getBoundingClientRect();
      return { top: rect.top + y, bottom: rect.bottom + y, left: rect.left };
    };
    const painted = (selector: string, part: "::before" | "::after") => {
      const element = document.querySelector(selector)!;
      const style = getComputedStyle(element, part);
      return {
        content: style.content,
        background: style.backgroundColor,
        left: style.left,
        top: style.top,
        width: style.width,
        height: style.height,
        position: style.position,
      };
    };
    const marker = document
      .querySelector("[data-story-steps] .cli-step:last-child .cli-step-marker")!
      .getBoundingClientRect();

    return {
      story: edges("[data-story]"),
      viewer: edges("[data-viewer]"),
      heading: edges("[data-viewer] > .pj-section-heading"),
      demo: edges("[data-transcript-demo]"),
      marker: { top: marker.top + y, bottom: marker.bottom + y, centre: marker.left + marker.width / 2 },
      lastStepTop:
        document
          .querySelector("[data-story-steps] .cli-step:last-child")!
          .getBoundingClientRect().top + y,
      step: painted("[data-story-steps] .cli-step:last-child", "::before"),
      lead: painted("[data-viewer]", "::before"),
      tail: painted("[data-viewer] > .pj-section-heading", "::after"),
      viewerBorderTop: getComputedStyle(document.querySelector("[data-viewer]")!).borderTopWidth,
      clear: Number.parseFloat(
        getComputedStyle(document.querySelector(".pj-main")!).getPropertyValue(
          "--pj-title-clear",
        ),
      ),
    };
  });

  // Every run is actually painted, in one colour, on one vertical line.
  const runs = [rail.step, rail.lead, rail.tail];
  for (const run of runs) {
    expect(run.content).toBe('""');
    expect(run.position).toBe("absolute");
    expect(run.background).not.toBe("rgba(0, 0, 0, 0)");
  }
  expect(new Set(runs.map((run) => run.background)).size).toBe(1);
  expect(new Set(runs.map((run) => run.left)).size).toBe(1);
  expect(new Set(runs.map((run) => run.width)).size).toBe(1);

  // The line stands on the centre of the numbered markers it threads.
  const offset = Number.parseFloat(rail.step.left);
  expect(rail.story.left + offset).toBeCloseTo(rail.marker.centre, 0);

  /*
   * It leaves each marker at the marker's own edge rather than restarting some
   * way below it — never overlapping the number, and never more than half a
   * marker clear of it, which is the break fairtrade's own `--sp-7` start left.
   */
  const railStart = rail.lastStepTop + Number.parseFloat(rail.step.top);
  const markerHeight = rail.marker.bottom - rail.marker.top;
  expect(railStart).toBeGreaterThanOrEqual(rail.marker.bottom);
  expect(railStart).toBeLessThanOrEqual(rail.marker.bottom + markerHeight / 2);

  /*
   * The two runs bridge the question: out of the last step down to it, then out
   * from under it onto the panel.
   *
   * Each is measured at both ends. The ends away from the question have to meet
   * what the rail connects — the step above and the panel below — exactly, since
   * a short run there is a visible break in the line. The ends at the question
   * stop clear of it by `--pj-title-clear`, equally on both sides: that gap is
   * deliberate, and getting it by accident from a mis-sized run would look the
   * same on the page while meaning something quite different.
   */
  const leadStart = rail.viewer.top + Number.parseFloat(rail.lead.top);
  const leadEnd = leadStart + Number.parseFloat(rail.lead.height);
  const tailStart = rail.heading.top + Number.parseFloat(rail.tail.top);
  const tailEnd = tailStart + Number.parseFloat(rail.tail.height);

  expect(leadStart).toBeCloseTo(rail.story.bottom, 0);
  expect(tailEnd).toBeCloseTo(rail.demo.top, 0);
  expect(rail.heading.top - leadEnd).toBeCloseTo(rail.clear, 0);
  expect(tailStart - rail.heading.bottom).toBeCloseTo(rail.clear, 0);

  // The section rule is dropped: a divider across the run would cut it in two.
  expect(rail.viewerBorderTop).toBe("0px");
});

test("what-it-is answers in one paragraph and hands the cards to their own section", async ({
  page,
}) => {
  await page.goto("/projects");
  const what = page.locator("[data-what]");
  await expect(what.locator("h2")).toHaveText(fixture.catalog.whatTitle);
  // The cards moved out: this section is the sentence, not a choice between products.
  await expect(what.locator("[data-project-card]")).toHaveCount(0);

  const tools = page.locator("[data-tools]");
  /*
   * The heading is two authored lines. `toHaveText` normalises whitespace and
   * would pass on a heading that had lost its break, so the newline is asserted
   * against raw text, and the rule that renders it is asserted beside it.
   */
  const cardsHeading = tools.locator("h2");
  expect(await cardsHeading.evaluate((element) => element.textContent)).toBe(
    fixture.catalog.cardsTitle,
  );
  expect(fixture.catalog.cardsTitle.split("\n")).toHaveLength(2);
  expect(await cardsHeading.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe(
    "pre-line",
  );
  await expect(tools.locator("[data-project-card]")).toHaveCount(fixture.catalog.cards.length);
  for (const expected of fixture.catalog.cards) {
    const card = tools.locator(`[data-project-card="${expected.id}"]`);
    await expect(card.locator(".pj-card-kind")).toHaveText(expected.kind);
  }

  // The evidence apparatus is gone from this page entirely.
  await expect(page.locator(".pj-citations")).toHaveCount(0);
  await expect(page.locator("[data-comparison-sources]")).toHaveCount(0);
});

test("the redaction review runs the real component over labelled sample matches", async ({
  page,
}) => {
  await page.goto("/projects");
  const redaction = page.locator("[data-redaction]");
  await expect(redaction.locator("h2")).toHaveText(fixture.redaction.title);

  // Invented data must say so before a reader takes a number off the panel.
  await expect(redaction.locator(".pj-demo-note")).toHaveText(fixture.redaction.note);

  // The fairtrade composite itself, not a screenshot of it.
  const panel = redaction.locator("[data-redaction-demo] .rdx-review");
  await expect(panel).toHaveCount(1);
  await expect(redaction.locator("img")).toHaveCount(0);

  const matches = panel.locator(".rdx-list > li");
  await expect(matches).toHaveCount(fixture.redaction.matches.length);
  for (const [index, expected] of fixture.redaction.matches.entries()) {
    const match = matches.nth(index);
    await expect(match).toContainText(expected.category);
    // Both halves of the diff are shown: what was found and what replaces it.
    await expect(match).toContainText(expected.secret);
    await expect(match).toContainText(expected.after);
  }

  // The kept match is the honest case — it is counted, and the panel says so.
  const kept = fixture.redaction.matches.filter((match) => match.kept);
  await expect(panel.locator(".rdx-summary-kept")).toHaveCount(kept.length > 0 ? 1 : 0);
  if (kept.length > 0) {
    await expect(panel.locator(".rdx-summary-kept")).toContainText(String(kept.length));
  }

  // Standard is the only level that ships, so the panel states it rather than
  // offering a choice, and the withdrawn levels are gone from the accessibility
  // tree as well as the page.
  const level = panel.getByRole("button", { name: fixture.redaction.level, exact: true });
  await expect(level).toHaveCount(1);
  await expect(level).toHaveAttribute("aria-pressed", "true");
  for (const removed of fixture.redaction.removedLevels) {
    await expect(panel.getByRole("button", { name: removed, exact: true })).toHaveCount(0);
  }
  await expect(panel.locator(".rdx-seg-opt:visible")).toHaveCount(1);
});

test("the user story runs the getting-started sequence in the onboarding component", async ({ page }) => {
  await page.goto("/projects");
  const story = page.locator("[data-story]");
  await expect(story.locator("h2")).toHaveText(fixture.story.title);

  const steps = story.locator("[data-story-steps]");
  await expect(steps).toHaveCount(1);
  await expect(steps).toHaveAttribute("aria-label", fixture.story.stepsLabel);

  const items = steps.locator(".cli-step");
  await expect(items).toHaveCount(fixture.story.steps.length);
  for (const [index, expected] of fixture.story.steps.entries()) {
    const step = items.nth(index);
    // The marker numbers the sequence; the title and command are the authored pair.
    await expect(step.locator(".cli-step-marker")).toHaveText(String(index + 1));
    await expect(step.locator(".cli-step-title")).toHaveText(expected.title);
    await expect(step.locator("code")).toHaveText(`$ ${expected.command}`);
  }

  // Every step is copyable where a reader is already reading about it.
  await expect(steps.getByRole("button", { name: /^copy / })).toHaveCount(
    fixture.story.steps.length,
  );

  // The terminal panel and the screenshot placeholder it sat beside are gone.
  await expect(story.locator("[data-terminal]")).toHaveCount(0);
  await expect(story.locator("figure")).toHaveCount(0);

  // Step titles are authored lowercase, never coerced by the component's chrome CSS.
  const transforms = await items
    .locator(".cli-step-title")
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).textTransform));
  expect(transforms).toEqual(transforms.map(() => "none"));
});

test("the community section states its commitment and supporting points", async ({ page }) => {
  const response = await page.goto("/projects");
  const serverHtml = await response!.text();
  const community = page.locator("[data-community]");
  await expect(community.locator("h2")).toHaveText(fixture.community.title);
  const points = community.locator("[data-community-point]");
  await expect(points).toHaveCount(fixture.community.points.length);
  for (const [index, expected] of fixture.community.points.entries()) {
    await expect(points.nth(index)).toHaveText(expected);
    expect(serverHtml).toContain(expected);
  }
});

test("the FAQ is a keyboard-operable accordion carrying every fixture question", async ({ page }) => {
  const response = await page.goto("/projects");
  const serverHtml = await response!.text();
  const faq = page.locator("[data-faq]");
  await expect(faq.locator("h2")).toHaveText(fixture.faq.title);

  for (const expected of fixture.faq.questions) {
    // Questions are server-rendered, so they are findable without JavaScript.
    expect(serverHtml).toContain(expected.question);
  }

  const triggers = faq.getByRole("button");
  await expect(triggers).toHaveCount(fixture.faq.questions.length);
  for (const [index, expected] of fixture.faq.questions.entries()) {
    await expect(triggers.nth(index)).toHaveText(expected.question);
  }

  // Authored casing survives: the accordion chrome must not lowercase the copy.
  const transforms = await triggers.evaluateAll((elements) => [
    ...new Set(elements.map((element) => getComputedStyle(element).textTransform)),
  ]);
  expect(transforms).toEqual(["none"]);

  const first = triggers.first();
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  const panelId = await first.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  await expect(page.locator(`#${panelId}`)).toBeVisible();
});

test("the peasant page is a plain explainer with no evidence apparatus", async ({ page }) => {
  const response = await page.goto(fixture.peasant.route);
  expect(response?.status()).toBe(200);
  const serverHtml = await response!.text();

  await expect(page.locator("h1")).toHaveText(fixture.peasant.hero.title);

  // The sequence that gets a reader running now lives here, headed by its own id.
  const start = page.locator("#get-started[data-start]");
  await expect(start).toHaveCount(1);
  await expect(start.locator("h2")).toHaveText(fixture.peasant.start.title);
  expect(serverHtml).toContain(fixture.peasant.start.title);

  const uses = page.locator("[data-peasant-use]");
  expect(
    await uses.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-peasant-use"))),
  ).toEqual(fixture.peasant.uses.map((use) => use.id));
  for (const [index, expected] of fixture.peasant.uses.entries()) {
    await expect(uses.nth(index).locator("h3")).toHaveText(expected.title);
  }

  // The evidence apparatus and the comparison stay on /projects.
  await expect(page.locator(".pj-citations")).toHaveCount(0);
  await expect(page.locator("[data-evidence-disclosure]")).toHaveCount(0);
  await expect(page.locator("[data-comparison]")).toHaveCount(0);

  for (const link of fixture.peasant.related) {
    await expect(page.locator(`[data-related-link="${link.id}"]`)).toHaveAttribute("href", link.target);
  }
  await page.locator('[data-related-link="village"]').click();
  await expect(page).toHaveURL(/\/projects\/village$/);
  await expect(page.locator("h1")).toBeFocused();
});

test("the comparison is one balanced native table of marks and nothing else", async ({ page }) => {
  await page.goto("/projects#comparison");
  const comparison = page.locator("[data-comparison]");
  const table = comparison.locator("table.tbl");
  await expect(table).toHaveCount(1);
  await expect(comparison.locator("[data-bundle-definition]")).toHaveText(fixture.comparison.bundleDefinition);
  await expect(comparison).toContainText(fixture.comparison.intro);
  await expect(comparison).toContainText(fixture.comparison.meaningNote);

  // The review metadata and the sources disclosure are gone from the page.
  await expect(table.locator("caption")).toHaveCount(0);
  await expect(comparison.locator(".pj-comparison-meta")).toHaveCount(0);
  await expect(comparison.locator("details")).toHaveCount(0);
  await expect(comparison).not.toContainText(/reverify by/i);
  await expect(comparison).not.toContainText(/review owner/i);
  // Dropping the caption must not cost the table its accessible name.
  await expect(table).toHaveAttribute("aria-labelledby", "comparison-heading");

  await expect(table.locator('thead th[scope="col"]')).toHaveCount(3);
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(fixture.comparison.rows.length);

  const rows = table.locator("tbody tr[data-comparison-row]");
  expect(await rows.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-comparison-row")))).toEqual(
    fixture.comparison.rows.map((row) => row.id),
  );

  // The table itself stays a scannable mark grid: one labelled mark per side, no prose, no citations.
  for (const expected of fixture.comparison.rows) {
    const row = rows.filter({ has: page.locator(`[data-row-id="${expected.id}"]`) });
    await expect(row.locator('th[scope="row"]')).toHaveText(expected.capability);
    for (const [side, cellFixture] of [
      ["peasant-labs", expected.peasantLabs],
      ["entire", expected.entire],
    ] as const) {
      const cell = row.locator(`[data-comparison-side="${side}"]`);
      const mark = cell.locator("[data-status]");
      await expect(mark).toHaveAttribute("data-status", cellFixture.status);
      await expect(mark).toContainText(cellFixture.status.replace("-", " "));
      await expect(mark).toContainText(COMPARISON_MARKS[cellFixture.status]);
      expect(await evidenceIds(cell)).toEqual([]);
    }
  }

  const overflow = comparison.locator("[data-table-scroll]");
  await expect(overflow).toHaveAttribute("role", "region");
  await expect(overflow).toHaveAttribute("tabindex", "0");
  await expect(overflow).toHaveAttribute("aria-label", /comparison/i);
  await overflow.focus();
  await expect(overflow).toBeFocused();
  await expect(comparison).not.toContainText(/\b(score|total|winner|staircase)\b/i);
  const notDocumentedLabels = await comparison
    .locator('[data-status="not-documented"]')
    .allTextContents();
  expect(notDocumentedLabels).not.toHaveLength(0);
  for (const label of notDocumentedLabels) {
    expect(label).not.toMatch(/[xX\u00d7\u2715]/);
  }
});

test("homepage compatibility keeps its authored content and project discovery", async ({ page }) => {
  const home = fixture.site.routes.find((route) => route.id === "home");
  expect(home).toBeDefined();
  await page.goto("/");
  await expect(page.locator('img[alt*="peasants tending and harvesting wheat"]')).toBeVisible();
  await expect(page.locator("h1")).toHaveText(home!.h1);
  await expect(page.locator("details")).toHaveAttribute("open", "");
  await expect(page.locator("article")).toBeVisible();
  await expect(page.locator("form")).toBeVisible();
  await expect(page.getByRole("link", { name: /projects/i })).toHaveAttribute("href", "/projects");
  expect(await page.locator("h1").evaluate((heading) => getComputedStyle(heading).textTransform)).toBe(
    "none",
  );
  const email = page.getByLabel("email *");
  const submit = page.getByRole("button", { name: "notify me" });
  await expect(submit).toBeDisabled();
  await email.fill("not-an-email");
  await expect(submit).toBeDisabled();
  await email.fill("reader@example.com");
  await expect(submit).toBeEnabled();
  await expectMetadata(page, home!.metadata);
});

test("skip navigation, route focus, theme persistence, and command copy work by keyboard", async ({ page }) => {
  await page.goto("/projects");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "skip to content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#content")).toBeFocused();

  const themeToggle = page.locator("[data-theme-toggle]");
  await themeToggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => window.localStorage.getItem("peasant-labs-theme"))).toBe("light");

  await page.locator('[data-project-card="peasant"]').click();
  await expect(page).toHaveURL(new RegExp(`${fixture.peasant.route}$`));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("h1")).toBeFocused();

  // The wizard opens on the first step, so its command is the one in view.
  const firstCommand = fixture.peasant.start.steps.find((step) => step.command !== null);
  expect(firstCommand).toBeDefined();
  expect(fixture.peasant.start.steps.indexOf(firstCommand!)).toBe(0);
  const command = page.locator("section.swz .swz-body .cli-cmd");
  const copy = command.getByRole("button", { name: /^copy / });
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect(command.getByRole("button", { name: /^copied / })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(firstCommand!.command);
});

test("Atkinson fonts and canonical fairtrade component styles mount from real production resources", async ({ page }) => {
  const fontResponses: string[] = [];
  page.on("response", (response) => {
    if (new URL(response.url()).hostname === "fonts.gstatic.com" && response.ok()) {
      fontResponses.push(response.url());
    }
  });
  await page.goto("/projects");
  await page.waitForLoadState("networkidle");
  await expect(
    page.locator('link[rel="stylesheet"][href^="https://fonts.googleapis.com/css2?family=Atkinson"]'),
  ).toHaveCount(1);
  await expect(page.locator('link[href*="fonts.css"]')).toHaveCount(0);
  await expect.poll(() => fontResponses.length, { message: "Atkinson font files were not requested successfully" }).toBeGreaterThan(0);
  await expect.poll(() =>
    page.evaluate(async () => {
      await document.fonts.ready;
      return {
        body: document.fonts.check('16px "Atkinson Hyperlegible"'),
        mono: document.fonts.check('14px "Atkinson Hyperlegible Mono"'),
      };
    }),
  ).toEqual({ body: true, mono: true });

  const computed = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>("[data-project-card]");
    // The catalog dropped its breadcrumb for the header nav, which wears the
    // same fairtrade mono chrome — so the nav is what this probe measures now.
    const chrome = document.querySelector<HTMLElement>(".pj-nav .iu-subnav-item");
    const button = document.querySelector<HTMLElement>(".btn");
    const prose = document.querySelector<HTMLElement>("[data-reading-text]");
    if (!card || !chrome || !button || !prose) {
      throw new Error("Mounted fairtrade style probe could not find card, nav, button, and prose targets.");
    }
    const root = getComputedStyle(document.documentElement);
    const cardStyle = getComputedStyle(card);
    const proseStyle = getComputedStyle(prose);
    return {
      amber: root.getPropertyValue("--amber").trim(),
      canvas: root.getPropertyValue("--canvas").trim(),
      cardRadius: cardStyle.borderRadius,
      cardBackground: cardStyle.backgroundColor,
      proseFamily: proseStyle.fontFamily,
      proseSize: proseStyle.fontSize,
      proseLineHeight: proseStyle.lineHeight,
      chromeFamily: getComputedStyle(chrome).fontFamily,
      buttonHeight: button.getBoundingClientRect().height,
    };
  });
  expect(computed.amber).not.toBe("");
  expect(computed.canvas).not.toBe("");
  expect(computed.cardRadius).toBe("0px");
  expect(computed.cardBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(computed.proseFamily).toContain("Atkinson Hyperlegible");
  expect(computed.proseFamily).not.toContain("Mono");
  expect(computed.proseSize).toBe("16px");
  expect(Number.parseFloat(computed.proseLineHeight)).toBeGreaterThanOrEqual(24);
  expect(computed.chromeFamily).toContain("Atkinson Hyperlegible Mono");
  expect(computed.buttonHeight).toBeGreaterThanOrEqual(28);

  await page.goto("/projects/peasant");
  const commandStyle = await page.locator(".cli-cmd").first().evaluate((command) => {
    const style = getComputedStyle(command);
    return {
      borderRadius: style.borderRadius,
      fontFamily: getComputedStyle(command.querySelector("code")!).fontFamily,
    };
  });
  expect(commandStyle.borderRadius).toBe("0px");
  expect(commandStyle.fontFamily).toContain("Atkinson Hyperlegible Mono");
});

for (const viewport of fixture.viewports) {
  test(`${viewport.id} is accessible, themed, motion-safe, and owns horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await chooseTheme(page, viewport.theme);
    if (viewport.reflowEquivalent !== null) {
      expect(viewport.reflowEquivalent.browserZoomEmulated).toBe(false);
      expect(
        viewport.reflowEquivalent.sourceCssWidth /
          (viewport.reflowEquivalent.zoomPercent / 100),
        `${viewport.id} represents CSS-pixel reflow equivalence without emulating browser zoom`,
      ).toBe(viewport.width);
    }
    for (const route of fixture.site.routes) {
      await page.goto(route.path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", viewport.theme);
      const accessibility = await new AxeBuilder({ page }).analyze();
      expect(accessibility.violations, `${route.path} at ${viewport.id}`).toEqual([]);
      const expectedFigure = heroFigureForRoute(route);
      if (expectedFigure) {
        await expectHeroFigure(page, expectedFigure);
      }
      if (viewport.width === 320) {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          ),
          `${route.path} has page-level overflow at ${viewport.id}`,
        ).toBe(false);
      }

      // A narrow wizard rail drops its step names to numbers rather than letting
      // five of them collide. The names stay in the accessible layer regardless.
      if (route.path === fixture.peasant.route) {
        const rail = await page.evaluate(() => {
          const marks = [...document.querySelectorAll<HTMLElement>("nav.swz-rail .swz-step")];
          const boxes = marks.map((mark) => mark.getBoundingClientRect());
          return {
            names: marks.map((mark) => (mark.textContent ?? "").trim()),
            overlapping: boxes.some((box, index) =>
              boxes.slice(index + 1).some((other) => box.right > other.left + 1 && box.left < other.right - 1),
            ),
          };
        });
        expect(rail.names, `${route.path} rail names at ${viewport.id}`).toEqual(
          fixture.peasant.start.steps.map((step, index) => `${index + 1}${step.title}`),
        );
        expect(rail.overlapping, `${route.path} rail names collide at ${viewport.id}`).toBe(false);
      }
    }

    await page.goto("/projects");

    const stickyContext = await page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>("[data-table-scroll]");
      const corner = document.querySelector<HTMLElement>(
        ".pj-comparison-table thead .tbl-th:first-child",
      );
      const header = document.querySelector<HTMLElement>(
        ".pj-comparison-table thead .tbl-th:nth-child(2)",
      );
      const capability = document.querySelector<HTMLElement>(
        ".pj-comparison-table tbody .pj-capability",
      );
      if (!wrapper || !corner || !header || !capability) {
        throw new Error(
          "Comparison sticky-style probe could not find the scroll region, headers, and first capability cell.",
        );
      }
      wrapper.scrollLeft = wrapper.scrollWidth;
      const wrapperRect = wrapper.getBoundingClientRect();
      const capabilityRect = capability.getBoundingClientRect();
      const style = (element: HTMLElement) => {
        const computed = getComputedStyle(element);
        return {
          position: computed.position,
          background: computed.backgroundColor,
          zIndex: Number(computed.zIndex),
        };
      };
      return {
        corner: style(corner),
        header: style(header),
        capability: style(capability),
        capabilityWidth: capabilityRect.width,
        capabilityPinned:
          Math.abs(capabilityRect.left - wrapperRect.left) <= 1 &&
          capabilityRect.right <= wrapperRect.right,
      };
    });
    expect(stickyContext.corner.position).toBe("sticky");
    expect(stickyContext.header.position).toBe("sticky");
    expect(stickyContext.capability.position).toBe("sticky");
    for (const background of [
      stickyContext.corner.background,
      stickyContext.header.background,
      stickyContext.capability.background,
    ]) {
      expect(background).not.toBe("rgba(0, 0, 0, 0)");
      expect(background).not.toBe("transparent");
    }
    expect(stickyContext.corner.zIndex).toBeGreaterThan(stickyContext.header.zIndex);
    expect(stickyContext.header.zIndex).toBeGreaterThan(stickyContext.capability.zIndex);
    expect(stickyContext.capabilityPinned).toBe(true);
    if (viewport.width === 320) {
      expect(stickyContext.capabilityWidth).toBeLessThanOrEqual(viewport.width / 2);
    }

    const motion = await page.locator("[data-project-card]").first().evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        animationDuration: style.animationDuration,
        transitionDuration: style.transitionDuration,
      };
    });
    expect(Number.parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.01);
    expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.01);

    if (viewport.width === 320) {
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        const unowned = [...document.querySelectorAll<HTMLElement>("body *")]
          .filter((element) => element.scrollWidth > element.clientWidth + 1)
          .filter((element) => !element.closest("[data-contained-overflow]"))
          // Visually-hidden text is clipped to a 1px box by design — the sr-only
          // pattern always measures as overflowing, and a box that narrow cannot
          // push anything sideways. This guard is about visible content escaping.
          .filter((element) => element.clientWidth > 1)
          .map((element) => element.tagName.toLowerCase() + "." + element.className);
        return {
          page: root.scrollWidth > root.clientWidth + 1,
          unowned,
        };
      });
      expect(overflow.page).toBe(false);
      expect(overflow.unowned).toEqual([]);
      const tableOverflow = await page.locator("[data-table-scroll]").evaluate((element) => ({
        contained: element.scrollWidth > element.clientWidth,
        labelled:
          element.getAttribute("role") === "region" && Boolean(element.getAttribute("aria-label")),
      }));
      expect(tableOverflow).toEqual({ contained: true, labelled: true });

      for (const route of [fixture.peasant.route, fixture.village.route]) {
        await page.goto(route);
        const detailOverflow = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        }));
        expect(detailOverflow.page, `${route} overflows at 320`).toBe(false);
      }
    }
  });
}

test("the bounded expected-value mismatch proves the mounted assertion has teeth", async ({ page }) => {
  await page.goto(fixture.invalidCase.route);
  const target = page.locator(fixture.invalidCase.selector).first();
  const actual = (await target.count()) > 0 ? ((await target.textContent()) ?? "") : "";
  let assertionFailure: unknown;
  try {
    expect(actual).toContain(fixture.invalidCase.expectedFirstText);
  } catch (error) {
    assertionFailure = error;
  }
  expect(assertionFailure).toBeInstanceOf(Error);
});
