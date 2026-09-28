import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/store/data";
import { getStoreDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreDictionary()).store.info };
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-brown">
      {text
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p.trim()}
          </p>
        ))}
    </div>
  );
}

/** How to order, shipping, exchanges and FAQ — written in Admin → Store settings. */
export default async function StoreInfoPage() {
  const [t, settings] = await Promise.all([getStoreDictionary(), getStoreSettings()]);
  const sections = [
    { id: "cara-pesan", title: t.store.howToOrder, text: settings.howToOrder },
    { id: "pengiriman", title: t.store.shippingPolicy, text: settings.shippingPolicy },
    { id: "retur", title: t.store.returnPolicy, text: settings.returnPolicy },
  ].filter((s) => s.text?.trim());
  const faq = settings.faq ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-brown">{t.store.info}</h1>

      {sections.length + faq.length === 0 ? (
        <p className="mt-6 text-sm text-brown-soft">{t.store.infoEmpty}</p>
      ) : (
        <>
          <nav className="mt-5 flex flex-wrap gap-2">
            {[...sections, ...(faq.length ? [{ id: "faq", title: t.store.faq }] : [])].map((s) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-full border border-brown/20 px-3 py-1 text-xs text-brown hover:bg-brown/5">
                {s.title}
              </a>
            ))}
          </nav>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-10 scroll-mt-24">
              <h2 className="mb-3 text-lg font-semibold text-brown">{s.title}</h2>
              <Paragraphs text={s.text!} />
            </section>
          ))}
          {faq.length > 0 && (
            <section id="faq" className="mt-10 scroll-mt-24">
              <h2 className="mb-3 text-lg font-semibold text-brown">{t.store.faq}</h2>
              <div className="divide-y divide-brown/10 rounded-2xl border border-brown/10 bg-surface">
                {faq.map((item, i) => (
                  <details key={i} className="group px-4 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-brown">
                      {item.q}
                      <span className="text-brown-soft transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="mt-2">
                      <Paragraphs text={item.a} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
