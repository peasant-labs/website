"use client";

import { redactionCategoryLabel, type RedactionCategory } from "@peasant-labs/fairtrade/ui";

/**
 * A redaction category's rendered label (CREDENTIAL, PII, PATH, INTERNAL). It
 * comes from the engine's own mapping through fairtrade, never a copy of it, so
 * the docs name a category exactly the way the publish window does.
 */
export function RedactionLabel({ category }: { category: RedactionCategory }) {
  return <code className="dx-label">{redactionCategoryLabel(category)}</code>;
}
