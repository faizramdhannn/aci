"use client";

import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { whatsappLink } from "@/lib/store/whatsapp";
import { useAppPathname } from "@/lib/use-app-pathname";

/** Floating chat button on by.narras pages (hidden on checkout/account pages, where it would cover forms). */
export function WhatsappFloat({ number }: { number: string }) {
  const t = useStoreDictionary().store;
  const pathname = useAppPathname();
  if (!number || /^\/narras\/(cart|login|register|forgot-password|reset-password|account)/.test(pathname)) return null;
  return (
    <a
      href={whatsappLink(number, "Halo by.narras, saya mau tanya ")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsappChat}
      title={t.whatsappChat}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 print:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.7-.1 1.3Z" />
      </svg>
    </a>
  );
}
