import type { StoreOrder } from "@/types/store";

const cell = (value: string | number | undefined | null) => {
  const s = value == null ? "" : String(value);
  // Quote everything that could break a row; neutralise spreadsheet formulas.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const ORDER_CSV_HEADER = [
  "Order",
  "Date",
  "Status",
  "Name",
  "Phone",
  "Address",
  "City",
  "Postal code",
  "Items",
  "Qty",
  "Subtotal",
  "Voucher",
  "Discount",
  "Shipping",
  "Total",
  "Courier",
  "Tracking",
  "Buyer note",
];

/** Orders as CSV (UTF-8 with BOM so Excel reads the rupiah names correctly). */
export function ordersToCsv(orders: StoreOrder[]): string {
  const date = (iso: string) =>
    new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 16);
  const rows = orders.map((o) => [
    o.number,
    date(o.createdAt),
    o.status,
    o.customer.name,
    o.customer.phone,
    o.customer.address,
    o.customer.city,
    o.customer.postalCode,
    o.items.map((i) => `${i.title} (${i.variantName}) x${i.qty}`).join("; "),
    o.items.reduce((s, i) => s + i.qty, 0),
    o.subtotal,
    o.voucherCode ?? "",
    o.discount ?? 0,
    o.shippingCost ?? "",
    o.total,
    o.courier ?? "",
    o.trackingNumber ?? "",
    o.customer.note ?? "",
  ]);
  return "﻿" + [ORDER_CSV_HEADER, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
