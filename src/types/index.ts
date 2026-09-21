export type MarketplaceName =
  | "shopee"
  | "tokopedia"
  | "tiktok-shop"
  | "lazada"
  | "instagram"
  | "other";

export interface ShoppableImage {
  _id: string;
  ownerId: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  categoryIds: string[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface Hotspot {
  _id: string;
  shoppableImageId: string;
  ownerId: string;
  type: "product";
  title: string;
  description?: string;
  affiliateUrl: string;
  logoUrl?: string;
  productImageUrl?: string;
  productPrice?: number;
  marketplace?: MarketplaceName;
  /** Normalized 0-1, relative to source image dimensions. */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  coverImage?: string;
  sortOrder: number;
  isActive: boolean;
}

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface ViewEvent {
  _id: string;
  shoppableImageId: string;
  ownerId: string;
  createdAt: string;
  sessionId: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  viewportWidth: number;
  viewportHeight: number;
  referrer?: string;
}

export interface ClickEvent {
  _id: string;
  hotspotId: string;
  shoppableImageId: string;
  ownerId: string;
  createdAt: string;
  sessionId: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  viewportWidth: number;
  viewportHeight: number;
  referrer?: string;
  /** Normalized 0-1 click position on the source image. */
  clickX?: number;
  clickY?: number;
}
