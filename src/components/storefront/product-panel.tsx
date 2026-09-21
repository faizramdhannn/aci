import type { Hotspot } from "@/types";

const marketplaceLabel: Record<string, string> = {
  shopee: "Shopee",
  tokopedia: "Tokopedia",
  "tiktok-shop": "TikTok Shop",
  lazada: "Lazada",
  instagram: "Instagram",
  other: "Other",
};

function formatPrice(price?: number) {
  if (!price) return null;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    price
  );
}

export function ProductPanel({ hotspot, onClose }: { hotspot: Hotspot; onClose: () => void }) {
  const price = formatPrice(hotspot.productPrice);

  return (
    <div className="w-full max-w-xs">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {hotspot.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hotspot.logoUrl} alt="" className="h-9 w-9 rounded-full" />
          )}
          <div>
            <p className="text-sm font-semibold text-brown">{hotspot.title}</p>
            {hotspot.marketplace && (
              <p className="text-xs text-brown-soft">{marketplaceLabel[hotspot.marketplace]}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1 text-brown-soft transition-colors hover:text-brown"
        >
          ✕
        </button>
      </div>

      {hotspot.description && <p className="mb-3 text-sm text-brown-soft">{hotspot.description}</p>}

      <div className="flex items-center justify-between gap-3">
        {price && <span className="text-sm font-semibold text-brown">{price}</span>}
        <a
          href={`/go/${hotspot._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          Shop product
        </a>
      </div>
    </div>
  );
}
