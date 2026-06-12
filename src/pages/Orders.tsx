import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiTruck, FiClock, FiSearch, FiX } from "react-icons/fi";
import { fetchOrders, asList } from "../services/api";
import { hasToken } from "../lib/authGate";
import "./Orders.css";

interface Order {
  _id: string;
  orderId?: string;
  createdAt?: string;
  createdAtMs?: number;
  status?: string;
  itemCount?: number;
  totalAmount?: number;
  thumbnail?: string;
  items?: any[];
}

const STATUS_META: Record<string, { label: string; icon: any; color: string }> = {
  delivered: { label: "Delivered", icon: FiCheckCircle, color: "var(--color-success)" },
  in_transit: { label: "In Transit", icon: FiTruck, color: "var(--color-info)" },
  shipped: { label: "Shipped", icon: FiTruck, color: "var(--color-info)" },
  processing: { label: "Processing", icon: FiClock, color: "var(--color-warning)" },
  pending: { label: "Pending", icon: FiClock, color: "var(--color-warning)" },
  cancelled: { label: "Cancelled", icon: FiClock, color: "var(--color-danger)" },
};

const STATUS_FILTERS: { key: string; label: string; matches: string[] }[] = [
  { key: "all", label: "All", matches: [] },
  { key: "pending", label: "Pending", matches: ["pending"] },
  { key: "processing", label: "Processing", matches: ["processing"] },
  { key: "in_transit", label: "Shipped", matches: ["in_transit", "shipped"] },
  { key: "delivered", label: "Delivered", matches: ["delivered"] },
  { key: "cancelled", label: "Cancelled", matches: ["cancelled"] },
];

type DateKey = "all" | "30d" | "90d" | "year";
const DATE_FILTERS: { key: DateKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "year", label: "This year" },
];

const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

const dateLowerBound = (key: DateKey): number => {
  const now = new Date();
  if (key === "30d") return now.getTime() - 30 * 24 * 3600 * 1000;
  if (key === "90d") return now.getTime() - 90 * 24 * 3600 * 1000;
  if (key === "year") return new Date(now.getFullYear(), 0, 1).getTime();
  return 0;
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateKey>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!hasToken()) {
      navigate("/login?next=/orders", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res: any = await fetchOrders();
        if (cancelled) return;
        const list = asList<any>(res?.data);
        setOrders(
          list.map((o: any) => {
            const numeric = typeof o.status === "number" ? o.status : null;
            const statusStr =
              numeric === 4
                ? "delivered"
                : numeric === 3
                ? "in_transit"
                : numeric === 2
                ? "processing"
                : numeric === 1
                ? "pending"
                : numeric === 5
                ? "cancelled"
                : typeof o.status === "string"
                ? o.status.toLowerCase()
                : "pending";

            const items = o.products || o.items || [];
            const firstImg =
              items[0]?.productImage ||
              items[0]?.product?.productImages?.[0]?.url ||
              items[0]?.productImages?.[0]?.url;

            const ts = o.createdAt ? new Date(o.createdAt).getTime() : 0;

            return {
              _id: o._id,
              orderId: o.orderId || (o._id ? String(o._id).slice(-6).toUpperCase() : ""),
              createdAt: o.createdAt ? String(o.createdAt).slice(0, 10) : "",
              createdAtMs: ts,
              status: statusStr,
              itemCount: items.length || 0,
              totalAmount: o.grandTotal || o.totalAmount || o.total || 0,
              thumbnail: firstImg,
            };
          })
        );
      } catch (err) {
        console.error("Orders load failed:", err);
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const visibleOrders = useMemo(() => {
    const lb = dateLowerBound(dateFilter);
    const statusMatches =
      STATUS_FILTERS.find((s) => s.key === statusFilter)?.matches || [];
    const q = search.trim().toLowerCase();

    return orders.filter((o) => {
      // Status
      if (statusMatches.length > 0 && !statusMatches.includes(o.status || "")) {
        return false;
      }
      // Date
      if (lb > 0 && (o.createdAtMs || 0) < lb) return false;
      // Search (matches order id only — sufficient for now, items aren't on the list)
      if (q && !(o.orderId || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, statusFilter, dateFilter, search]);

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter("all");
    setSearch("");
  };

  const isFiltered =
    statusFilter !== "all" || dateFilter !== "all" || search.trim() !== "";

  return (
    <div className="container orders-page">
      <h1 className="cart-title">My Orders</h1>

      {orders.length > 0 && (
        <div className="orders-filters">
          <div className="orders-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Search by order ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="orders-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="orders-pills">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`orders-pill ${statusFilter === s.key ? "active" : ""}`}
                onClick={() => setStatusFilter(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="orders-pills">
            {DATE_FILTERS.map((d) => (
              <button
                key={d.key}
                type="button"
                className={`orders-pill ${dateFilter === d.key ? "active" : ""}`}
                onClick={() => setDateFilter(d.key)}
              >
                {d.label}
              </button>
            ))}
            {isFiltered && (
              <button
                type="button"
                className="orders-pill clear"
                onClick={clearFilters}
              >
                <FiX /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : orders.length === 0 ? (
        <div className="empty">
          You haven't placed any orders yet.{" "}
          <Link to="/" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Start shopping
          </Link>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="empty">
          No orders match the current filters.{" "}
          <button
            type="button"
            className="link-button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {visibleOrders.map((o) => {
            const meta = STATUS_META[o.status || "processing"] || STATUS_META.processing;
            const Icon = meta.icon;
            return (
              <Link
                to={`/orders/${o._id}`}
                key={o._id}
                className="order-card card order-card-link"
              >
                <div className="order-thumb">
                  {o.thumbnail ? <img src={o.thumbnail} alt="" /> : <div className="img-ph" />}
                </div>
                <div className="order-info">
                  <h4>Order #{o.orderId}</h4>
                  <div className="order-meta">Placed on {o.createdAt}</div>
                  <div className="order-meta">
                    {o.itemCount} item{(o.itemCount || 0) !== 1 ? "s" : ""} • {fmt(o.totalAmount || 0)}
                  </div>
                </div>
                <div className="order-side">
                  <div className="order-status" style={{ color: meta.color }}>
                    <Icon /> {meta.label}
                  </div>
                  <span className="link-action">View Details →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
