import type { ComponentType } from "react";
import ReclaimingDataAutonomy, { ESSAY_TEXT } from "./reclaiming-data-autonomy-as-a-peasant";

/**
 * Every listed post's body, and the words it shows for the docs search. A post
 * in lib/blog.ts without a body here is a 404.
 */
export const POST_BODIES: Readonly<Record<string, { Body: ComponentType; text: readonly string[] }>> = {
  "reclaiming-data-autonomy-as-a-peasant": { Body: ReclaimingDataAutonomy, text: ESSAY_TEXT },
};
