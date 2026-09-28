/** by.narras — the hijab store that lives next to the outfit site. Prices are whole rupiah. */

export interface StoreVariant {
  id: string;
  /** e.g. a colour: "Cream", "Dusty Pink". */
  name: string;
  stock: number;
}

export type StoreProductStatus = "active" | "draft";

export interface StoreProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  /** Optional "was" price, shown struck through when higher than price. */
  compareAtPrice?: number;
  images: string[];
  variants: StoreVariant[];
  status: StoreProductStatus;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUSES = ["pending", "confirmed", "paid", "shipped", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  productId: string;
  variantId: string;
  title: string;
  variantName: string;
  price: number;
  qty: number;
  image?: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  note?: string;
}

export interface StoreOrder {
  _id: string;
  /** Human order number, e.g. NR-0012. */
  number: string;
  items: OrderItem[];
  subtotal: number;
  /** Set by the admin after confirming shipping over WhatsApp. */
  shippingCost?: number;
  total: number;
  customer: OrderCustomer;
  status: OrderStatus;
  trackingNumber?: string;
  courier?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  /** Digits with country code, e.g. 6281234567890 — where checkout messages go. */
  whatsappNumber: string;
  tagline: string;
  /** Free text shown after ordering, e.g. bank account details. */
  paymentInfo: string;
  instagramUrl?: string;
}
