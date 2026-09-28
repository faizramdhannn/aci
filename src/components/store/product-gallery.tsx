"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-brown/5">
        {current && (
          <Image src={current} alt={title} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${title} ${i + 1}`}
              aria-current={i === active}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                i === active ? "border-orange" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
