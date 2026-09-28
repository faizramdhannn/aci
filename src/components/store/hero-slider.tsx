"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBanner } from "@/types/store";

const SLIDE_MS = 3000;

/**
 * by.narras hero: one or more banners that cross-fade every 3s. Arrows,
 * dots, swiping/dragging and horizontal trackpad scroll change slides. Pauses
 * while hovered or focused and when the tab is hidden, supports swiping on
 * phones. With reduced motion the slides switch without the fade.
 */
export function HeroSlider({
  banners,
  fallbackTitle,
  fallbackSubtitle,
  cta,
}: {
  banners: HeroBanner[];
  fallbackTitle: string;
  fallbackSubtitle?: string;
  cta: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragX = useRef<number | null>(null);
  const lastWheel = useRef(0);
  const count = banners.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, index]);

  const go = (next: number) => setIndex((next + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      className="relative mb-12 overflow-hidden rounded-3xl bg-brown/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      // Swipe on touch, drag with a mouse.
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("a,button")) return;
        dragX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (dragX.current === null) return;
        const dx = e.clientX - dragX.current;
        dragX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
      onPointerCancel={() => (dragX.current = null)}
      // Two-finger horizontal scroll on a trackpad; one slide per gesture.
      onWheel={(e) => {
        if (count <= 1 || Math.abs(e.deltaX) < 20 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
        const now = Date.now();
        if (now - lastWheel.current < 600) return;
        lastWheel.current = now;
        go(index + (e.deltaX > 0 ? 1 : -1));
      }}
    >
      <div className="relative aspect-[4/5] touch-pan-y select-none sm:aspect-[16/9]">
        {banners.map((banner, i) => {
          const active = i === index;
          const title = banner.title || (i === 0 ? fallbackTitle : "");
          const subtitle = banner.subtitle || (i === 0 ? fallbackSubtitle : "");
          const href = banner.href || "#products";
          return (
            <div
              key={banner.id}
              aria-hidden={!active}
              aria-roledescription="slide"
              className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <Image
                src={banner.image}
                alt={title}
                fill
                priority={i === 0}
                sizes="(min-width: 1152px) 1104px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 pb-10 text-white sm:p-10 sm:pb-12">
                {title &&
                  (i === 0 ? (
                    <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
                  ) : (
                    <p className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">{title}</p>
                  ))}
                {subtitle && <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{subtitle}</p>}
                <Link
                  href={href}
                  tabIndex={active ? 0 : -1}
                  className="mt-5 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
                >
                  {cta}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black shadow backdrop-blur transition hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black shadow backdrop-blur transition hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`${i + 1} / ${count}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
