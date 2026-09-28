import { Star } from "lucide-react";

/** Read-only star row; `value` may be fractional (rounded to the nearest half for display). */
export function Stars({ value, size = 14, label }: { value: number; size?: number; label?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? `${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-brown/25" style={{ width: size, height: size }} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? size : size / 2 }}>
                <Star className="fill-yellow text-yellow" style={{ width: size, height: size }} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
