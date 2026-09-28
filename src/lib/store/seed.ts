import type { StoreProduct } from "@/types/store";

const at = "2026-09-01T08:00:00.000Z";

/** Demo catalog for local development without a database. */
export const seedStoreProducts: StoreProduct[] = [
  {
    _id: "prod-pashmina",
    title: "Pashmina Ceruty Babydoll",
    slug: "pashmina-ceruty-babydoll",
    description: "Pashmina ceruty yang jatuh dan tidak menerawang. Ukuran 180 x 75 cm, mudah dibentuk.",
    price: 69000,
    compareAtPrice: 85000,
    images: ["/seed/narras-pashmina.svg"],
    variants: [
      { id: "v-cream", name: "Cream", stock: 12 },
      { id: "v-mocca", name: "Mocca", stock: 4 },
      { id: "v-black", name: "Black", stock: 0 },
    ],
    status: "active",
    createdAt: at,
    updatedAt: at,
  },
  {
    _id: "prod-segi-empat",
    title: "Segi Empat Voal Premium",
    slug: "segi-empat-voal-premium",
    description: "Voal premium lasercut, tegak di dahi tanpa banyak jarum. 115 x 115 cm.",
    price: 55000,
    images: ["/seed/narras-segi-empat.svg"],
    variants: [
      { id: "v-dusty", name: "Dusty Pink", stock: 8 },
      { id: "v-sage", name: "Sage", stock: 6 },
    ],
    status: "active",
    createdAt: "2026-09-02T08:00:00.000Z",
    updatedAt: "2026-09-02T08:00:00.000Z",
  },
  {
    _id: "prod-bergo",
    title: "Bergo Jersey Instan",
    slug: "bergo-jersey-instan",
    description: "Hijab instan jersey adem, tinggal pakai. Cocok untuk harian.",
    price: 45000,
    images: ["/seed/narras-bergo.svg"],
    variants: [{ id: "v-olive", name: "Olive", stock: 10 }],
    status: "active",
    createdAt: "2026-09-03T08:00:00.000Z",
    updatedAt: "2026-09-03T08:00:00.000Z",
  },
];
