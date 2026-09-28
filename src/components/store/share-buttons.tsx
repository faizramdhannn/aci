"use client";

import { useSyncExternalStore } from "react";
import { Link2, Share2 } from "lucide-react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";

const pill =
  "flex items-center gap-1.5 rounded-full border border-brown/20 px-3 py-1.5 text-xs font-medium text-brown transition-colors hover:bg-brown/5";

/** WhatsApp, copy-link and (on phones) the native share sheet for the current page. */
export function ShareButtons({ title }: { title: string }) {
  const t = useStoreDictionary().store;
  const toast = useToast();
  const url = () => window.location.href.split("#")[0];
  // Known only in the browser; false during server render so hydration matches.
  const canShare = useSyncExternalStore(
    () => () => {},
    () => "share" in navigator,
    () => false
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-brown-soft">{t.share}:</span>
      <button
        type="button"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`, "_blank", "noopener")}
        className={pill}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#25D366]" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.7-.1 1.3Z" />
        </svg>
        WhatsApp
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url());
            toast(t.linkCopied);
          } catch {
            window.prompt(t.copyLink, url());
          }
        }}
        className={pill}
      >
        <Link2 className="h-3.5 w-3.5" />
        {t.copyLink}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url: url() }).catch(() => undefined)}
          className={pill}
        >
          <Share2 className="h-3.5 w-3.5" />
          {t.share}
        </button>
      )}
    </div>
  );
}
