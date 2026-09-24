import type { MetadataRoute } from "next";
import { listPublishedImages } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";

// Built on request, not at build time — the build shouldn't need a live database.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const images = await listPublishedImages();

  const staticRoutes: MetadataRoute.Sitemap = ["", "/shop", "/categories", "/privacy", "/disclosure"].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.6,
  }));

  const lookRoutes: MetadataRoute.Sitemap = images.map((image) => ({
    url: `${siteUrl}/p/${image.slug}`,
    lastModified: image.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...lookRoutes];
}
