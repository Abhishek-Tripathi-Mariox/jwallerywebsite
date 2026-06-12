import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheck } from "react-icons/fi";
import { useAuthStore } from "../store";
import { useNotificationStore } from "../store/notificationStore";

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

export default function Notifications() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { items, loading, loaded, refresh, markRead, markAllRead, unreadCount } =
    useNotificationStore();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    refresh();
  }, [token, refresh, navigate]);

  const handleClick = async (id: string, link?: string) => {
    await markRead(id);
    if (link) navigate(link);
  };

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            style={{
              border: 0,
              background: "transparent",
              color: "var(--color-primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      {loading && !loaded && (
        <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading…</div>
      )}

      {loaded && items.length === 0 && (
        <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
          <FiBell size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 15 }}>No notifications yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            We'll let you know when there's an update on your orders.
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((n) => (
          <button
            key={n._id}
            type="button"
            onClick={() => handleClick(n._id, n.link)}
            style={{
              textAlign: "left",
              padding: 14,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              background: n.isRead ? "#fff" : "#fff8e1",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{n.title}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{formatTime(n.createdAt)}</div>
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{n.message}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
