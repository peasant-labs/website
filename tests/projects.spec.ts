import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDocument } from "yaml";

const FIXTURE_PATH = resolve("testdata/projects/projects.yaml");
const COMPARISON_STATUSES = [
  "supported",
  "partial",
  "not-documented",
  "not-in-current-scope",
] as const;
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
const COMPARISON_GROUPS = [
  "shared-baseline",
  "retrieval-and-continuation",
  "sharing-and-governance",
  "infrastructure-and-maturity",
] as const;
const THEMES = ["dark", "light"] as const;
const PROJECT_IDS = ["peasant", "village"] as const;

type ComparisonStatus = (typeof COMPARISON_STATUSES)[number];
type AdvertisedState = (typeof ADVERTISED_STATES)[number];
type SourceScope = (typeof SOURCE_SCOPES)[number];
type ComparisonGroup = (typeof COMPARISON_GROUPS)[number];
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

type ProductFixture = {
  id: ProjectId;
  route: string;
  advertisedState: AdvertisedState;
  availabilityTitle: string;
  availabilityQualification: string;
  evidenceSummary: string;
  figure: HeroFigureFixture;
  features: Array<EvidenceRefFixture & { heading: string }>;
  access: InstructionFixture[];
  run: InstructionFixture[];
  stories: EvidenceRefFixture[];
  outputs: Array<EvidenceRefFixture & { lines: string[] }>;
  related: Array<{ id: string; target: string }>;
  requiredEvidence: string[];
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
  sourceScope: SourceScope;
  qualification: string;
  sources: string[];
};

