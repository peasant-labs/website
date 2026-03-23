export interface NavItem {
  title: string;
  slug: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNav: NavSection[] = [
  {
    title: "Introduction",
    items: [
      { title: "Overview", slug: [] },
      { title: "Getting Started", slug: ["getting-started"] },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { title: "Architecture", slug: ["core-concepts", "architecture"] },
      { title: "Ingest Pipeline", slug: ["core-concepts", "ingest-pipeline"] },
      {
        title: "Analytics Schema",
        slug: ["core-concepts", "analytics-schema"],
      },
    ],
  },
  {
    title: "Field Guides",
    items: [
      { title: "Installation", slug: ["guides", "installation"] },
      { title: "Configuration", slug: ["guides", "configuration"] },
      {
        title: "Ingesting Sessions",
        slug: ["guides", "ingesting-sessions"],
      },
    ],
  },
  {
    title: "The Almanac (CLI)",
    items: [
      { title: "ingest", slug: ["cli-reference", "ingest"] },
      { title: "push", slug: ["cli-reference", "push"] },
      { title: "tui", slug: ["cli-reference", "tui"] },
      { title: "web", slug: ["cli-reference", "web"] },
      { title: "kickstart", slug: ["cli-reference", "kickstart"] },
    ],
  },
];
