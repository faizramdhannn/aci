"use client";

import { useEffect, useState } from "react";
import { useDictionary } from "@/components/i18n/locale-provider";

const SEEN_KEY = "aci_tap_hint_seen";

/** One-time "tap the dots" hint over a look's photo; dismissed for good once acknowledged. */
export function TapHint() {
  const t = useDictionary();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage, an external source React can't see during render
      if (!window.localStorage.getItem(SEEN_KEY)) setVisible(true);
    } catch {
      /* storage blocked — just don't show the hint */
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-center">
      <div className="glass-dark pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-4 pr-2 text-xs text-cream shadow-lg">
        <span>{t.look.tapHint}</span>
        <button onClick={dismiss} className="rounded-full bg-cream/15 px-3 py-1 font-semibold hover:bg-cream/25">
          {t.look.dismiss}
        </button>
      </div>
    </div>
  );
}
