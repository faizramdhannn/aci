"use client";

import Image from "next/image";
import { ImageUploadField } from "@/components/editor/image-upload-field";

/** One replaceable photo setting: preview + upload/crop, with an optional "clear" link. */
export function ImageSetting({
  value,
  onChange,
  ratio,
  clearLabel,
}: {
  value: string;
  onChange: (url: string) => void;
  ratio: number;
  clearLabel: string;
}) {
  return (
    <div>
      {value && (
        <div className="relative mb-3 w-full overflow-hidden rounded-xl border border-brown/10 bg-brown/5" style={{ aspectRatio: ratio }}>
          <Image src={value} alt="" fill sizes="480px" className="object-cover" />
        </div>
      )}
      <ImageUploadField value={null} defaultRatio={ratio} onChange={(img) => onChange(img.url)} />
      {value && (
        <button type="button" onClick={() => onChange("")} className="mt-2 text-xs text-brown-soft hover:text-red-500">
          {clearLabel}
        </button>
      )}
    </div>
  );
}
