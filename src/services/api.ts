import api from "../lib/axios";
import type { ApiResponse, Banner, Category, GoldPrice, Product, Reel } from "../types";

/**
 * Wraps an axios call into a uniform `{ code, message, data }` shape so the
 * rest of the app can treat success/failure the same way. A network error or
 * non-200 response collapses into `{ code: 0, data: <shape-default> }` so
 * callers can render fallbacks instead of crashing.
 */
const unwrap = <T,>(p: Promise<{ data: ApiResponse<T> }>, fallback?: T) =>
  p
    .then((res) => {
      const r = res.data;
      // Backend returns { code, message, data } — code 1 = success
      if (r && typeof r === "object" && "code" in r) return r;
      return { code: 1, data: r as unknown as T } as ApiResponse<T>;
    })
    .catch((err) => ({
      code: err?.response?.status === 401 ? 3 : 0,
      message: err?.response?.data?.message || err?.message || "request_failed",
      data: (fallback ?? (null as unknown)) as T,
    }));

// ---------- Home / Catalog (public) ----------

export const fetchHomeScreen = () => unwrap<any>(api.get("/user/homeScreen"));

export const fetchGoldPrices = () =>
  unwrap<GoldPrice[]>(api.get("/user/gold-prices"), []);

export const fetchBanners = () =>
  unwrap<Banner[]>(api.get("/user/banners"), []);

export const fetchCustomerReviews = () =>
  unwrap<any[]>(api.get("/user/customer-reviews"), []);

export const fetchReels = () =>
  unwrap<Reel[]>(api.get("/user/reels"), []);

export const fetchHomeCategories = () =>
  unwrap<{ categories: Category[] }>(api.get("/user/home-categories"), { categories: [] });

export const fetchSpecialOffers = () =>
  unwrap<{ offers: Product[] }>(api.get("/user/special-offers"), { offers: [] });

export const fetchSupportInfo = () => unwrap<any>(api.get("/user/support-info"));

export interface ContactSubmissionPayload {
  fullName?: string;
  email: string;
  countryCode?: string;
  mobileNumber: string;
  interest?: string;
  message?: string;
  consent?: boolean;
}

export const submitContact = (payload: ContactSubmissionPayload) =>
  unwrap<{ _id: string; createdAt: string }>(
    api.post("/user/contact", payload),
  );

// ---------- Static pages (CMS) ----------
export interface StaticPage {
  _id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  content?: string;
  seoDescription?: string;
  isPublished?: boolean;
  updatedAt?: string;
}

export const fetchStaticPage = (slug: string) =>
  unwrap<StaticPage>(api.get(`/user/pages/${encodeURIComponent(slug)}`));

// ---------- Notifications ----------

export interface NotificationItem {
  _id: string;
  type: "order" | "promo" | "system" | "broadcast";
  title: string;
  message: string;
  link?: string;
  orderId?: string | null;
  isBroadcast?: boolean;
  isRead: boolean;
  createdAt: string;
}

export const fetchNotifications = (page = 1, limit = 20) =>
  unwrap<{ items: NotificationItem[]; total: number; page: number; limit: number }>(
    api.get(`/user/notifications?page=${page}&limit=${limit}`),
    { items: [], total: 0, page, limit },
  );

export const fetchUnreadCount = () =>
  unwrap<{ unreadCount: number }>(api.get("/user/notifications/unread-count"), {
    unreadCount: 0,
  });

export const markNotificationRead = (id: string) =>
  unwrap<any>(api.patch(`/user/notifications/${id}/read`));

export const markAllNotificationsRead = () =>
  unwrap<any>(api.patch("/user/notifications/read-all"));

export const globalSearch = (q: string) =>
  unwrap<{ categories: Category[]; products: Product[] }>(
    api.get(`/user/search?q=${encodeURIComponent(q)}`),
    { categories: [], products: [] }
  );

// ---------- Categories (public) ----------

export const fetchCategories = () =>
  unwrap<{ categories: Category[]; total?: number }>(
    api.get("/user/categories"),
    { categories: [] }
  );

export const fetchCategoryById = (id: string) =>
  unwrap<Category>(api.get(`/user/categories/${id}`));

// ---------- Products ----------