type ComparisonRowFixture = {
  id: string;
  group: ComparisonGroup;
  peasantLabs: ComparisonCellFixture;
  entire: ComparisonCellFixture;
  takeaway: string;
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
    storyTitle: string;
    figure: HeroFigureFixture;
    cards: Array<{
      id: ProjectId;
      label: string;
      target: string;
      action: string;
    }>;
  };
  products: ProductFixture[];
  evidence: EvidenceFixture[];
  comparison: {
    title: string;
    scrollHelp: string;
    caption: string;
    bundleDefinition: string;
    verifiedOn: string;
    reverifyBy: string;
    reviewOwner: string;
    meaningNote: string;
    groups: ComparisonGroup[];
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

function parseProduct(value: unknown, location: string): ProductFixture {
  const object = exactObject(value, location, [
    "id",
    "route",
    "advertisedState",
    "availabilityTitle",
    "availabilityQualification",
    "evidenceSummary",
    "figure",
    "features",
    "access",
    "run",
    "stories",
    "outputs",
    "related",
    "requiredEvidence",
  ]);
  const features = nonEmptyArray(object.features, `${location}.features`).map((item, index) => {
    const feature = exactObject(item, `${location}.features[${index}]`, [
      "id",
      "heading",
      "evidence",
    ]);
    return {
      id: nonEmptyString(feature.id, `${location}.features[${index}].id`),
      heading: nonEmptyString(feature.heading, `${location}.features[${index}].heading`),
      evidence: stringArray(feature.evidence, `${location}.features[${index}].evidence`),
    };
  });
  if (features.length !== 5) {
    fixtureError(`${location}.features`, `expected exactly five features, found ${features.length}`, "restore the reviewed five-feature set");
  }

  const access = nonEmptyArray(object.access, `${location}.access`).map((item, index) =>
    parseInstruction(item, `${location}.access[${index}]`),
  );
  const run = nonEmptyArray(object.run, `${location}.run`).map((item, index) =>
    parseInstruction(item, `${location}.run[${index}]`),
  );
  const stories = nonEmptyArray(object.stories, `${location}.stories`).map((item, index) =>
    parseEvidenceRef(item, `${location}.stories[${index}]`),
  );
  const outputs = nonEmptyArray(object.outputs, `${location}.outputs`).map((item, index) => {
    const output = exactObject(item, `${location}.outputs[${index}]`, ["id", "evidence", "lines"]);
    return {
      id: nonEmptyString(output.id, `${location}.outputs[${index}].id`),
      evidence: stringArray(output.evidence, `${location}.outputs[${index}].evidence`),
      lines: stringArray(output.lines, `${location}.outputs[${index}].lines`),
    };
  });
  const related = nonEmptyArray(object.related, `${location}.related`).map((item, index) => {
    const link = exactObject(item, `${location}.related[${index}]`, ["id", "target"]);
    const target = nonEmptyString(link.target, `${location}.related[${index}].target`);
    if (target.startsWith("http")) {
      httpsUrl(target, `${location}.related[${index}].target`);
    } else {
      internalPath(target, `${location}.related[${index}].target`);
    }
    return {
      id: nonEmptyString(link.id, `${location}.related[${index}].id`),
      target,
    };
  });

  uniqueBy(features, (item) => item.id, `${location}.features`);
  uniqueBy(access, (item) => item.id, `${location}.access`);
  uniqueBy(run, (item) => item.id, `${location}.run`);
  uniqueBy(stories, (item) => item.id, `${location}.stories`);
  uniqueBy(outputs, (item) => item.id, `${location}.outputs`);
  uniqueBy(related, (item) => item.id, `${location}.related`);

  return {
    id: enumValue(object.id, PROJECT_IDS, `${location}.id`),
    route: internalPath(nonEmptyString(object.route, `${location}.route`), `${location}.route`),
    advertisedState: enumValue(
      object.advertisedState,
      ADVERTISED_STATES,
      `${location}.advertisedState`,
    ),
    availabilityTitle: nonEmptyString(object.availabilityTitle, `${location}.availabilityTitle`),
    availabilityQualification: nonEmptyString(
      object.availabilityQualification,
      `${location}.availabilityQualification`,
    ),
    evidenceSummary: nonEmptyString(object.evidenceSummary, `${location}.evidenceSummary`),
    figure: parseHeroFigure(object.figure, `${location}.figure`),
    features,
    access,
    run,
    stories,
    outputs,
    related,
    requiredEvidence: stringArray(object.requiredEvidence, `${location}.requiredEvidence`),
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
  const object = exactObject(value, location, [
    "status",
    "sourceScope",
    "qualification",
    "sources",
  ]);
  const status = enumValue(object.status, COMPARISON_STATUSES, `${location}.status`);
  const sourceScope = enumValue(object.sourceScope, SOURCE_SCOPES, `${location}.sourceScope`);
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
      "not-documented lacks the declared Peasant current-source corpus",
      "cite the dated Peasant corpus evidence ID",
    );
  }
  if (status === "not-in-current-scope" && !sources.includes("bundle-definition")) {
    fixtureError(location, "not-in-current-scope lacks bundle reasoning", "cite bundle-definition");
  }
  return { status, sourceScope, qualification, sources };
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
    "products",
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

  const catalogObject = exactObject(root.catalog, "catalog", ["storyTitle", "figure", "cards"]);
  const cards = nonEmptyArray(catalogObject.cards, "catalog.cards").map((item, index) => {
    const card = exactObject(item, `catalog.cards[${index}]`, ["id", "label", "target", "action"]);
    return {
      id: enumValue(card.id, PROJECT_IDS, `catalog.cards[${index}].id`),
      label: nonEmptyString(card.label, `catalog.cards[${index}].label`),
      target: internalPath(nonEmptyString(card.target, `catalog.cards[${index}].target`), `catalog.cards[${index}].target`),
      action: nonEmptyString(card.action, `catalog.cards[${index}].action`),
    };
  });
  if (cards.length !== 2 || cards.some((card, index) => card.id !== PROJECT_IDS[index])) {
    fixtureError("catalog.cards", "cards must be exactly Peasant then Village", "restore the two-card order");
  }
  uniqueBy(cards, (card) => card.id, "catalog.cards.id");

  const products = nonEmptyArray(root.products, "products").map((item, index) =>
    parseProduct(item, `products[${index}]`),
  );
  if (products.length !== 2 || products.some((product, index) => product.id !== PROJECT_IDS[index])) {
    fixtureError("products", "products must be exactly Peasant then Village", "restore the two-product order");
  }
  uniqueBy(products, (product) => product.id, "products.id");
  uniqueBy(products, (product) => product.route, "products.route");
  for (const [index, product] of products.entries()) {
    if (product.route !== cards[index].target) {
      fixtureError(`products[${index}].route`, "product route differs from its catalog target", "use one exact route per product");
    }
  }

  const evidence = nonEmptyArray(root.evidence, "evidence").map((item, index) =>
    parseEvidence(item, `evidence[${index}]`),
  );
  uniqueBy(evidence, (item) => item.id, "evidence.id");
  const evidenceIds = new Set(evidence.map((item) => item.id));

  const comparisonObject = exactObject(root.comparison, "comparison", [
    "title",
    "scrollHelp",
    "caption",
    "bundleDefinition",
    "verifiedOn",
    "reverifyBy",
    "reviewOwner",
    "meaningNote",
    "groups",
    "rows",
  ]);
  const comparisonVerifiedOn = checkedDate(comparisonObject.verifiedOn, "comparison.verifiedOn");
  const comparisonReverifyBy = checkedDate(comparisonObject.reverifyBy, "comparison.reverifyBy");
  checkReviewWindow(comparisonVerifiedOn, comparisonReverifyBy, "comparison");
  const groups = stringArray(comparisonObject.groups, "comparison.groups").map((group, index) =>
    enumValue(group, COMPARISON_GROUPS, `comparison.groups[${index}]`),
  );
  if (JSON.stringify(groups) !== JSON.stringify(COMPARISON_GROUPS)) {
    fixtureError("comparison.groups", "comparison group order drifted", "restore the four workflow groups in canonical order");
  }
  const rows = nonEmptyArray(comparisonObject.rows, "comparison.rows").map((item, index) => {
    const row = exactObject(item, `comparison.rows[${index}]`, [
      "id",
      "group",
      "peasantLabs",
      "entire",
      "takeaway",
    ]);
    return {
      id: nonEmptyString(row.id, `comparison.rows[${index}].id`),
      group: enumValue(row.group, COMPARISON_GROUPS, `comparison.rows[${index}].group`),
      peasantLabs: parseComparisonCell(row.peasantLabs, `comparison.rows[${index}].peasantLabs`),
      entire: parseComparisonCell(row.entire, `comparison.rows[${index}].entire`),
      takeaway: nonEmptyString(row.takeaway, `comparison.rows[${index}].takeaway`),
    };
  });
  if (rows.length !== 14) {
    fixtureError("comparison.rows", `expected fourteen rows, found ${rows.length}`, "restore the balanced row inventory");
  }
  uniqueBy(rows, (row) => row.id, "comparison.rows.id");
  if (!rows.some((row) => row.group === "shared-baseline" && row.peasantLabs.status === "supported" && row.entire.status === "supported")) {
    fixtureError("comparison.rows", "shared baseline is missing", "retain at least one supported overlap row");
  }
  if (!rows.some((row) => row.takeaway.toLowerCase().includes("entire") && (row.entire.status === "supported" || row.entire.status === "partial"))) {
    fixtureError("comparison.rows", "Entire advantage is missing", "retain a sourced Entire advantage row");
  }

  const referencedEvidence: Array<{ location: string; ids: string[] }> = [];
  for (const item of evidence) {
    referencedEvidence.push({ location: `evidence.${item.id}.sourceIds`, ids: item.sourceIds });
  }
  for (const product of products) {
    referencedEvidence.push({ location: `products.${product.id}.requiredEvidence`, ids: product.requiredEvidence });
    for (const collection of [product.features, product.access, product.run, product.stories, product.outputs]) {
      for (const item of collection) {
        referencedEvidence.push({ location: `products.${product.id}.${item.id}.evidence`, ids: item.evidence });
      }
    }
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
      storyTitle: nonEmptyString(catalogObject.storyTitle, "catalog.storyTitle"),
      figure: parseHeroFigure(catalogObject.figure, "catalog.figure"),
      cards,
    },
    products,
    evidence,
    comparison: {
      title: nonEmptyString(comparisonObject.title, "comparison.title"),
      scrollHelp: nonEmptyString(comparisonObject.scrollHelp, "comparison.scrollHelp"),
      caption: nonEmptyString(comparisonObject.caption, "comparison.caption"),
      bundleDefinition: nonEmptyString(comparisonObject.bundleDefinition, "comparison.bundleDefinition"),
      verifiedOn: comparisonVerifiedOn,
      reverifyBy: comparisonReverifyBy,
      reviewOwner: nonEmptyString(comparisonObject.reviewOwner, "comparison.reviewOwner"),
      meaningNote: nonEmptyString(comparisonObject.meaningNote, "comparison.meaningNote"),
      groups,
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
const productById = new Map(fixture.products.map((product) => [product.id, product]));
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

function heroFigureForRoute(route: RouteFixture): HeroFigureFixture | null {
  if (route.id === "projects") {
    return fixture.catalog.figure;
  }
  return fixture.products.find((product) => product.route === route.path)?.figure ?? null;
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
    const excluded = ".pj-citations, .pj-evidence-ledger, code, pre";
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
  expect(fixture.products.map((product) => product.features.length)).toEqual([5, 5]);
  expect(fixture.comparison.rows).toHaveLength(14);
  expect(new Set(fixture.comparison.rows.flatMap((row) => [row.peasantLabs.status, row.entire.status]))).toEqual(
    new Set(COMPARISON_STATUSES),
  );
});

test("project copy is authored lowercase without corrupting preserved literals", async ({ page }) => {
  const projectRoutes = fixture.site.routes.filter((route) => heroFigureForRoute(route) !== null);
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
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).textTransform));
    expect(textTransforms, `${route.path} must use authored casing rather than CSS coercion`).toEqual(
      textTransforms.map(() => "none"),
    );
  }
  expect(violations).toEqual([]);
  expect(uppercaseSentenceOpenings(fixture.catalog.figure.accessibleName)).toEqual([]);
  for (const product of fixture.products) {
    expect(uppercaseSentenceOpenings(product.figure.accessibleName)).toEqual([]);
  }
});

