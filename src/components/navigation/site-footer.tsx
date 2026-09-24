import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/data";

export async function SiteFooter() {
  const [t, settings] = await Promise.all([getDictionary(), getSiteSettings()]);
  const owner = settings.creatorName || settings.siteName;
  const socials = [
    settings.instagramUrl && { label: "Instagram", href: settings.instagramUrl },
    settings.tiktokUrl && { label: "TikTok", href: settings.tiktokUrl },
  ].filter((s): s is { label: string; href: string } => Boolean(s));

  return (
    // Bottom padding clears the fixed mobile bottom nav.
    <footer className="mt-16 border-t border-brown/10 px-6 pb-32 pt-10 text-sm text-brown-soft md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        <div>
          <p className="mb-2 font-semibold text-brown">{t.footer.about}</p>
          <p className="max-w-xs">
            {settings.about || settings.tagline || t.home.sub}
          </p>
        </div>

        {(socials.length > 0 || settings.email) && (
          <div>
            <p className="mb-2 font-semibold text-brown">
              {socials.length > 0 ? t.footer.follow : t.footer.contact}
            </p>
            <ul className="space-y-1">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-orange">
                    {s.label}
                  </a>
                </li>
              ))}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="hover:text-orange">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}

        <div>
          <ul className="space-y-1">
            <li>
              <Link href="/privacy" className="hover:text-orange">
                {t.footer.privacy}
              </Link>
            </li>
            <li>
              <Link href="/disclosure" className="hover:text-orange">
                {t.footer.disclosure}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs">
        © {new Date().getFullYear()} {owner}. {t.footer.rights}
      </p>
    </footer>
  );
}
