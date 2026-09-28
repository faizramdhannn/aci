import { z } from "zod";
import { ORDER_STATUSES } from "@/types/store";

const rupiah = z.number().int().min(0).max(1_000_000_000);

export const variantSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  stock: z.number().int().min(0).max(100_000),
  image: z.string().max(1000).optional().nullable(),
  price: rupiah.optional().nullable(),
  compareAtPrice: rupiah.optional().nullable(),
  sku: z.string().trim().max(60).optional().nullable(),
})
  // Store empty overrides as absent, so the product's own price/photo applies.
  .transform((v) => ({
    id: v.id,
    name: v.name,
    stock: v.stock,
    ...(v.image ? { image: v.image } : {}),
    ...(v.price != null ? { price: v.price } : {}),
    ...(v.compareAtPrice ? { compareAtPrice: v.compareAtPrice } : {}),
    ...(v.sku ? { sku: v.sku } : {}),
  }));

export const productSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).default(""),
  price: rupiah,
  compareAtPrice: rupiah.optional().nullable(),
  images: z.array(z.string().min(1).max(1000)).max(10),
  variants: z.array(variantSchema).min(1).max(100),
  optionName: z.string().trim().max(30).optional(),
  collectionIds: z.array(z.string().min(1).max(64)).max(20).optional(),
  status: z.enum(["active", "draft"]),
});

export const orderPatchSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  shippingCost: rupiah.optional().nullable(),
  trackingNumber: z.string().trim().max(80).optional(),
  courier: z.string().trim().max(60).optional(),
  adminNote: z.string().trim().max(1000).optional(),
});

export const checkoutSchema = z.object({
  voucherCode: z.string().trim().max(30).optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        variantId: z.string().min(1).max(64),
        qty: z.number().int().min(1).max(50),
      })
    )
    .min(1)
    .max(30),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{8,20}$/),
    address: z.string().trim().min(8).max(400),
    city: z.string().trim().min(2).max(80),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/),
    note: z.string().trim().max(300).optional(),
  }),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(60).optional(),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^(\+?[\d\s-]{8,20})?$/)
    .optional(),
  tagline: z.string().trim().max(160).optional(),
  paymentInfo: z.string().trim().max(1000).optional(),
  instagramUrl: z.union([z.literal(""), z.string().url()]).optional(),
  howToOrder: z.string().trim().max(4000).optional(),
  shippingPolicy: z.string().trim().max(4000).optional(),
  returnPolicy: z.string().trim().max(4000).optional(),
  faq: z
    .array(z.object({ q: z.string().trim().min(1).max(200), a: z.string().trim().min(1).max(2000) }))
    .max(30)
    .optional(),
  heroBanners: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        image: z.string().min(1).max(1000),
        title: z.string().trim().max(80).optional(),
        subtitle: z.string().trim().max(200).optional(),
        href: z
          .string()
          .trim()
          .max(500)
          .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v))
          .optional(),
      })
    )
    .max(8)
    .optional(),
});

export const hubSettingsSchema = z.object({
  outfitImage: z.string().max(1000).optional(),
  storeImage: z.string().max(1000).optional(),
  storeLogo: z.string().max(1000).optional(),
});
