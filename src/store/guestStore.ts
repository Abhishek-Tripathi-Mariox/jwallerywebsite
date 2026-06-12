import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addToCart, toggleWishlist } from "../services/api";

/**
 * Lightweight product snapshot we keep in localStorage for guests.
 * Enough to render cart/wishlist without re-fetching the product, while still
 * pinning the canonical _id so the server can adopt the item on login.
 */
export interface GuestProduct {
  _id: string;
  productName: string;
  productImage?: string;
  price: number;
  discountPrice?: number;
  mrp?: number;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
  product: GuestProduct;
}

interface GuestState {
  cart: GuestCartItem[];
  wishlist: GuestProduct[];

  // counts (derived; kept eagerly to keep header reads cheap)
  cartCount: number;
  wishlistCount: number;

  addCart: (product: GuestProduct, quantity?: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeCart: (productId: string) => void;

  toggleWish: (product: GuestProduct) => void;
  removeWish: (productId: string) => void;

  clearGuest: () => void;
  mergeIntoServer: () => Promise<void>;
}

const recount = (s: Pick<GuestState, "cart" | "wishlist">) => ({
  cartCount: s.cart.reduce((n, it) => n + (it.quantity || 1), 0),
  wishlistCount: s.wishlist.length,
});

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      cartCount: 0,
      wishlistCount: 0,

      addCart: (product, quantity = 1) => {
        const cart = [...get().cart];
        const idx = cart.findIndex((it) => it.productId === product._id);
        if (idx >= 0) {
          cart[idx] = { ...cart[idx], quantity: cart[idx].quantity + quantity };
        } else {
          cart.push({ productId: product._id, quantity, product });
        }
        set({ cart, ...recount({ cart, wishlist: get().wishlist }) });
      },

      updateCartQty: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeCart(productId);
          return;
        }
        const cart = get().cart.map((it) =>
          it.productId === productId ? { ...it, quantity } : it,
        );
        set({ cart, ...recount({ cart, wishlist: get().wishlist }) });
      },

      removeCart: (productId) => {
        const cart = get().cart.filter((it) => it.productId !== productId);
        set({ cart, ...recount({ cart, wishlist: get().wishlist }) });
      },

      toggleWish: (product) => {
        const wishlist = [...get().wishlist];
        const idx = wishlist.findIndex((p) => p._id === product._id);
        if (idx >= 0) wishlist.splice(idx, 1);
        else wishlist.push(product);
        set({ wishlist, ...recount({ cart: get().cart, wishlist }) });
      },

      removeWish: (productId) => {
        const wishlist = get().wishlist.filter((p) => p._id !== productId);
        set({ wishlist, ...recount({ cart: get().cart, wishlist }) });
      },

      clearGuest: () =>
        set({ cart: [], wishlist: [], cartCount: 0, wishlistCount: 0 }),

      mergeIntoServer: async () => {
        const { cart, wishlist } = get();
        // Push cart items first so the server has them before checkout
        for (const it of cart) {
          try {
            await addToCart(it.productId, it.quantity);
          } catch (e) {
            console.warn("guest cart merge failed for", it.productId, e);
          }
        }
        for (const p of wishlist) {
          try {
            await toggleWishlist(p._id);
          } catch (e) {
            console.warn("guest wishlist merge failed for", p._id, e);
          }
        }
        // Clear local once merged
        set({ cart: [], wishlist: [], cartCount: 0, wishlistCount: 0 });
      },
    }),
    {
      name: "swarnaz-guest",
      storage: createJSONStorage(() => localStorage),
      // Don't persist derived counts; recompute on hydrate.
      partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist }),
      onRehydrateStorage: () => (state) => {
        if (state) Object.assign(state, recount(state));
      },
    },
  ),
);

/** Convenience selector hooks */
export const useGuestCartCount = () =>
  useGuestStore((s) => s.cartCount);
export const useGuestWishlistCount = () =>
  useGuestStore((s) => s.wishlistCount);

/** True if the given productId is currently in the guest wishlist. */
export const useIsGuestWishlisted = (productId?: string) =>
  useGuestStore((s) =>
    productId ? s.wishlist.some((p) => p._id === productId) : false,
  );
