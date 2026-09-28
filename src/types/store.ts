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
  /** The account that placed it (orders from before accounts existed have none). */
  customerId?: string;
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
  /** Slides of the hero banner on /narras, in order. Empty = the plain text header. */
  heroBanners?: HeroBanner[];
  /** @deprecated single-banner fields from before heroBanners; read once as the first slide. */
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
}

export interface HeroBanner {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  /** Where the button goes, e.g. /narras/p/pashmina. Empty = scroll to the products. */
  href?: string;
}

/** Cover photos of the two cards on the hub page (/). Empty = picked automatically. */
export interface HubSettings {
  outfitImage?: string;
  storeImage?: string;
  /** by.narras logo used in the site switcher and store header. Empty = text wordmark. */
  storeLogo?: string;
}

export type CommentTarget = "look" | "product";
export type CommentStatus = "active" | "draft";

/** A visitor comment on a Spill Outfit look or a by.narras product. */
export interface ProductComment {
  _id: string;
  target: CommentTarget;
  /** Look or product _id. */
  targetId: string;
  name: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  /** e.g. "Rumah", "Kantor". */
  label: string;
  recipient: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  qty: number;
}

/** A by.narras shopper account. */
export interface Customer {
  _id: string;
  /** Lowercased; unique. */
  email: string;
  name: string;
  phone: string;
  /** Absent for Google-only accounts until they set one. */
  passwordHash?: string;
  googleId?: string;
  addresses: CustomerAddress[];
  defaultAddressId?: string;
  cart: CartItem[];
  createdAt: string;
  updatedAt: string;
}
