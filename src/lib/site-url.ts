/**
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL/VERCEL_URL automatically. Without
 * an absolute base URL, relative asset/page URLs (metadataBase, sitemap,
 * robots.txt) can't be resolved correctly outside the app itself — e.g. by
 * link-preview crawlers or search engines.
 */
export const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
