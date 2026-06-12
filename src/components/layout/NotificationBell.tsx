import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBell, FiCheck } from "react-icons/fi";
import { useAuthStore } from "../../store";
import { useNotificationStore } from "../../store/notificationStore";

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();
  const { items, unreadCount, refresh, refreshCount, markRead, markAllRead, reset } =
    useNotificationStore();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Initial count + refresh when login state changes, and poll periodically.
  useEffect(() => {
    if (!token) {
      reset();
      return;
    }
    refreshCount();
    // Poll every 60 seconds while logged in. This keeps the badge fresh even
    // if the user just sits on one page for a long time.
    const id = setInterval(refreshCount, 60000);
    return () => clearInterval(id);
  }, [token, refreshCount, reset]);

  // Bump the unread count whenever the user navigates to a new route — that's
  // the most common moment they look at the bell and expect it to be current.
  useEffect(() => {
    if (token) refreshCount();
  }, [location.pathname, token, refreshCount]);

  // Load the list when the dropdown opens
  useEffect(() => {
    if (open && token) refresh();
  }, [open, token, refresh]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    setOpen((v) => !v);
  };

  const handleItemClick = async (id: string, link?: string) => {
    await markRead(id);
    setOpen(false);
    if (link) navigate(link);
  };

  const preview = items.slice(0, 8);

  return (
    <div className="notif-wrap" ref={wrapperRef}>
      <button className="icon-btn" aria-label="Notifications" onClick={handleClick}>
        <FiBell />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="menu">
          <div className="notif-head">
            <strong>Notifications</strong>
            {items.some((n) => !n.isRead) && (
              <button
                type="button"
                className="notif-mark-all"
                onClick={() => markAllRead()}
              >
                <FiCheck /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {preview.length === 0 ? (
              <div className="notif-empty">You're all caught up.</div>
            ) : (
              preview.map((n) => (
                <button
                  type="button"
                  key={n._id}
                  className={`notif-item${n.isRead ? "" : " unread"}`}
                  onClick={() => handleItemClick(n._id, n.link)}
                >
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-msg">{n.message}</div>
                  <div className="notif-item-time">{formatTime(n.createdAt)}</div>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            className="notif-see-all"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            See all notifications
          </button>
        </div>
      )}
    </div>
  );
}
