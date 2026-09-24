import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The offline demo/seed dataset ships its placeholder photos as local
    // SVGs (src/lib/seed-data.ts) so the app works with zero setup — actual
    // user uploads are restricted to JPEG/PNG/WEBP/GIF (see src/lib/storage.ts),
    // so this only ever applies to our own trusted seed assets.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Vercel Blob storage (uploads), when BLOB_READ_WRITE_TOKEN is set — see src/lib/storage.ts
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Public Instagram/TikTok CDN images fetched via "Import from URL" — see src/lib/import-from-url.ts
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
      { protocol: "https", hostname: "*.tiktokcdn.com" },
      { protocol: "https", hostname: "*.tiktokcdn-us.com" },
    ],
  },
};

export default nextConfig;
