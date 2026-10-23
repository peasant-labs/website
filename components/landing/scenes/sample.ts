import type { RedactionReview } from "@peasant-labs/fairtrade/ui";

type RedactionMatch = NonNullable<Parameters<typeof RedactionReview>[0]["matches"]>[number];

/*
 * The sample the three scenes share: one session, as peasant would record,
 * redact and publish it. Illustrative data, not a record of real work.
 */
export const SAMPLE_TITLE = "Uploads to staging fail with a 403 since this morning";
export const SAMPLE_ID = "sess_c41e07";
export const SAMPLE_COLLECTIVE = { id: "eval-crowd", name: "eval-crowd", members: 12 };

/* the three things standard redaction replaces in it, with the engine's own placeholders */
export const SAMPLE_MATCHES: RedactionMatch[] = [
  {
    id: "key",
    category: "secrets",
    confidence: 0.99,
    secret: "AWS_ACCESS_KEY_ID=AKIA2F3E7Q9KX4EXAMPLE",
    after: "AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY>",
  },
  {
    id: "email",
    category: "pii",
    confidence: 0.96,
    secret: "ALERT_EMAIL=ana@example.com",
    after: "ALERT_EMAIL=<EMAIL>",
  },
  {
    id: "path",
    category: "paths",
    confidence: 0.93,
    secret: "/Users/ana/src/shop/.env",
    after: "/Users/<USER>/src/shop/.env",
  },
];
