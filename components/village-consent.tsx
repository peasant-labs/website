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
    value: (
      <>
        profile revealed to <span className="mono">owners</span>
      </>
    ),
    scope: "others still see you as anon",
  },
  {
    icon: Globe,
    key: "data access",
    tone: "open",
    value: (
      <>
        <span className="mono">public</span>: anyone can browse the dataset
      </>
    ),
    scope: "no membership required",
  },
  {
    icon: Share2,
    key: "contribution",
    tone: "open",
    value: (
      <>
        <span className="mono">private</span> → <span className="mono">shared</span>
      </>
    ),
    scope: "the full record is shared",
  },
  {
    icon: Archive,
    key: "retention",
    tone: "restricted",
    value: (
      <>
        <span className="mono">mandatory</span>: auto-retracted on leave
      </>
    ),
    scope: "set by the collective",
  },
] as const;