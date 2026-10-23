import { Archive, Eye, FileText, Globe, Share2, Users } from "@peasant-labs/fairtrade/icons";

/**
 * What a join settles, as fairtrade's own join dialog states it: three plain rows,
 * each an icon and a muted key over the thing that becomes true. Deliberately not
 * `ConsentSummary` — that component always draws its icon in a bordered chip and
 * lays the key beside the value, and the dialog this mirrors does neither.
 */
export const JOIN_AXES = [
  { icon: Eye, key: "identity", value: "profile shown to owners only" },
  { icon: Users, key: "to other members", value: "you stay anon" },
  { icon: FileText, key: "your transcripts", value: "none contributed on joining" },
] as const;

/**
 * The four axes a collective actually governs. The join dialog narrows to the one
 * axis a join moves (identity); the governance section states all four, because
 * "sane and transparent" is a claim about the whole settable surface, not about
 * the single row a reader happens to be crossing.
 */
export const GOVERNANCE_CAPTION = "governance axes" as const;

export const GOVERNANCE_AXES = [
  {
    icon: Eye,
    key: "identity",
    tone: "reveal",
    value: "the owners see your profile",
    scope: "everyone else sees you as anonymous",
  },
  {
    icon: Globe,
    key: "data access",
    tone: "open",
    value: "anyone can read what it shares",
    scope: "no need to be a member",
  },
  {
    icon: Share2,
    key: "contribution",
    tone: "open",
    value: "what you add is shared with the whole collective",
    scope: "the full record, not a summary",
  },
  {
    icon: Archive,
    key: "retention",
    tone: "restricted",
    value: "if you leave, what you added is taken out",
    scope: "the collective sets this",
  },
] as const;