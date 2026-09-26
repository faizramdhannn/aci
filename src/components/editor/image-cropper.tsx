"use client";

import { useRef, useState } from "react";
import { ASPECT_RATIOS, clampCrop, cropForRatio, type CropRect } from "@/lib/crop";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";

/**
 * Pick an aspect ratio, then drag the frame to choose what to keep and use
 * the slider to zoom in. Works with mouse and touch (pointer events). Emits a
 * normalized CropRect — the caller decides whether to crop in the browser
 * (fresh upload) or on the server (re-framing an existing look).
 */
export function ImageCropper({
  src,
  naturalWidth,
  naturalHeight,
  initialRatio = 4 / 5,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}: {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  initialRatio?: number | null;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (crop: CropRect) => void;
}) {
  const t = useAdminDictionary();
  const [ratio, setRatio] = useState<number | null>(initialRatio);
  const [size, setSize] = useState(1);
  const [crop, setCrop] = useState<CropRect>(() => cropForRatio(naturalWidth, naturalHeight, initialRatio));
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerX: number; pointerY: number; start: CropRect } | null>(null);

  const center = () => ({ cx: crop.x + crop.width / 2, cy: crop.y + crop.height / 2 });

  function chooseRatio(value: number | null) {
    const { cx, cy } = center();
    setRatio(value);
    setSize(1);
    setCrop(cropForRatio(naturalWidth, naturalHeight, value, 1, cx, cy));
  }

  function changeSize(next: number) {
    const { cx, cy } = center();
    setSize(next);
    setCrop(cropForRatio(naturalWidth, naturalHeight, ratio, next, cx, cy));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (ratio === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerX: e.clientX, pointerY: e.clientY, start: crop };
  }

  function onPointerMove(e: React.PointerEvent) {
    const frame = frameRef.current?.getBoundingClientRect();
    if (!drag.current || !frame) return;
    const dx = (e.clientX - drag.current.pointerX) / frame.width;
    const dy = (e.clientY - drag.current.pointerY) / frame.height;
    setCrop(clampCrop({ ...drag.current.start, x: drag.current.start.x + dx, y: drag.current.start.y + dy }));
  }

  function onPointerUp() {
    drag.current = null;
  }

  const outputWidth = Math.round(naturalWidth * crop.width);
  const outputHeight = Math.round(naturalHeight * crop.height);

  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ASPECT_RATIOS.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => chooseRatio(r.value)}
            aria-pressed={ratio === r.value}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              ratio === r.value ? "border-orange bg-orange text-cream" : "border-brown/20 text-brown-soft hover:text-brown"
            }`}
          >
            {r.value === null ? t.cropper.original : r.label}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <div
          ref={frameRef}
          className="relative touch-none select-none overflow-hidden rounded-lg"
          // Width is capped so a tall photo never exceeds 60vh — capping the
          // height instead would break aspect-ratio and misalign the frame.
          style={{
            aspectRatio: `${naturalWidth} / ${naturalHeight}`,
            width: `min(100%, calc(60vh * ${naturalWidth / naturalHeight}))`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URLs / exact-pixel preview, not a page image */}
          <img src={src} alt="" draggable={false} className="h-full w-full object-contain" />
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`absolute border-2 border-cream ${ratio === null ? "" : "cursor-move"}`}
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.width * 100}%`,
              height: `${crop.height * 100}%`,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-cream/25" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {ratio !== null && (
        <label className="mt-3 flex items-center gap-3 text-xs text-brown-soft">
          {t.cropper.zoom}
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.01}
            value={size}
            onChange={(e) => changeSize(Number(e.target.value))}
            className="flex-1 accent-orange"
          />
        </label>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-brown-soft">
          {outputWidth}×{outputHeight}px{ratio !== null && ` · ${t.cropper.dragHint}`}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft hover:text-brown"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(crop)}
            className="rounded-full bg-orange px-4 py-1.5 text-xs font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? t.common.saving : (confirmLabel ?? t.cropper.useCrop)}
          </button>
        </div>
      </div>
    </div>
  );
}
