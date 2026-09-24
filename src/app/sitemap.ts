import type { MetadataRoute } from "next";
import { listShoppableImages } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const images = (await listShoppableImages()).filter((i) => i.status === "published");

  const staticRoutes: MetadataRoute.Sitemap = ["", "/shop", "/categories", "/favorites"].map((path) => ({
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
