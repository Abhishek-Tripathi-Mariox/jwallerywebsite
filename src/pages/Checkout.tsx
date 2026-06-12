import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCreditCard, FiMapPin, FiTruck, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  fetchCart,
  fetchAddresses,
  saveAddress,
  deleteAddress,
  selectAddress,
  placeOrder,
  fetchChargesConfig,
  type PublicChargesConfig,
} from "../services/api";
import { hasToken } from "../lib/authGate";
import AddressModal, { type AddressFormValues } from "../components/shared/AddressModal";
import { toast } from "../store/toastStore";
import "./Checkout.css";

const PAYMENT_METHODS = [
  { id: "cod", title: "Cash on Delivery", subtitle: "Pay when you receive" },
  { id: "card", title: "Credit/Debit Card", subtitle: "Visa, Mastercard, RuPay" },
  { id: "upi", title: "UPI", subtitle: "Google Pay, PhonePe, Paytm" },
];

const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

// Map UI payment choice to the backend's two known modes.
// COD stays cod; everything else uses Razorpay (online).
const toBackendPaymentMode = (id: string) => (id === "cod" ? "cod" : "online");

const formatAddressLine = (a: any): string =>
  [a.houseNo, a.apartment, a.address, a.city, a.state, a.pinCode || a.pincode]
    .filter((v) => v != null && String(v).trim() !== "")
    .join(", ");

