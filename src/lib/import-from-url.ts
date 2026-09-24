/**
 * Fetches a public Instagram/TikTok post's og:image (no OAuth/API keys —
 * just what the page already exposes for link previews) and returns it as
 * a File, ready for the normal upload pipeline (src/lib/storage.ts).
 * Only works for posts public enough to have that meta tag; private/removed
 * posts fail with a clear error instead of silently returning nothing.
 */
export class ImportUrlError extends Error {}

const ALLOWED_HOSTS = [/(^|\.)instagram\.com$/i, /(^|\.)tiktok\.com$/i];

function extractOgImage(html: string): string | null {
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  return match ? match[1].replace(/&amp;/g, "&") : null;
}

export async function importImageFromUrl(pageUrl: string): Promise<{ file: File }> {
  let parsed: URL;
  try {
    parsed = new URL(pageUrl);
  } catch {
    throw new ImportUrlError("That doesn't look like a valid URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new ImportUrlError("Only https:// links are supported.");
  }
  if (!ALLOWED_HOSTS.some((re) => re.test(parsed.hostname))) {
    throw new ImportUrlError("Only Instagram and TikTok post links are supported.");
  }

  let pageRes: Response;
  try {
    pageRes = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AciImportBot/1.0)" },
    });
  } catch {
    throw new ImportUrlError("Couldn't reach that link.");
  }
  if (!pageRes.ok) throw new ImportUrlError("Couldn't reach that link.");

  const html = await pageRes.text();
  const imageUrl = extractOgImage(html);
  if (!imageUrl) throw new ImportUrlError("Couldn't find a photo on that page — it may be private or removed.");

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new ImportUrlError("Couldn't download the photo from that page.");

  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
  const blob = await imageRes.blob();
  const ext = contentType.split("/")[1]?.split(";")[0] ?? "jpg";
  const file = new File([blob], `import-${Date.now()}.${ext}`, { type: contentType });

  return { file };
}
