import { create } from "zustand";
import { fetchCart, fetchWishlist, asList } from "../services/api";

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("userToken"),
  user: JSON.parse(localStorage.getItem("userInfo") || "null"),
  setAuth: (token, user) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("userInfo", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    set({ token: null, user: null });
  },
}));

interface UiState {
  cartCount: number;
  wishlistCount: number;
  /**
   * Set of productIds the user has wishlisted on the server. Used by
   * ProductCard etc. to fill/empty the heart icon. We use a plain object
   * keyed by id (zustand handles structural equality fine, and Set is
   * harder to memoize cheaply in selectors).
   */
  wishlistIds: Record<string, true>;
  refreshing: boolean;
  setCartCount: (n: number) => void;
  setWishlistCount: (n: number) => void;
  /**
   * Optimistic toggle for a single product. The action helper calls this on
   * the logged-in path so the heart flips instantly, then `refreshCounts`
   * reconciles with the authoritative server list.
   */
  toggleWishlistedLocally: (productId: string) => void;
  /**
   * Pull live cart + wishlist counts from the server. No-op when the user is
   * logged out (the guest store keeps its own counts locally).
   *
   * Guarded against concurrent invocations so multiple call sites firing in
   * the same tick collapse into one network round-trip.
   */
  refreshCounts: () => Promise<void>;
}

const extractProductIds = (data: any): string[] => {
  const list: any[] = asList<any>(data);
  return list
    .map((w) =>
      typeof w.productId === "string"
        ? w.productId
        : w.productId?._id
        ? String(w.productId._id)
        : w.product?._id
        ? String(w.product._id)
        : w._id
        ? String(w._id)
        : null,
    )
    .filter((x): x is string => !!x);
};

export const useUiStore = create<UiState>((set, get) => ({
  cartCount: 0,
  wishlistCount: 0,
  wishlistIds: {},
  refreshing: false,
  setCartCount: (n) => set({ cartCount: n }),
  setWishlistCount: (n) => set({ wishlistCount: n }),
  toggleWishlistedLocally: (productId) =>
    set((s) => {
      const next = { ...s.wishlistIds };
      if (next[productId]) {
        delete next[productId];
        return {
          wishlistIds: next,
          wishlistCount: Math.max(0, s.wishlistCount - 1),
        };
      }
      next[productId] = true;
      return {
        wishlistIds: next,
        wishlistCount: s.wishlistCount + 1,
      };
    }),
  refreshCounts: async () => {
    if (get().refreshing) return;
    const token = localStorage.getItem("userToken");
    if (!token) {
      set({ cartCount: 0, wishlistCount: 0, wishlistIds: {} });
      return;
    }
    set({ refreshing: true });
    try {
      const [c, w] = await Promise.all([fetchCart(), fetchWishlist()]);
      const cartItems = (c as any)?.data?.items;
      const cartCount = Array.isArray(cartItems)
        ? cartItems.reduce((n: number, it: any) => n + (it.quantity || 1), 0)
        : asList<any>((c as any)?.data).length;
      const wishlistData = (w as any)?.data;
      const ids = extractProductIds(wishlistData);
      const wishlistIds: Record<string, true> = {};
      for (const id of ids) wishlistIds[id] = true;
      set({
        cartCount,
        wishlistCount: ids.length,
        wishlistIds,
      });
    } finally {
      set({ refreshing: false });
    }
  },
}));
