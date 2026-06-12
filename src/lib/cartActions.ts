import { addToCart, toggleWishlist } from "../services/api";
import { hasToken } from "./authGate";
import { useGuestStore, type GuestProduct } from "../store/guestStore";
import { useUiStore } from "../store";

// MongoDB ObjectId — 24 hex chars. Fallback demo products use short ids like
// "c1", "n1", "t1" which would fail server-side with a CastError. We catch
// that here so the user gets a friendly toast instead of a raw 400.
const isRealProductId = (id: unknown): id is string =>
  typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);

/**
 * Build the lightweight snapshot we cache in localStorage for guests.
 * Accepts whatever flavor of product object we get from the API / fallbacks.
 */
const toGuestProduct = (p: any): GuestProduct => ({
  _id: p._id,
  productName: p.productName || p.name || "",
  productImage:
    p.productImage ||
    p.productImages?.[0]?.url ||
    p.images?.[0]?.url ||
    undefined,
  price: Number(p.price) || 0,
  discountPrice: p.discountPrice != null ? Number(p.discountPrice) : undefined,
  mrp: p.mrp != null ? Number(p.mrp) : undefined,
});

/**
 * Add to cart from any product card / detail page.
 *
 * If logged in, hits the server. Otherwise stores in the local guest cart so
 * the user can keep shopping; merge happens at login.
 */
export const addToCartAction = async (
  product: any,
  quantity = 1,
): Promise<{ ok: boolean; message?: string }> => {
  if (!isRealProductId(product?._id)) {
    return {
      ok: false,
      message:
        "This is a sample product not yet available in the catalog. Please pick another one.",
    };
  }
  if (!hasToken()) {
    useGuestStore.getState().addCart(toGuestProduct(product), quantity);
    return { ok: true };
  }
  const r: any = await addToCart(product._id, quantity);
  if (r?.code === 1) {
    // Refresh the header badge from authoritative server state.
    useUiStore.getState().refreshCounts();
    return { ok: true };
  }
  return { ok: false, message: r?.message };
};

/**
 * Toggle wishlist. Guest mode flips locally; logged-in hits the server.
 */
export const toggleWishlistAction = async (
  product: any,
): Promise<{ ok: boolean; message?: string; wishlisted?: boolean }> => {
  if (!isRealProductId(product?._id)) {
    return {
      ok: false,
      message:
        "This is a sample product not yet available in the catalog. Please pick another one.",
    };
  }
  if (!hasToken()) {
    const before = useGuestStore
      .getState()
      .wishlist.some((p) => p._id === product._id);
    useGuestStore.getState().toggleWish(toGuestProduct(product));
    return { ok: true, wishlisted: !before };
  }

  // Optimistic flip so the heart fills/empties immediately.
  const before = !!useUiStore.getState().wishlistIds[product._id];
  useUiStore.getState().toggleWishlistedLocally(product._id);

  const r: any = await toggleWishlist(product._id);
  if (r?.code === 1) {
    // Reconcile with the authoritative server list. If the server result
    // differs from our optimistic flip we'll get corrected.
    useUiStore.getState().refreshCounts();
    return {
      ok: true,
      // Backend returns `{ isWishlisted: boolean }` on success — prefer that
      // if present, else trust our optimistic toggle.
      wishlisted:
        typeof r?.data?.isWishlisted === "boolean" ? r.data.isWishlisted : !before,
    };
  }

  // Roll back the optimistic flip on failure so the UI stays consistent.
  useUiStore.getState().toggleWishlistedLocally(product._id);
  return { ok: false, message: r?.message };
};