for (const route of fixture.site.routes) {
  test(`${route.path} returns exact server-rendered content and metadata`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    const serverHtml = await response!.text();
    expect(serverHtml).toContain(route.h1);
    const product = fixture.products.find((candidate) => candidate.route === route.path);
    for (const feature of product?.features ?? []) {
      expect(serverHtml).toContain(feature.heading);
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

for (const product of fixture.products) {
  test(`${product.id} renders exact features, instructions, stories, output, and evidence`, async ({ page }) => {
    const response = await page.goto(product.route);
    const serverHtml = await response!.text();
    const availability = page.locator("[data-availability]");
    await expect(availability).toHaveAttribute("data-advertised-state", product.advertisedState);
    await expect(availability).toContainText(product.availabilityTitle);
    await expect(availability).toContainText(product.availabilityQualification);

    const features = page.locator("[data-project-feature]");
    await expect(features).toHaveCount(5);
    expect(await features.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-project-feature")))).toEqual(
      product.features.map((feature) => feature.id),
    );
    for (const [index, expected] of product.features.entries()) {
      await expect(features.nth(index).locator("h3")).toHaveText(expected.heading);
      expect(await evidenceIds(features.nth(index))).toEqual(expected.evidence);
    }

    for (const [kind, instructions] of [
      ["access", product.access],
      ["run", product.run],
    ] as const) {
      await expect(page.locator(`[data-instruction-kind="${kind}"]`)).toHaveCount(
        instructions.length,
      );
      for (const instruction of instructions) {
        const item = page.locator(
          `[data-instruction-kind="${kind}"][data-instruction-id="${instruction.id}"]`,
        );
        await expect(item.locator("[data-reading-text]")).toHaveText(instruction.body);
        await expect(item.locator("[data-qualification]")).toHaveText(instruction.qualification);
        expect(await evidenceIds(item)).toEqual(instruction.evidence);
        if (instruction.command === null) {
          await expect(item.locator("code")).toHaveCount(0);
        } else {
          await expect(item.locator("code")).toContainText(instruction.command);
        }
        const action = item.locator("[data-instruction-action]");
        if (instruction.action === null) {
          await expect(action).toHaveCount(0);
        } else {
          await expect(action).toHaveAttribute("href", instruction.action.target);
          await expect(action).toHaveAttribute("target", "_blank");
          await expect(action).toHaveAttribute("rel", "noopener noreferrer");
          await expect(action).toHaveAttribute("aria-label", instruction.action.accessibleName);
          await expect(action).toHaveText(instruction.action.label);
          await expect(action).toHaveClass(/\bbtn-primary\b/);
          await action.focus();
          await expect(action).toBeFocused();
          expect(serverHtml).toContain(instruction.action.target);
        }
      }
    }
    const expectedCommands = [...product.access, ...product.run]
      .map((instruction) => instruction.command)
      .filter((command): command is string => command !== null)
      .map((command) => `$ ${command}`);
    expect(
      await page.locator("[data-instruction-kind] code").allTextContents(),
    ).toEqual(expectedCommands);

    const stories = page.locator("[data-project-story]");
    expect(await stories.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-project-story")))).toEqual(
      product.stories.map((story) => story.id),
    );
    for (const [index, story] of product.stories.entries()) {
      expect(await evidenceIds(stories.nth(index))).toEqual(story.evidence);
    }

    const outputs = page.locator("[data-project-output]");
    expect(await outputs.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-project-output")))).toEqual(
      product.outputs.map((output) => output.id),
    );
    for (const [index, output] of product.outputs.entries()) {
      await expect(outputs.nth(index).locator("code")).toHaveText(output.lines.join("\n"));
      expect(await evidenceIds(outputs.nth(index))).toEqual(output.evidence);
    }

    const disclosure = page.locator("details[data-evidence-disclosure]");
    const summary = disclosure.locator("summary[data-evidence-summary]");
    await expect(disclosure).toHaveCount(1);
    await expect(summary).toHaveText(product.evidenceSummary);
    expect(await disclosure.evaluate((element) => element.hasAttribute("open"))).toBe(false);
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await disclosure.evaluate((element) => element.hasAttribute("open"))).toBe(true);
    await page.keyboard.press("Enter");
    expect(await disclosure.evaluate((element) => element.hasAttribute("open"))).toBe(false);
    await page.keyboard.press("Space");
    expect(await disclosure.evaluate((element) => element.hasAttribute("open"))).toBe(true);
    await expect(disclosure.locator("[data-project-evidence]")).toBeVisible();

    const pageEvidence = new Set(
      await page.locator("[data-project-evidence] [data-evidence-id]").evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("data-evidence-id")),
      ),
    );
    for (const evidenceId of product.requiredEvidence) {
      expect(pageEvidence.has(evidenceId), `missing ${evidenceId} on ${product.route}`).toBe(true);
      const expectedEvidence = evidenceById.get(evidenceId);
      expect(expectedEvidence).toBeDefined();
      expect(serverHtml).toContain(expectedEvidence!.id);
      await expectEvidenceReference(
        page.locator(`[data-project-evidence] [data-evidence-id="${evidenceId}"]`),
        expectedEvidence!,
        true,
      );
    }

    for (const link of product.related) {
      await expect(page.locator(`[data-related-link="${link.id}"]`)).toHaveAttribute("href", link.target);
    }
    await expect(
      page.locator('[data-access] a[href^="http"]:not([data-instruction-action])'),
    ).toHaveCount(0);
    const sibling = product.related.find((link) => link.id === "peasant" || link.id === "village");
    expect(sibling).toBeDefined();
    await page.locator(`[data-related-link="${sibling!.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${sibling!.target}$`));
    await expect(page.locator("h1")).toBeFocused();
  });
}

