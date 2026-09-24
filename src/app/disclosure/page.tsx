import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomBar } from "@/components/navigation/bottom-bar";
import { SiteFooter } from "@/components/navigation/site-footer";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).legal.disclosureTitle };
}

export default async function DisclosurePage() {
  const t = await getDictionary();
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-8">
        <h1 className="mb-6 text-2xl font-semibold text-brown">{t.legal.disclosureTitle}</h1>
        <div className="space-y-4 leading-relaxed text-brown-soft">
          {t.legal.disclosureBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </main>
      <SiteFooter />
      <BottomBar />
    </>
  );
}
