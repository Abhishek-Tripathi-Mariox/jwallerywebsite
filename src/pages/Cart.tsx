import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import {
  fetchCart,
  removeFromCart,
  updateCartItem,
  fetchChargesConfig,
  computeChargesLocal,
  type PublicChargesConfig,
} from "../services/api";
import { hasToken } from "../lib/authGate";
import { useUiStore } from "../store";
import { useGuestStore } from "../store/guestStore";
import "./Cart.css";

interface CartItem {
  _id: string;        // line id when from server; productId when guest
  productId?: string; // guest snapshot helper
  quantity: number;
  product?: any;
  productName?: string;
  price?: number;
  image?: string;
}

const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverShipping, setServerShipping] = useState<number | null>(null);
  const [serverPlatformFee, setServerPlatformFee] = useState<number | null>(null);
  const [chargesCfg, setChargesCfg] = useState<PublicChargesConfig | null>(null);

  const setCartCount = useUiStore((s) => s.setCartCount);
  const guestCart = useGuestStore((s) => s.cart);
  const updateGuestQty = useGuestStore((s) => s.updateCartQty);
  const removeGuest = useGuestStore((s) => s.removeCart);

  const load = useCallback(async () => {
    setLoading(true);
    if (!hasToken()) {
      const guestItems: CartItem[] = guestCart.map((it) => ({
        _id: it.productId,
        productId: it.productId,
        quantity: it.quantity,
        product: it.product,
      }));
      setItems(guestItems);
      setServerShipping(null);
      setServerPlatformFee(null);
      const cfgRes = await fetchChargesConfig();
      setChargesCfg(cfgRes?.data || null);
      setLoading(false);
      return;
    }
    const res: any = await fetchCart();
    const data = res?.data || {};
    setItems(data.items || []);
    setServerShipping(typeof data.shippingCost === "number" ? data.shippingCost : null);
    setServerPlatformFee(typeof data.platformFee === "number" ? data.platformFee : null);
    // We still fetch config so we can show the "free shipping above ₹X" hint.
    const cfgRes = await fetchChargesConfig();
    setChargesCfg(cfgRes?.data || null);
    setLoading(false);
  }, [guestCart]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCartCount(items.reduce((n, it) => n + (it.quantity || 1), 0));
  }, [items, setCartCount]);

  const subtotal = items.reduce((s, it) => {
    const p = it.product?.discountPrice || it.product?.price || it.price || 0;
    return s + p * (it.quantity || 1);
  }, 0);

  // Logged-in users trust the server breakdown; guests get a local estimate
  // built from the public charges config (synced with the same backend math).
  const localCharges =
    chargesCfg ? computeChargesLocal(subtotal, 0, chargesCfg) : { shipping: 0, platformFee: 0, total: subtotal };
  const shipping = serverShipping ?? localCharges.shipping;
  const platformFee = serverPlatformFee ?? localCharges.platformFee;
  const total = subtotal + shipping + platformFee;

  const showFreeShippingNudge =
    chargesCfg?.shippingActive &&
    chargesCfg.shippingFlat > 0 &&
    chargesCfg.freeShippingThreshold > 0 &&
    subtotal > 0 &&
    subtotal < chargesCfg.freeShippingThreshold;
  const freeShippingRemaining = showFreeShippingNudge
    ? Math.max(0, (chargesCfg!.freeShippingThreshold || 0) - subtotal)
    : 0;

  const refreshCounts = useUiStore((s) => s.refreshCounts);

  const change = async (it: CartItem, qty: number) => {
    const next = Math.max(1, qty);
    if (!hasToken()) {
      updateGuestQty(it.productId || it._id, next);
      return;
    }
    await updateCartItem(it._id, next);
    await load();
    refreshCounts();
  };

  const remove = async (it: CartItem) => {
    if (!hasToken()) {
      removeGuest(it.productId || it._id);
      return;
    }
    await removeFromCart(it._id);
    await load();
    refreshCounts();
  };

  const proceedToCheckout = async () => {
    if (!hasToken()) {
      // Send guest cart along after login completes
      navigate("/login?next=/checkout");
      return;
    }
    navigate("/checkout");
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="container cart-page">
      <h1 className="cart-title">Shopping Cart ({items.length})</h1>

      {items.length === 0 ? (
        <div className="empty">
          Your cart is empty.{" "}
          <Link to="/" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {items.map((it) => {
              const prod = it.product || it;
              const img = prod?.productImages?.[0]?.url || prod?.productImage || it.image;
              const price = prod?.discountPrice || prod?.price || it.price || 0;
              return (
                <div key={it._id} className="cart-item card">
                  <div className="cart-item-img">
                    {img ? <img src={img} alt={prod?.productName} /> : <div className="img-ph" />}
                  </div>
                  <div className="cart-item-body">
                    <h4>{prod?.productName || it.productName}</h4>
                    <div className="cart-item-price">{fmt(price)}</div>
                    <div className="cart-item-actions">
                      <div className="qty-stepper">
                        <button onClick={() => change(it, (it.quantity || 1) - 1)}>−</button>
                        <span>{it.quantity}</span>
                        <button onClick={() => change(it, (it.quantity || 1) + 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => remove(it)}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="cart-summary card">
            <h3>Order Summary</h3>
            <div className="sum-row">
              <span>Subtotal</span>
              <strong>{fmt(subtotal)}</strong>
            </div>
            <div className="sum-row">
              <span>Shipping</span>
              {shipping === 0 ? (
                <strong className="free">FREE</strong>
              ) : (
                <strong>{fmt(shipping)}</strong>
              )}
            </div>
            {platformFee > 0 && (
              <div className="sum-row">
                <span>Platform fee</span>
                <strong>{fmt(platformFee)}</strong>
              </div>
            )}
            {showFreeShippingNudge && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "#7a5b00",
                  background: "#fff8e1",
                  border: "1px solid #f4d97a",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                Add {fmt(freeShippingRemaining)} more to get FREE shipping.
              </p>
            )}
            <div className="sum-divider" />
            <div className="sum-row total">
              <span>Total</span>
              <strong>{fmt(total)}</strong>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={proceedToCheckout}
            >
              Proceed to Checkout
            </button>
            <button
              className="btn btn-outline-primary"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </button>
            {!hasToken() && (
              <p
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                You'll be asked to sign in before payment.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