export default function Checkout() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payment, setPayment] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [charges, setCharges] = useState<PublicChargesConfig | null>(null);

  const [showAddrModal, setShowAddrModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddrList, setShowAddrList] = useState(false);

  const loadAddresses = useCallback(async (preferId?: string) => {
    const addrRes: any = await fetchAddresses();
    const raw = addrRes?.data?.UserAddress || addrRes?.data?.addresses || addrRes?.data || [];
    const list: any[] = Array.isArray(raw) ? raw : [];
    setAddresses(list);
    if (list.length > 0) {
      const next =
        (preferId && list.find((a) => a._id === preferId)) ||
        list.find((a) => a.isSelected) ||
        list.find((a) => a.isDefault) ||
        list[0];
      setSelectedId(next?._id || null);
    } else {
      setSelectedId(null);
    }
  }, []);

  useEffect(() => {
    if (!hasToken()) {
      navigate("/login?next=/checkout", { replace: true });
      return;
    }
    (async () => {
      const [cartRes, chargesRes]: any = await Promise.all([
        fetchCart(),
        fetchChargesConfig(),
      ]);
      const data = cartRes?.data || {};
      setItems(data.items || []);
      setShippingCost(Number(data.shippingCost) || 0);
      setPlatformFee(Number(data.platformFee) || 0);
      if (chargesRes?.data) setCharges(chargesRes.data);
      await loadAddresses();
    })();
  }, [navigate, loadAddresses]);

  const selected = addresses.find((a) => a._id === selectedId) || null;

  const subtotal = items.reduce((s, it) => {
    const p = it.product?.discountPrice || it.product?.price || it.unitPrice || 0;
    return s + p * (it.quantity || 1);
  }, 0);
  // Prepaid (online) orders get an automatic, admin-configured % discount.
  const isPrepaid = payment !== "cod";
  const prepaidPercent =
    charges?.prepaidDiscountActive ? Number(charges.prepaidDiscountPercent) || 0 : 0;
  const prepaidDiscount =
    isPrepaid && prepaidPercent > 0 ? Math.round((subtotal * prepaidPercent) / 100) : 0;
  const total = subtotal + shippingCost + platformFee - prepaidDiscount;

  const handlePlaceOrder = async () => {
    if (!selectedId) {
      toast.warning("Please select a delivery address");
      return;
    }
    if (items.length === 0) {
      toast.warning("Your cart is empty");
      navigate("/cart");
      return;
    }
    setPlacing(true);
    const r: any = await placeOrder({
      addressId: selectedId,
      paymentMode: toBackendPaymentMode(payment),
    });
    setPlacing(false);
    if (r?.code === 1) {
      // Online flow returns a razorpay payload here; we don't have a payment UI
      // yet so just show a placeholder. COD goes straight to confirmed.
      if (r?.data?.razorpay) {
        toast.info(
          "Online payment isn't wired up on the website yet. Pick Cash on Delivery for now.",
          6000,
        );
        return;
      }
      toast.success("Order placed successfully!");
      navigate("/orders");
    } else {
      toast.error(r?.message || "Failed to place order");
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setShowAddrModal(true);
  };

  const openEdit = (a: any) => {
    setEditingId(a._id);
    setShowAddrModal(true);
  };

  const editingInitialValues = (() => {
    if (!editingId) return undefined;
    const a = addresses.find((x) => x._id === editingId);
    if (!a) return undefined;
    const v: Partial<AddressFormValues> = {
      fullName: a.fullName || "",
      email: a.email || "",
      pincode: String(a.pinCode || a.pincode || ""),
      city: a.city || "",
      state: a.state || "",
      houseNo: a.houseNo || "",
      apartment: a.apartment || "",
      addressType: (a.addressType || a.type || "Home") as "Home" | "Work",
    };
    return v;
  })();

  const handleSaveAddress = async (data: AddressFormValues) => {
    const body: any = {
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      pinCode: parseInt(data.pincode, 10) || 0,
      houseNo: data.houseNo.trim(),
      apartment: data.apartment.trim(),
      address: [data.houseNo, data.apartment, data.city, data.state]
        .filter(Boolean)
        .map((s) => s.trim())
        .join(", "),
      addressType: data.addressType,
    };
    if (editingId) body.addressId = editingId;

    const r: any = await saveAddress(body);
    if (r?.code !== 1) {
      toast.error(r?.message || "Could not save address");
      return;
    }
    toast.success(editingId ? "Address updated" : "Address added");
    setShowAddrModal(false);
    setEditingId(null);
    await loadAddresses(r?.data?._id);
  };

  const handleDelete = async (a: any) => {
    if (!confirm("Delete this address?")) return;
    const r: any = await deleteAddress(a._id);
    if (r?.code !== 1) {
      toast.error(r?.message || "Could not delete address");
      return;
    }
    toast.success("Address removed");
    await loadAddresses();
  };

  const handleSelect = async (a: any) => {
    setSelectedId(a._id);
    setShowAddrList(false);
    // Persist the choice so other surfaces (orders, mobile app) see it as default.
    selectAddress(a._id).catch(() => {
      /* ignore — UI state is already updated */
    });
  };

  return (
    <div className="container checkout">
      <button className="back-link" onClick={() => navigate("/cart")}>
        <FiArrowLeft /> Back to Cart
      </button>

      <h1 className="cart-title" style={{ marginBottom: 32 }}>Checkout</h1>

      <div className="checkout-grid">
        <div className="checkout-main">
          <div className="card panel">
            <div className="panel-header">
              <h3><FiMapPin /> Delivery Address</h3>
              {addresses.length > 0 && (
                <button
                  className="link-action"
                  onClick={() => setShowAddrList((v) => !v)}
                >
                  {showAddrList ? "Done" : "Change"}
                </button>
              )}
            </div>

            {addresses.length === 0 ? (
              <div className="empty-addr">
                <p>No saved addresses yet.</p>
                <button className="btn btn-outline-primary" onClick={openAdd}>
                  <FiPlus /> Add Address
                </button>
              </div>
            ) : showAddrList ? (
              <div className="addr-list">
                {addresses.map((a) => {
                  const isSel = a._id === selectedId;
                  return (
                    <div
                      key={a._id}
                      className={`addr-list-item ${isSel ? "selected" : ""}`}
                    >
                      <button
                        type="button"
                        className="addr-list-pick"
                        onClick={() => handleSelect(a)}
                      >
                        <span className={`addr-radio ${isSel ? "active" : ""}`} />
                        <span className="addr-list-text">
                          <strong>
                            {a.fullName ? `${a.fullName}` : "Address"}
                            {a.addressType ? ` · ${a.addressType}` : ""}
                          </strong>
                          <span>{formatAddressLine(a)}</span>
                          {a.email && <span className="muted">{a.email}</span>}
                        </span>
                      </button>
                      <div className="addr-list-actions">
                        <button
                          type="button"
                          className="icon-action"
                          onClick={() => openEdit(a)}
                          aria-label="Edit"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className="icon-action danger"
                          onClick={() => handleDelete(a)}
                          aria-label="Delete"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button className="btn btn-outline-primary add-addr-btn" onClick={openAdd}>
                  <FiPlus /> Add Address
                </button>
              </div>
            ) : (
              <div className="address-card">
                <strong>
                  {selected?.fullName || "Address"}
                  {selected?.addressType ? ` · ${selected.addressType}` : ""}
                </strong>
                <span>{selected ? formatAddressLine(selected) : ""}</span>
                {selected?.email && <span className="muted">{selected.email}</span>}
              </div>
            )}
          </div>

          <div className="card panel">
            <div className="panel-header">
              <h3><FiCreditCard /> Payment Method</h3>
            </div>
            <div className="payment-options">
              {PAYMENT_METHODS.map((pm) => (
                <label key={pm.id} className={`payment-option ${payment === pm.id ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={payment === pm.id}
                    onChange={() => setPayment(pm.id)}
                  />
                  <div>
                    <strong>{pm.title}</strong>
                    <span>{pm.subtitle}</span>
                  </div>
                </label>
              ))}
            </div>
            {prepaidPercent > 0 && (
              <p className="hint" style={{ marginTop: 10 }}>
                💸 Pay online (prepaid) and get an extra {prepaidPercent}% off your order.
              </p>
            )}
          </div>
        </div>

        <aside className="card checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {items.map((it) => {
              const prod = it.product || {};
              const img = prod.productImages?.[0]?.url || it.productImage;
              const price = prod.discountPrice || prod.price || it.unitPrice || 0;
              return (
                <div key={it._id} className="summary-item">
                  <div className="summary-item-img">
                    {img && <img src={img} alt={prod.productName || it.productName} />}
                  </div>
                  <div className="summary-item-body">
                    <strong>{prod.productName || it.productName}</strong>
                    <span>Qty: {it.quantity}</span>
                  </div>
                  <div className="summary-item-price">{fmt(price * it.quantity)}</div>
                </div>
              );
            })}
          </div>

          <div className="sum-divider" />
          <div className="sum-row">
            <span>Subtotal</span>
            <strong>{fmt(subtotal)}</strong>
          </div>
          <div className="sum-row">
            <span>Shipping</span>
            {shippingCost === 0 ? (
              <strong className="free">FREE</strong>
            ) : (
              <strong>{fmt(shippingCost)}</strong>
            )}
          </div>
          {platformFee > 0 && (
            <div className="sum-row">
              <span>Platform fee</span>
              <strong>{fmt(platformFee)}</strong>
            </div>
          )}
          {prepaidDiscount > 0 && (
            <div className="sum-row">
              <span>Prepaid discount ({prepaidPercent}%)</span>
              <strong className="free">- {fmt(prepaidDiscount)}</strong>
            </div>
          )}
          <div className="sum-divider" />
          <div className="sum-row total">
            <span>Total</span>
            <strong>{fmt(total)}</strong>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 20 }}
            onClick={handlePlaceOrder}
            disabled={placing || !selectedId}
          >
            <FiTruck /> {placing ? "Placing..." : "Place Order"}
          </button>
          {!selectedId && addresses.length === 0 && (
            <p className="hint">Add a delivery address to continue.</p>
          )}
        </aside>
      </div>

      <AddressModal
        open={showAddrModal}
        initialValues={editingInitialValues}
        onClose={() => {
          setShowAddrModal(false);
          setEditingId(null);
        }}
        onSave={handleSaveAddress}
      />
    </div>
  );
}