test("the comparison is one balanced native table with exact statuses and citations", async ({ page }) => {
  await page.goto("/projects#comparison");
  const comparison = page.locator("[data-comparison]");
  const table = comparison.locator("table.tbl");
  await expect(table).toHaveCount(1);
  await expect(table.locator("caption")).toHaveText(fixture.comparison.caption);
  await expect(comparison.locator("[data-bundle-definition]")).toHaveText(fixture.comparison.bundleDefinition);
  await expect(comparison).toContainText(`verified ${fixture.comparison.verifiedOn}`);
  await expect(comparison).toContainText(`reverify by ${fixture.comparison.reverifyBy}`);
  await expect(comparison).toContainText(fixture.comparison.reviewOwner);
  await expect(comparison).toContainText(fixture.comparison.meaningNote);
  await expect(table.locator('thead th[scope="col"]')).toHaveCount(4);
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(14);

  const rows = table.locator("tbody tr[data-comparison-row]");
  expect(await rows.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-comparison-row")))).toEqual(
    fixture.comparison.rows.map((row) => row.id),
  );
  for (const expected of fixture.comparison.rows) {
    const row = rows.filter({ has: page.locator(`[data-row-id="${expected.id}"]`) });
    for (const [side, cellFixture] of [
      ["peasant-labs", expected.peasantLabs],
      ["entire", expected.entire],
    ] as const) {
        const cell = row.locator(`[data-comparison-side="${side}"]`);
      await expect(cell).toHaveAttribute("data-source-scope", cellFixture.sourceScope);
      await expect(cell.locator("[data-status]")).toHaveText(cellFixture.status);
      expect(await evidenceIds(cell)).toEqual(cellFixture.sources);
      await expect(cell.locator("[data-qualification]")).toHaveText(cellFixture.qualification);
      for (const evidenceId of cellFixture.sources) {
        const expectedEvidence = evidenceById.get(evidenceId);
        expect(expectedEvidence).toBeDefined();
        await expectEvidenceReference(
          cell.locator(`[data-evidence-id="${evidenceId}"]`),
          expectedEvidence!,
        );
      }
    }
    await expect(row.locator("[data-takeaway]")).toHaveText(expected.takeaway);
  }

  const overflow = comparison.locator("[data-table-scroll]");
  const scrollHelp = comparison.locator("#comparison-scroll-help");
  await expect(scrollHelp).toBeVisible();
  await expect(scrollHelp).toHaveText(fixture.comparison.scrollHelp);
  await expect(overflow).toHaveAttribute("role", "region");
  await expect(overflow).toHaveAttribute("tabindex", "0");
  await expect(overflow).toHaveAttribute("aria-label", /comparison/i);
  await expect(overflow).toHaveAttribute("aria-describedby", "comparison-scroll-help");
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

  const product = productById.get("peasant");
  expect(product).toBeDefined();
  await page.locator('[data-project-card="peasant"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("h1")).toBeFocused();

  const firstCommand = product!.run.find((instruction) => instruction.command !== null);
  expect(firstCommand).toBeDefined();
  const command = page.locator(`[data-instruction-id="${firstCommand!.id}"] .cli-cmd`);
  const copy = command.getByRole("button", { name: /^copy / });
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect(command.getByRole("button", { name: /^copied / })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(firstCommand!.command);
});

test("Atkinson fonts and canonical Fairtrade component styles mount from real production resources", async ({ page }) => {
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
    const breadcrumb = document.querySelector<HTMLElement>(".crumb");
    const button = document.querySelector<HTMLElement>(".btn");
    const prose = document.querySelector<HTMLElement>("[data-reading-text]");
    if (!card || !breadcrumb || !button || !prose) {
      throw new Error("Mounted Fairtrade style probe could not find card, breadcrumb, button, and prose targets.");
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
      breadcrumbFamily: getComputedStyle(breadcrumb).fontFamily,
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
  expect(computed.breadcrumbFamily).toContain("Atkinson Hyperlegible Mono");
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

      for (const product of fixture.products) {
        await page.goto(product.route);
        const detailOverflow = await page.evaluate(() => {
          const commands = [...document.querySelectorAll<HTMLElement>("[data-command-scroll]")];
          return {
            page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            commandCount: commands.length,
            commandsLabelled: commands.every(
              (element) =>
                element.getAttribute("role") === "region" &&
                Boolean(element.getAttribute("aria-label")),
            ),
          };
        });
        expect(detailOverflow.page).toBe(false);
        expect(detailOverflow.commandCount).toBeGreaterThan(0);
        expect(detailOverflow.commandsLabelled).toBe(true);
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
