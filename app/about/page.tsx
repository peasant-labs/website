import { WheatField } from "@/components/about/wheat-field";
import { BrandMark } from "@/components/fairtrade-client";
import { SiteShell } from "@/components/site-shell";
import { ABOUT, type Person, type PersonLinkKind } from "@/lib/about";
import { Globe, Mail } from "@peasant-labs/fairtrade/icons";
import { VISION } from "@/lib/landing";
import { metadataForRoute } from "@/lib/projects";
import Link from "next/link";
import "./about.css";

export const metadata = metadataForRoute({
  title: "about | peasant",
  description: "who builds peasant, who advises it, and how to take part.",
  canonical: "/about",
});

/*
 * LinkedIn's mark, which fairtrade's BrandMark does not carry yet: the Simple Icons path (CC0), single colour,
 * tinted by the text colour like every other mark.
 */
function LinkedInMark() {
  return (
    <svg className="ab-link-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* each kind of link's icon: the provider's own mark where there is one, a plain line icon otherwise */
function LinkIcon({ kind }: { kind: PersonLinkKind }) {
  switch (kind) {
    case "github":
      return <BrandMark name="github" className="ab-link-ic" />;
    case "linkedin":
      return <LinkedInMark />;
    case "email":
      return <Mail className="ab-link-ic" aria-hidden="true" focusable="false" />;
    default:
      return <Globe className="ab-link-ic" aria-hidden="true" focusable="false" />;
  }
}

/* a site of the person's own reads as words; a profile or an address is its icon */
const TEXT_LINKS: readonly PersonLinkKind[] = ["website", "newsletter"];

/* the person's portrait, or until there is one a square holding their initials */
function Portrait({ person }: { person: Person }) {
  if (person.photo) {
    // eslint-disable-next-line @next/next/no-img-element -- a small square portrait needs no optimisation
    return <img className="ab-portrait" src={person.photo} alt="" width={96} height={96} />;
  }
  const initials = person.name
    .split(" ")
    .map((part) => part[0])
    .filter((_, index, all) => index === 0 || index === all.length - 1)
    .join("");
  return (
    <span className="ab-portrait ab-portrait-empty" aria-hidden="true">
      {initials}
    </span>
  );
}

/* a person: their portrait, their name, the one line they give about themselves, and their own links */
function PersonCard({ person }: { person: Person }) {
  const words = person.links.filter((link) => TEXT_LINKS.includes(link.kind));
  const icons = person.links.filter((link) => !TEXT_LINKS.includes(link.kind));
  return (
    <li className="ab-person">
      <Portrait person={person} />
      <h3 className="ab-person-name">{person.name}</h3>
      {person.role ? <p className="ab-person-role">{person.role}</p> : null}
      <ul className="ab-person-links" aria-label={`${person.name}'s links`}>
        {words.map((link) => (
          <li key={link.href}>
            <a className="site-link ab-link-text" href={link.href}>
              {link.label}
            </a>
          </li>
        ))}
        {icons.map((link) => (
          <li key={link.href}>
            {/* an icon alone, so its name is spoken and shown on hover */}
            <a className="ab-link" href={link.href} aria-label={`${person.name}'s ${link.label}`} title={link.label}>
              <LinkIcon kind={link.kind} />
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

/**
 * Who we are: the statement the landing ends on as the heading, one sentence on
 * what Peasant Labs builds, then the people behind it and the ways to take part.
 */
export default function AboutPage() {
  return (
    <SiteShell>
      <main id="content" className="pj-main" tabIndex={-1}>
        <header className="pj-catalog-hero">
          <div className="pj-hero-copy">
            <div className="pj-vision" data-reading-text>
              <h1 id="project-heading" className="pj-vision-line" tabIndex={-1}>
                {VISION.line}
              </h1>
              <p>{ABOUT.lede}</p>
            </div>
            <p className="pj-lede" data-reading-text>
              See{" "}
              <Link className="site-link" href="/blog">
                our blog
              </Link>{" "}
              for more thoughts.
            </p>
          </div>
        </header>

        <section className="pj-section" data-team aria-labelledby="team-heading">
          <div className="pj-section-heading">
            <h2 id="team-heading">{ABOUT.team.title}</h2>
          </div>
          <ul className="ab-people">
            {ABOUT.team.people.map((person) => (
              <PersonCard key={person.name} person={person} />
            ))}
          </ul>
        </section>

        <section className="pj-section" data-advising aria-labelledby="advising-heading">
          <div className="pj-section-heading">
            <h2 id="advising-heading">{ABOUT.advising.title}</h2>
          </div>
          <ul className="ab-people">
            {ABOUT.advising.people.map((person) => (
              <PersonCard key={person.name} person={person} />
            ))}
          </ul>
        </section>

        <section className="pj-section" data-involved aria-labelledby="involved-heading">
          <div className="pj-section-heading">
            <h2 id="involved-heading">{ABOUT.involved.title}</h2>
          </div>
          <ul className="ab-ways">
            {ABOUT.involved.ways.map((way) => (
              <li key={way.href} className="ab-way">
                <p>{way.text}</p>
                <a className="site-link" href={way.href}>
                  {way.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="pj-section" data-contributors aria-labelledby="contributors-heading">
          <div className="pj-section-heading">
            <h2 id="contributors-heading">{ABOUT.contributors.title}</h2>
            <p data-reading-text>
              {ABOUT.contributors.text} (
              <a className="site-link" href={ABOUT.contributors.link.href}>
                {ABOUT.contributors.link.label}
              </a>
              )
            </p>
          </div>
          <WheatField logins={ABOUT.contributors.logins} />
        </section>
      </main>
    </SiteShell>
  );
}
