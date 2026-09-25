"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SPLASH_COOKIE } from "@/lib/splash";

const MIN_VISIBLE_MS = 2500;
const MAX_WAIT_MS = 7000;
const FADE_MS = 600;

function wavePath(level: number, phase: number) {
  let d = `M 0 ${level}`;
  for (let x = 0; x <= 400; x += 8) d += ` L ${x} ${level + Math.sin((x / 90) * Math.PI * 2 + phase) * 6}`;
  return `${d} L 400 150 L 0 150 Z`;
}

/**
 * Once-per-session intro: the wordmark starts as an outline and fills from
 * the bottom like rising water. The fill tracks real page readiness (window
 * load + fonts) instead of a fixed timer — it eases toward ~90% while
 * loading, then rushes to full once the page is ready. The session cookie
 * (no max-age, so it's cleared when the browser closes) lets the server skip
 * rendering it entirely on later page views.
 */
export function SplashScreen({ word }: { word: string }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"showing" | "leaving" | "gone">("showing");
  const waveRef = useRef<SVGPathElement>(null);
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    document.cookie = `${SPLASH_COOKIE}=1; path=/; samesite=lax`;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const start = performance.now();
    let ready = false;
    let readyAt = 0;
    let shown = 0;
    let raf = 0;
    let finished = false;

    const pageLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
    Promise.all([pageLoaded, document.fonts.ready]).then(() => {
      ready = true;
    });

    function finish() {
      if (finished) return;
      finished = true;
      setPhase("leaving");
      window.setTimeout(() => {
        setPhase("gone");
        document.body.style.overflow = previousOverflow;
      }, FADE_MS);
    }

    function frame(now: number) {
      const elapsed = now - start;
      const done = (ready && elapsed >= MIN_VISIBLE_MS) || elapsed >= MAX_WAIT_MS;
      if (done && !readyAt) readyAt = now;

      const target = readyAt ? 1 : 0.9 * (1 - Math.exp(-elapsed / 1500));
      shown = reduceMotion ? target : shown + (target - shown) * (readyAt ? 0.06 : 0.05);
      waveRef.current?.setAttribute("d", wavePath(132 - shown * 138, elapsed / 260));

      if (readyAt && (shown > 0.995 || reduceMotion) && now - readyAt > 400) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
    };
  }, [isAdmin]);

  if (isAdmin || phase === "gone") return null;

  const text = (extra: React.SVGProps<SVGTextElement>) => (
    <text
      x="200"
      y="72"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="Lazydog, var(--font-playfair), Georgia, serif"
      fontSize="120"
      {...extra}
    >
      {word}
    </text>
  );

  return (
    <div
      role="status"
      aria-label={word}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-cream transition-opacity ease-out"
      style={{ opacity: phase === "leaving" ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      <svg viewBox="0 0 400 144" className="w-[min(82vw,560px)]" aria-hidden>
        <defs>
          <clipPath id="splash-word">{text({})}</clipPath>
        </defs>
        <g clipPath="url(#splash-word)">
          <path ref={waveRef} d={wavePath(132, 0)} className="fill-orange" />
        </g>
        {text({ fill: "none", stroke: "currentColor", strokeWidth: 1.2, className: "text-brown" })}
      </svg>
    </div>
  );
}
