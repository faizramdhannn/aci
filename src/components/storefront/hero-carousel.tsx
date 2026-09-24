"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ShoppableImage } from "@/types";

const SLIDE_MS = 5000;

export function HeroCarousel({ images }: { images: ShoppableImage[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
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
            <Image
              src={image.imageUrl}
              alt={image.title}
              fill
              sizes="(min-width: 768px) 448px, 100vw"
              priority={i === 0}
              className="object-cover"
            />
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
              onClick={() => setIndex(i)}
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
