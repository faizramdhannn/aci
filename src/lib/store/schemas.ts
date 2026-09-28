import { z } from "zod";
import { ORDER_STATUSES } from "@/types/store";

const rupiah = z.number().int().min(0).max(1_000_000_000);

export const variantSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  stock: z.number().int().min(0).max(100_000),
});

export const productSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).default(""),
  price: rupiah,
  compareAtPrice: rupiah.optional().nullable(),
  images: z.array(z.string().min(1).max(1000)).max(10),
  variants: z.array(variantSchema).min(1).max(50),
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
  heroImage: z.string().max(1000).optional(),
  heroTitle: z.string().trim().max(80).optional(),
  heroSubtitle: z.string().trim().max(200).optional(),
});

export const hubSettingsSchema = z.object({
  outfitImage: z.string().max(1000).optional(),
  storeImage: z.string().max(1000).optional(),
});
