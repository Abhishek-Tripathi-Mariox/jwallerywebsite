import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPackage,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { fetchOrderDetails, cancelOrder } from "../services/api";
import { hasToken } from "../lib/authGate";
import { toast } from "../store/toastStore";
import "./OrderDetail.css";

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_FLOW = [
  { n: 1, label: "Order Placed", icon: FiCheckCircle },
  { n: 2, label: "Processing", icon: FiPackage },
  { n: 3, label: "Shipped", icon: FiTruck },
  { n: 4, label: "Delivered", icon: FiCheckCircle },
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await fetchOrderDetails(id);
      if (res?.code === 1 && res?.data) {
        setOrder(res.data);
      } else {
        setError(res?.message || "Order not found");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!hasToken()) {
      navigate(`/login?next=/orders/${id}`, { replace: true });
      return;
    }
    load();
  }, [id, navigate, load]);

  const handleCancel = async () => {
    if (!order || !id) return;
    const reason = window.prompt("Reason for cancellation (optional):") ?? "";
    if (reason === null) return;
    setCancelling(true);
    try {
      const res: any = await cancelOrder(id, reason);
      if (res?.code !== 1) {
        toast.error(res?.message || "Could not cancel order");
        return;
      }
      toast.success("Order cancelled");
      await load();
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container order-detail">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container order-detail">
        <button className="back-link" onClick={() => navigate("/orders")}>
          <FiArrowLeft /> Back to Orders
        </button>
        <div className="empty">{error || "Order not found"}</div>
      </div>
    );
  }

  const numericStatus: number =
    typeof order.status === "number"
      ? order.status
      : Number(order.status) || 1;
  const isCancelled = numericStatus === 5;
  const canCancel = !isCancelled && numericStatus < 4;
  const addr = order.addressId || order.address || {};
  const products: any[] = order.products || order.items || [];

  return (
    <div className="container order-detail">
      <button className="back-link" onClick={() => navigate("/orders")}>
        <FiArrowLeft /> Back to Orders
      </button>

      <div className="od-header">
        <div>
          <h1 className="od-title">Order #{order.orderId || String(order._id).slice(-6).toUpperCase()}</h1>
          <p className="od-meta">
            Placed on{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })
              : ""}
          </p>
        </div>
        {canCancel && (
          <button
            className="btn btn-outline-primary"
            onClick={handleCancel}
            disabled={cancelling}
          >
            <FiX /> {cancelling ? "Cancelling..." : "Cancel order"}
          </button>
        )}
      </div>

      {/* Status tracker */}
      <div className="card panel">
        <h3>Order Status</h3>
        {isCancelled ? (
          <div className="od-cancelled">
            <FiX /> This order was cancelled
            {order.cancelReason ? ` — ${order.cancelReason}` : ""}.
          </div>
        ) : (
          <div className="od-tracker">
            {STATUS_FLOW.map((s, i) => {
              const reached = numericStatus >= s.n;
              const current = numericStatus === s.n;
              const Icon = s.icon;
              return (
                <div
                  key={s.n}
                  className={`od-track-step ${reached ? "reached" : ""} ${current ? "current" : ""}`}
                >
                  <span className="od-track-dot">
                    <Icon />
                  </span>
                  <span className="od-track-label">{s.label}</span>
                  {i < STATUS_FLOW.length - 1 && (
                    <span className={`od-track-bar ${numericStatus > s.n ? "filled" : ""}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card panel">
        <h3>Items</h3>
        <div className="od-items">
          {products.map((p: any, idx: number) => {
            const img = p.productImage || p.product?.productImages?.[0]?.url;
            const name = p.productName || p.product?.productName || "Item";
            const qty = p.quantity || 1;
            const price = p.unitPrice || p.price || 0;
            const line = p.totalPrice || price * qty;
            return (
              <div key={p._id || idx} className="od-item">
                <div className="od-item-img">
                  {img ? <img src={img} alt={name} /> : <div className="img-ph" />}
                </div>
                <div className="od-item-body">
                  <strong>{name}</strong>
                  <span>Qty: {qty}</span>
                  {price > 0 && <span>{fmt(price)} each</span>}
                </div>
                <div className="od-item-price">{fmt(line)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="od-grid">
        {/* Delivery address */}
        <div className="card panel">
          <h3><FiMapPin /> Delivery Address</h3>
          <div className="address-card">
            <strong>
              {addr.fullName || "Address"}
              {addr.addressType ? ` · ${addr.addressType}` : ""}
            </strong>
            <span>
              {[addr.houseNo, addr.apartment, addr.address, addr.city, addr.state, addr.pinCode || addr.pincode]
                .filter((v) => v != null && String(v).trim() !== "")
                .join(", ")}
            </span>
            {addr.email && <span className="muted">{addr.email}</span>}
            {addr.phone && <span className="muted">{addr.phone}</span>}
          </div>
        </div>

        {/* Payment summary */}
        <div className="card panel">
          <h3>Payment Summary</h3>
          <div className="sum-row">
            <span>Subtotal</span>
            <strong>{fmt(order.subtotal)}</strong>
          </div>
          <div className="sum-row">
            <span>Shipping</span>
            <strong>{order.shippingCost ? fmt(order.shippingCost) : "FREE"}</strong>
          </div>
          {order.platformFee > 0 && (
            <div className="sum-row">
              <span>Platform fee</span>
              <strong>{fmt(order.platformFee)}</strong>
            </div>
          )}
          {order.couponDiscount > 0 && (
            <div className="sum-row">
              <span>Coupon discount</span>
              <strong>− {fmt(order.couponDiscount)}</strong>
            </div>
          )}
          <div className="sum-divider" />
          <div className="sum-row total">
            <span>Total</span>
            <strong>{fmt(order.grandTotal)}</strong>
          </div>
          <div className="od-payment-mode">
            Paid via{" "}
            <strong>
              {order.paymentMode === "cod"
                ? "Cash on Delivery"
                : (order.paymentMode || "online").toUpperCase()}
            </strong>
            {order.paymentStatus && (
              <span className={`od-pay-badge ${order.paymentStatus}`}>
                {order.paymentStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      <Link to="/orders" className="link-action od-bottom-link">
        ← Back to all orders
      </Link>
    </div>
  );
}
