import { POSTS } from "@/lib/blog";
import { SITEMAP_URLS, SITE_URL } from "@/lib/projects";
import type { MetadataRoute } from "next";

/** Every public page: the product pages, the docs, the blog and its posts, about and contact. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ...SITEMAP_URLS,
    `${SITE_URL}/docs`,
    `${SITE_URL}/docs/guides/evals`,
    `${SITE_URL}/docs/guides/reviews`,
    `${SITE_URL}/blog`,
    ...POSTS.map((post) => `${SITE_URL}/blog/${post.slug}`),
    `${SITE_URL}/about`,
    `${SITE_URL}/contact`,
  ];
  return pages.map((url) => ({ url }));
}
