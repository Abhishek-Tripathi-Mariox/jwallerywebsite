export interface Category {
  _id: string;
  categoryName: string;
  image?: string;
  showOnHomeScreen?: boolean;
}

export interface GoldBreakdown {
  weightGrams: number;
  goldPurityPercent: number;
  makingChargePercent: number;
  combinedPercent: number;
  goldEquivalentGrams: number;
  rate24K: number;
  price: number;
}

export interface Product {
  _id: string;
  productName: string;
  productImages?: { url: string }[];
  productImage?: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  description?: string;
  stock?: number;
  isNew?: boolean;
  badge?: string;
  // Set by the backend when goldPricing.isEnabled — the customer-paid price
  // computed live from the 24K rate. Prefer this over `price` for display.
  computedPrice?: number;
  goldBreakdown?: GoldBreakdown;
  goldPricing?: {
    isEnabled?: boolean;
    weightGrams?: number;
    goldPurityPercent?: number;
    makingChargePercent?: number;
  };
}

export interface Banner {
  _id: string;
  desktopView?: string;
  mobileView?: string;
  ipadView?: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

export interface GoldPrice {
  purity?: string;
  type?: string;
  rate: number;
}

export interface Reel {
  _id: string;
  title?: string;
  mediaUrl: string;
  mediaType?: "image" | "video";
  thumbnailUrl?: string;
  instagramUrl: string;
  rank?: number;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}
