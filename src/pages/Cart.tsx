import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiTrash2, FiTag, FiX } from "react-icons/fi";
import {
  fetchCart,
  removeFromCart,
  updateCartItem,
  fetchChargesConfig,
  computeChargesLocal,
  applyCoupon,
  removeCoupon,
  type PublicChargesConfig,
} from "../services/api";
import { hasToken } from "../lib/authGate";
import { useUiStore } from "../store";
import { useGuestStore } from "../store/guestStore";
import { toast } from "../store/toastStore";
import "./Cart.css";

interface CartItem {
  _id: string;        // line id when from server; productId when guest
  productId?: string; // guest snapshot helper
  quantity: number;
  product?: any;       // populated for guest items only — the server never
                        // populates this on logged-in carts (see itemPrice)
  productName?: string;
  price?: number;
  unitPrice?: number;      // server items: original price, snapshotted at add-time
  discountPrice?: number;  // server items: discounted price, snapshotted at add-time
  image?: string;
}

// Server (logged-in) cart items carry price flat on the item (unitPrice /
// discountPrice); guest items carry it nested under `product` instead
// (GuestProduct, see guestStore.ts). Check both shapes, discounted first.
const itemPrice = (it: CartItem) =>
  it.discountPrice ||
  it.product?.computedPrice ||
  it.product?.discountPrice ||
  it.unitPrice ||
  it.product?.price ||
  0;

const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverShipping, setServerShipping] = useState<number | null>(null);
  const [serverPlatformFee, setServerPlatformFee] = useState<number | null>(null);
  const [serverGst, setServerGst] = useState<number | null>(null);
  const [chargesCfg, setChargesCfg] = useState<PublicChargesConfig | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

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
      setServerGst(null);
      setAppliedCoupon(null);
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
    setServerGst(typeof data.gstAmount === "number" ? data.gstAmount : null);
    setAppliedCoupon(
      data.couponCode && data.couponDiscount > 0
        ? { code: data.couponCode, discount: data.couponDiscount }
        : null
    );
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
    return s + itemPrice(it) * (it.quantity || 1);
  }, 0);

  // Logged-in users trust the server breakdown; guests get a local estimate
  // built from the public charges config (synced with the same backend math).
  const localCharges =
    chargesCfg ? computeChargesLocal(subtotal, 0, chargesCfg) : { shipping: 0, platformFee: 0, gst: 0, total: subtotal };
  const shipping = serverShipping ?? localCharges.shipping;
  const platformFee = serverPlatformFee ?? localCharges.platformFee;
  const gst = serverGst ?? localCharges.gst;
  const couponDiscount = appliedCoupon?.discount || 0;
  const total = subtotal + shipping + platformFee + gst - couponDiscount;

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

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    try {
      const res: any = await applyCoupon(code);
      if (res?.code === 1) {
        toast.success(`Coupon "${res.data.coupon.code}" applied`);
        setCouponInput("");
        await load();
      } else {
        toast.error(res?.message || "Could not apply coupon");
      }
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponBusy(true);
    try {
      await removeCoupon();
      await load();
    } finally {
      setCouponBusy(false);
    }
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
              const price = itemPrice(it);
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

            {hasToken() && (
              <div className="cart-coupon">
                {appliedCoupon ? (
                  <div className="cart-coupon-applied">
                    <span>
                      <FiTag /> <strong>{appliedCoupon.code}</strong> applied
                    </span>
                    <button
                      type="button"
                      className="cart-coupon-remove"
                      onClick={handleRemoveCoupon}
                      disabled={couponBusy}
                      aria-label="Remove coupon"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <div className="cart-coupon-input">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      disabled={couponBusy}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleApplyCoupon}
                      disabled={couponBusy || !couponInput.trim()}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}

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
            {gst > 0 && (
              <div className="sum-row">
                <span>GST</span>
                <strong>{fmt(gst)}</strong>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="sum-row">
                <span>Coupon discount ({appliedCoupon?.code})</span>
                <strong className="free">− {fmt(couponDiscount)}</strong>
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
