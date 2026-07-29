import { SITEMAP_URLS } from "@/lib/projects";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_URLS.map((url) => ({ url }));
}
