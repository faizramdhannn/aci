import type { StoreOrder } from "@/types/store";
import { formatRupiah } from "@/lib/store/money";

/** Normalizes an Indonesian phone number to wa.me digits: 0812… / +62 812… → 62812… */
export function toWhatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${toWhatsappDigits(phone)}?text=${encodeURIComponent(text)}`;
}

/** The message the buyer sends to the store right after checkout. */
export function orderMessage(order: StoreOrder, orderUrl: string): string {
  const lines = [
    `Halo, saya mau pesan (${order.number}):`,
    "",
    ...order.items.map((i) => `• ${i.title} — ${i.variantName} x${i.qty} = ${formatRupiah(i.price * i.qty)}`),
    "",
    `Subtotal: ${formatRupiah(order.subtotal)} (belum ongkir)`,
    "",
    `Nama: ${order.customer.name}`,
    `No. HP: ${order.customer.phone}`,
    `Alamat: ${order.customer.address}, ${order.customer.city} ${order.customer.postalCode}`,
  ];
  if (order.customer.note) lines.push(`Catatan: ${order.customer.note}`);
  lines.push("", `Detail pesanan: ${orderUrl}`);
  return lines.join("\n");
}
