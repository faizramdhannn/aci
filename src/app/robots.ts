import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin-login", "/api", "/narras/cart", "/narras/order", "/narras/account", "/narras/login", "/narras/register", "/narras/forgot-password", "/narras/reset-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
