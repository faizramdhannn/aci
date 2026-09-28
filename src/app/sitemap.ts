import type { MetadataRoute } from "next";
import { listPublishedImages } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";
import { listStoreProducts } from "@/lib/store/data";

// Built on request, not at build time — the build shouldn't need a live database.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [images, products] = await Promise.all([listPublishedImages(), listStoreProducts({ activeOnly: true })]);

  const staticRoutes: MetadataRoute.Sitemap = ["", "/outfit", "/narras", "/narras/info", "/shop", "/categories", "/privacy", "/disclosure"].map((path) => ({
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

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/narras/p/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...lookRoutes, ...productRoutes];
}
