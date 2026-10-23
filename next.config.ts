import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/* every picture's content hash, so its address changes when it is redrawn (lib/art-src.ts) */
function artVersions() {
  const folder = join(process.cwd(), "public", "art");
  const versions: Record<string, string> = {};
  for (const name of readdirSync(folder)) {
    versions[name] = createHash("sha256").update(readFileSync(join(folder, name))).digest("hex").slice(0, 8);
  }
  return JSON.stringify(versions);
}

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  transpilePackages: ["@peasant-labs/fairtrade"],
  env: { NEXT_PUBLIC_ART_VERSIONS: artVersions() },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      "remark-gfm",
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "frontmatter" }],
    ],
    rehypePlugins: [
      "rehype-slug",
      [
        "rehype-autolink-headings",
        {
          behavior: "append",
          properties: {
            className: ["anchor-link"],
            ariaHidden: true,
            tabIndex: -1,
          },
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
