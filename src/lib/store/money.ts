const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

/** Rp 125.000 */
export function formatRupiah(amount: number): string {
  return idr.format(amount).replace(/ /g, " ");
}