// Public browse/filter endpoint — works for guests (no login required).
// Supports multiple categories, an open-ended price range, sort and paging.
export const fetchProductsBrowse = (
  opts: {
    categoryIds?: string[];
    materials?: string[];
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const qs = new URLSearchParams();
  if (opts.categoryIds?.length) qs.set("categoryIds", opts.categoryIds.join(","));
  if (opts.materials?.length) qs.set("materials", opts.materials.join(","));
  if (opts.brands?.length) qs.set("brands", opts.brands.join(","));
  if (opts.minPrice != null) qs.set("minPrice", String(opts.minPrice));
  if (opts.maxPrice != null) qs.set("maxPrice", String(opts.maxPrice));
  if (opts.sortBy) qs.set("sortBy", opts.sortBy);
  if (opts.page) qs.set("page", String(opts.page));
  if (opts.limit) qs.set("limit", String(opts.limit));
  const tail = qs.toString() ? `?${qs}` : "";
  return unwrap<{ products: Product[]; total?: number }>(
    api.get(`/user/products/browse${tail}`),
    { products: [] }
  );
};

// ---------- Products (auth required by backend) ----------

export const fetchProductsByCategory = (
  catId: string,
  opts: { sortBy?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number } = {}
) => {
  const qs = new URLSearchParams();
  if (opts.sortBy) qs.set("sortBy", opts.sortBy);
  if (opts.minPrice != null) qs.set("minPrice", String(opts.minPrice));
  if (opts.maxPrice != null) qs.set("maxPrice", String(opts.maxPrice));
  if (opts.page) qs.set("page", String(opts.page));
  if (opts.limit) qs.set("limit", String(opts.limit));
  const tail = qs.toString() ? `?${qs}` : "";
  return unwrap<{ products: Product[]; total?: number }>(
    api.get(`/user/categories/${catId}/products${tail}`),
    { products: [] }
  );
};

export const fetchNewArrivals = () =>
  unwrap<{ products: Product[] }>(api.get("/user/products/new-arrivals"), { products: [] });

export const fetchFeaturedProducts = () =>
  unwrap<{ products: Product[] }>(api.get("/user/products/featured"), { products: [] });

export const fetchProductDetails = (id: string) =>
  unwrap<Product>(api.get(`/user/products/${id}`));

export const fetchProductReviews = (id: string) =>
  unwrap<unknown[]>(api.get(`/user/products/${id}/reviews`), []);

export const searchProducts = (q: string) =>
  unwrap<{ products: Product[] }>(
    api.get(`/user/products/search?q=${encodeURIComponent(q)}`),
    { products: [] }
  );

// ---------- Wishlist (auth required) ----------

export const fetchWishlist = () =>
  unwrap<{ items: Product[] }>(api.get("/user/wishlist"), { items: [] });

export const toggleWishlist = (productId: string) =>
  unwrap(api.post("/user/wishlist/toggle", { productId }));

export const removeFromWishlist = (productId: string) =>
  unwrap(api.delete(`/user/wishlist/${productId}`));

// ---------- Cart (auth required) ----------

export const fetchCart = () =>
  unwrap<{ items: any[]; total?: number }>(api.get("/user/cart"), { items: [] });

export const addToCart = (productId: string, quantity = 1) =>
  unwrap(api.post("/user/cart", { productId, quantity }));

export const removeFromCart = (itemId: string) =>
  unwrap(api.delete(`/user/cart/${itemId}`));

export const updateCartItem = (itemId: string, quantity: number) =>
  unwrap(api.put(`/user/cart/${itemId}`, { quantity }));

// ---------- Auth ----------

// Backend expects { countryCode, mobileNumber } and responds with { txnId }.
// We accept either a plain phone or "+CC <number>" and split it for callers.
export const sendOtp = (mobileNumber: string, countryCode = "+91") =>
  unwrap<{ txnId: string; userRegister: boolean }>(
    api.post("/auth/login", { countryCode, mobileNumber })
  );

export const verifyOtp = (
  mobileNumber: string,
  otp: string,
  txnId: string,
  countryCode = "+91"
) =>
  unwrap<{ token: string; userId: string }>(
    api.post("/auth/verifyOtp", { countryCode, mobileNumber, otp, txnId })
  );

export const resendOtp = (mobileNumber: string, countryCode = "+91") =>
  unwrap<{ txnId: string }>(
    api.put("/auth/resendOtp", { countryCode, mobileNumber })
  );

// ---------- Profile / Address (auth required) ----------

export const fetchProfile = () => unwrap<any>(api.get("/user/profile"));

export const updateProfile = (data: any) => unwrap(api.put("/user/profile", data));

export const deleteAccount = () => unwrap(api.delete("/user/account"));

// Backend exposes this as a GET that flips the user's `notificationAllowed`
// bit. Naming preserved for clarity at call sites.
export const toggleNotificationSwitch = () =>
  unwrap(api.get("/user/notifications/switch"));

export const fetchAddresses = () =>
  unwrap<{ addresses?: any[] } | any[]>(api.get("/user/address"), []);

export const saveAddress = (data: any) => unwrap(api.post("/user/address", data));

// Backwards-compat alias; older callers used addAddress.
export const addAddress = saveAddress;

export const deleteAddress = (id: string) => unwrap(api.delete(`/user/address/${id}`));

// PUT /user/address/:id marks an address as the selected/default one.
export const selectAddress = (id: string) => unwrap(api.put(`/user/address/${id}`, {}));

// ---------- Orders (auth required) ----------

export const fetchOrders = () =>
  unwrap<{ orders: any[] } | any[]>(api.get("/user/orders"), { orders: [] });

export const fetchOrderDetails = (id: string) => unwrap(api.get(`/user/orders/${id}`));

export const cancelOrder = (id: string, reason = "") =>
  unwrap(api.post(`/user/orders/${id}/cancel`, { reason }));

// ---------- Charges (shipping + platform fee rules) ----------

export interface PublicChargesConfig {
  shippingActive: boolean;
  shippingFlat: number;
  freeShippingThreshold: number;
  platformFeeActive: boolean;
  platformFeeFlat: number;
  platformFeePercent: number;
  prepaidDiscountActive: boolean;
  prepaidDiscountPercent: number;
}

export const fetchChargesConfig = () =>
  unwrap<PublicChargesConfig>(api.get("/user/charges"), {
    shippingActive: true,
    shippingFlat: 0,
    freeShippingThreshold: 0,
    platformFeeActive: false,
    platformFeeFlat: 0,
    platformFeePercent: 0,
    prepaidDiscountActive: false,
    prepaidDiscountPercent: 0,
  });

// Mirror of backend math, used as a fallback when we only have a subtotal
// (e.g. guest cart, no server cart doc to read from).
export const computeChargesLocal = (
  subtotal: number,
  couponDiscount: number,
  cfg: PublicChargesConfig,
): { shipping: number; platformFee: number; total: number } => {
  const effective = Math.max(0, subtotal - couponDiscount);
  const shipping = cfg.shippingActive
    ? effective >= (cfg.freeShippingThreshold || 0)
      ? 0
      : Math.round(cfg.shippingFlat || 0)
    : 0;
  const platformFee = cfg.platformFeeActive
    ? Math.round(
        Math.max(cfg.platformFeeFlat || 0, ((cfg.platformFeePercent || 0) * effective) / 100),
      )
    : 0;
  return { shipping, platformFee, total: effective + shipping + platformFee };
};

export const placeOrder = (data: unknown) => unwrap(api.post("/user/orders", data));

export const verifyRazorpayPayment = (data: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => unwrap(api.post("/user/payment/verify", data));

// ---------- Helpers ----------

/**
 * Normalize backend's varying list responses into a plain array.
 * Handles: T[], { products: T[] }, { categories: T[] }, { items: T[] },
 * { offers: T[] }, { banners: T[] }, { addresses: T[] }, { orders: T[] }.
 */
export function asList<T = any>(d: any): T[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return (
    d.products ||
    d.categories ||
    d.items ||
    d.offers ||
    d.banners ||
    d.addresses ||
    d.orders ||
    []
  );
}

/**
 * Normalize an API product (from any endpoint) into the shape ProductCard
 * and the rest of the UI expect.
 */
export function normalizeProduct(p: any): Product {
  if (!p) return p;
  // some endpoints return `image`, others `productImages: [{ url }]`, others `productImage`
  const image =
    p.productImages?.[0]?.url ||
    p.productImage ||
    p.image ||
    p.images?.[0]?.url ||
    "";
  return {
    _id: p._id,
    productName: p.productName || p.name || "",
    productImages: image ? [{ url: image }] : p.productImages,
    productImage: image || undefined,
    // A discountPrice of 0 (or missing) means "no discount" — fall back to the
    // base price. Using ?? here would wrongly treat 0 as the real price (₹0).
    price: Number(
      p.discountPrice && Number(p.discountPrice) > 0 ? p.discountPrice : (p.price ?? 0)
    ),
    discountPrice: p.discountPrice,
    discountPercent: p.discountPercent,
    description: p.description,
    stock: p.stock,
    isNew: p.isNew,
    badge: p.badge,
    // preserve original fields some pages rely on
    ...(p.brand ? { brand: p.brand } : {}),
    ...(p.rating != null ? { rating: p.rating } : {}),
    ...(p.isWishlisted != null ? { isWishlisted: p.isWishlisted } : {}),
    // Forward gold-pricing details so cards/PDP can prefer the live computed
    // price over the static one.
    ...(p.computedPrice != null ? { computedPrice: p.computedPrice } : {}),
    ...(p.goldBreakdown ? { goldBreakdown: p.goldBreakdown } : {}),
    ...(p.goldPricing ? { goldPricing: p.goldPricing } : {}),
  } as unknown as Product;
}

/**
 * Pick the best banner image URL for a desktop site.
 * Backend exposes mobileView / ipadView / desktopView. Falls back across them.
 */
export function bannerImage(b: any): string {
  return b?.desktopView || b?.ipadView || b?.mobileView || b?.image || "";
}
