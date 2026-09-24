"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ShoppableImage } from "@/types";

const SLIDE_MS = 5000;

export function HeroCarousel({ images }: { images: ShoppableImage[] }) {
  const [index, setIndex] = useState(0);
  // Every slide sits in the same visible container (only opacity differs),
  // so the browser's native lazy-loading can't tell which ones are actually
  // off-screen — it would fetch every slide's photo upfront regardless of
  // `loading="lazy"`. Instead, only mount a slide's <Image> once it has
  // actually been shown, so photos download one at a time as the carousel
  // advances rather than all at once on page load.
  const [shownIndices, setShownIndices] = useState<Set<number>>(() => new Set([0, 1 % Math.max(images.length, 1)]));

  // Preloads the slide after `at` too, so it's ready by the time the
  // carousel actually advances there instead of popping in.
  function markShown(at: number) {
    const after = (at + 1) % images.length;
    setShownIndices((prev) => {
      if (prev.has(at) && prev.has(after)) return prev;
      return new Set(prev).add(at).add(after);
    });
  }

  function goTo(next: number) {
    setIndex(next);
    markShown(next);
  }

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % images.length;
        markShown(next);
        return next;
      });
    }, SLIDE_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markShown closes over images.length, which this effect already depends on
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="relative w-full"
        style={{ aspectRatio: `${images[0].imageWidth} / ${images[0].imageHeight}` }}
      >
        {images.map((image, i) => (
          <Link
            key={image._id}
            href={`/p/${image.slug}`}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
          >
            {shownIndices.has(i) && (
              <Image
                src={image.imageUrl}
                alt={image.title}
                fill
                sizes="(min-width: 768px) 448px, 100vw"
                priority={i === 0}
                className="object-cover"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brown/70 to-transparent p-5">
              <p className="text-sm font-medium text-cream">{image.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((image, i) => (
            <button
              key={image._id}
              onClick={() => goTo(i)}
              aria-label={`Show ${image.title}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                background: i === index ? "var(--color-yellow)" : "rgba(255,255,255,0.6)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
