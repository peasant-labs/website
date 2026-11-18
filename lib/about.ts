/**
 * Every word and destination on /about: who builds peasant, who advises it,
 * and how to take part. The page owns layout; this module owns what it says.
 */

import { CONTACT_EMAIL, GITHUB_URL } from "@/lib/site";

/* what a link leads to, which picks its icon; the label names it for assistive technology and on hover */
export type PersonLinkKind = "website" | "github" | "linkedin" | "email" | "newsletter";

export type PersonLink = Readonly<{ kind: PersonLinkKind; label: string; href: string }>;

export type Person = Readonly<{
  name: string;
  /* one line under the name, only where the person states it themselves */
  role?: string;
  /* a square photo under public/, once we have one; until then the card shows a placeholder with their initials */
  photo?: string;
  /* the person's own site first, then the profiles it links to */
  links: readonly PersonLink[];
}>;

export const ABOUT = {
  /* one sentence on what Peasant Labs is, from the owner's one-pager */
  lede: "Peasant Labs builds free, open-source software that lets developers and researchers keep control of their agent transcripts and share them with the people they trust.",
  team: {
    title: "core members",
    people: [
      {
        name: "David Huu Pham",
        links: [
          { kind: "website", label: "website", href: "https://dhpham.com/" },
          { kind: "github", label: "github", href: "https://github.com/dayvidpham" },
          { kind: "linkedin", label: "linkedin", href: "https://linkedin.com/in/dhpham-software" },
          { kind: "email", label: "email", href: "mailto:dayvidpham@gmail.com" },
        ],
      },
      {
        name: "Patrick Zhao",
        links: [
          { kind: "website", label: "website", href: "https://www.patrickzhao.xyz/" },
          { kind: "github", label: "github", href: "https://github.com/PigeonZow" },
          { kind: "linkedin", label: "linkedin", href: "https://www.linkedin.com/in/patrick-zh/" },
          { kind: "email", label: "email", href: "mailto:patrick_zhao@sfu.ca" },
        ],
      },
      {
        name: "Vitor Hugo Welzel",
        links: [{ kind: "linkedin", label: "linkedin", href: "https://www.linkedin.com/in/vitorhw" }],
      },
    ] satisfies readonly Person[],
  },
  advising: {
    title: "advising",
    people: [
      {
        name: "Nick Vincent",
        role: "Assistant Professor, School of Computing Science, Simon Fraser University",
        links: [
          { kind: "website", label: "website", href: "https://www.nickmvincent.com/" },
          { kind: "newsletter", label: "data leverage newsletter", href: "https://dataleverage.substack.com/" },
        ],
      },
    ] satisfies readonly Person[],
  },
  involved: {
    title: "get involved",
    ways: [
      { text: "Try peasant on your own agent sessions.", label: "install peasant", href: "/#install" },
      { text: "Start a collective for your team, class or lab.", label: "talk to us", href: `mailto:${CONTACT_EMAIL}` },
      { text: "Read the code, file an issue or send a change.", label: "peasant on github", href: GITHUB_URL },
    ],
  },
  contributors: {
    title: "contributors",
    text: "Thank you to everyone who has contributed to a peasant-labs repository!",
    link: { label: "github", href: GITHUB_URL },
    /*
     * GitHub logins, A to Z, taken from the contributors of every peasant-labs repository (bots left out) on
     * 2026-11-12. To refresh: gh api repos/peasant-labs/<repo>/contributors for each repository.
     */
    logins: [
      "dayvidpham",
      "emmyfong",
      "gurjas-s",
      "jbriones1",
      "jonathanung",
      "matthew8573",
      "NicholasTamm",
      "PigeonZow",
      "RavdeepAulakh",
      "tanish2k09",
      "vitorhw",
    ],
  },
} as const;
