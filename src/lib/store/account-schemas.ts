import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]{8,20}$/);
export const passwordSchema = z.string().min(8).max(100);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  phone: phoneSchema,
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.union([z.literal(""), phoneSchema]),
});

export const passwordChangeSchema = z.object({
  current: z.string().max(100).optional(),
  next: passwordSchema,
});

export const addressSchema = z.object({
  id: z.string().max(64).optional(),
  label: z.string().trim().min(1).max(40),
  recipient: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  address: z.string().trim().min(8).max(400),
  city: z.string().trim().min(2).max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/),
  makeDefault: z.boolean().optional(),
});

export const cartSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(64),
      variantId: z.string().min(1).max(64),
      qty: z.number().int().min(1).max(50),
    })
  )
  .max(50);
