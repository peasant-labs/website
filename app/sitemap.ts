import { POSTS } from "@/lib/blog";
import { SITEMAP_URLS, SITE_URL } from "@/lib/projects";
import type { MetadataRoute } from "next";

/**
 * Every public page: the product pages, the docs, the blog and its posts,
 * about and contact. A guest post is left out: its canonical address is where
 * it first appeared, and a sitemap lists only canonical addresses.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ...SITEMAP_URLS,
    `${SITE_URL}/docs`,
    `${SITE_URL}/docs/guides/evals`,
    `${SITE_URL}/docs/guides/reviews`,
    `${SITE_URL}/blog`,
    ...POSTS.filter((post) => !post.origin).map((post) => `${SITE_URL}/blog/${post.slug}`),
    `${SITE_URL}/about`,
    `${SITE_URL}/contact`,
  ];
  return pages.map((url) => ({ url }));
}
