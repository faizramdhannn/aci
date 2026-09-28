import { z } from "zod";

const rupiah = z.number().int().min(0).max(1_000_000_000);

export const voucherSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/),
    type: z.enum(["percent", "fixed"]),
    value: z.number().int().min(1),
    maxDiscount: rupiah.optional().nullable(),
    minSubtotal: rupiah.optional().nullable(),
    maxUses: z.number().int().min(1).max(1_000_000).optional().nullable(),
    expiresAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable()
      .or(z.literal("")),
    active: z.boolean(),
  })
  .refine((v) => v.type !== "percent" || v.value <= 100, { path: ["value"] });
