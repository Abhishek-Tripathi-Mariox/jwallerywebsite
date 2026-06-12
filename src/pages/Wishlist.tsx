import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchWishlist, asList, normalizeProduct } from "../services/api";
import type { Product } from "../types";
import ProductCard from "../components/shared/ProductCard";
import { hasToken } from "../lib/authGate";
import { useGuestStore } from "../store/guestStore";
import { addToCartAction, toggleWishlistAction } from "../lib/cartActions";
import { toast } from "../store/toastStore";

export default function Wishlist() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const guestWishlist = useGuestStore((s) => s.wishlist);

  const load = useCallback(async () => {
    setLoading(true);
    if (!hasToken()) {
      setItems(guestWishlist as unknown as Product[]);
      setLoading(false);
      return;
    }
    const res: any = await fetchWishlist();
    const list = asList<any>(res?.data).map(normalizeProduct);
    setItems(list);
    setLoading(false);
  }, [guestWishlist]);

  useEffect(() => {
    load();
  }, [load]);

  const onAdd = async (p: Product) => {
    const r = await addToCartAction(p, 1);
    if (r.ok) toast.success("Added to cart");
    else toast.error(r.message || "Could not add to cart");
  };

  const onWish = async (p: Product) => {
    const r = await toggleWishlistAction(p);
    if (r.ok) {
      toast.success(r.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    } else {
      toast.error(r.message || "Could not update wishlist");
    }
    load();
  };

  return (
    <div className="container section">
      <h1 className="cart-title">My Wishlist ({items.length})</h1>
      {loading ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <div className="empty">
          Your wishlist is empty.{" "}
          <Link to="/" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-4">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} onAdd={onAdd} onWishlist={onWish} />
          ))}
        </div>
      )}
    </div>
  );
}
