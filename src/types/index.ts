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
  /** Hex color for the link marker icon, e.g. "#5A3D2B". */
  color: string;
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

export type ArrowStyle = "straight" | "curved" | "spiral";

export interface Annotation {
  _id: string;
  shoppableImageId: string;
  ownerId: string;
  kind: "arrow";
  style: ArrowStyle;
  color: string;
  strokeWidth: number;
  /** Normalized 0-1 start/end points, relative to source image dimensions. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  rotation: number;
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
