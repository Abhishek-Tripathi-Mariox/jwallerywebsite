import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBell, FiLogOut, FiSave, FiUser } from "react-icons/fi";
import {
  fetchProfile,
  updateProfile,
  toggleNotificationSwitch,
} from "../services/api";
import { hasToken } from "../lib/authGate";
import { useAuthStore } from "../store";
import { toast } from "../store/toastStore";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
  });
  const [notificationAllowed, setNotificationAllowed] = useState(true);

  useEffect(() => {
    if (!hasToken()) {
      navigate("/login?next=/settings", { replace: true });
      return;
    }
    (async () => {
      const r: any = await fetchProfile();
      if (r?.code === 1 && r.data) {
        const p = r.data;
        setForm({
          fullName: p.fullName || "",
          email: p.email || "",
          mobileNumber: p.mobileNumber || "",
        });
        // Backend stores notificationAllowed as 0/1 — coerce to boolean.
        setNotificationAllowed(
          p.notificationAllowed == null ? true : !!Number(p.notificationAllowed),
        );
      }
      setLoading(false);
    })();
  }, [navigate]);

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast.warning("Please enter your name");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.warning("Please enter a valid email");
      return;
    }
    setSaving(true);
    const r: any = await updateProfile({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
    });
    setSaving(false);
    if (r?.code !== 1) {
      toast.error(r?.message || "Could not save profile");
      return;
    }
    toast.success("Profile updated");
  };

  const handleNotificationToggle = async () => {
    // Optimistic flip — the backend toggles unconditionally so we trust
    // ourselves until it responds, then reconcile on failure.
    const next = !notificationAllowed;
    setNotificationAllowed(next);
    setTogglingNotif(true);
    const r: any = await toggleNotificationSwitch();
    setTogglingNotif(false);
    if (r?.code !== 1) {
      toast.error(r?.message || "Could not change notification preference");
      setNotificationAllowed(!next);
      return;
    }
    toast.success(
      next ? "Notifications enabled" : "Notifications disabled",
    );
  };

  if (loading) {
    return (
      <div className="container settings-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container settings-page">
      <button className="back-link" onClick={() => navigate("/profile")}>
        <FiArrowLeft /> Back to profile
      </button>

      <h1 className="settings-title">Settings</h1>

      <div className="settings-card">
        <div className="settings-card-head">
          <FiUser />
          <h2>Profile</h2>
        </div>
        <label className="settings-field">
          <span>Full name</span>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullName: e.target.value }))
            }
            placeholder="Your name"
          />
        </label>
        <label className="settings-field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
          />
        </label>
        <label className="settings-field">
          <span>Mobile number</span>
          <input
            type="tel"
            value={form.mobileNumber}
            disabled
            title="Mobile is your login identifier. Contact support to change it."
          />
        </label>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <FiSave /> {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      <div className="settings-card">
        <div className="settings-card-head">
          <FiBell />
          <h2>Notifications</h2>
        </div>
        <label className="settings-toggle-row">
          <div>
            <strong>Order updates and offers</strong>
            <span>Receive SMS/email about your orders and promotions.</span>
          </div>
          <span
            className={`settings-toggle${notificationAllowed ? " on" : ""}${
              togglingNotif ? " busy" : ""
            }`}
            onClick={() => !togglingNotif && handleNotificationToggle()}
            role="switch"
            aria-checked={notificationAllowed}
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !togglingNotif) {
                e.preventDefault();
                handleNotificationToggle();
              }
            }}
          >
            <span className="settings-toggle-dot" />
          </span>
        </label>
      </div>

      <div className="settings-card">
        <div className="settings-card-head">
          <FiUser />
          <h2>Account</h2>
        </div>
        <div className="settings-links">
          <Link to="/orders">My orders →</Link>
          <Link to="/addresses">Saved addresses →</Link>
          <Link to="/wishlist">Wishlist →</Link>
          <Link to="/notifications">Notification history →</Link>
        </div>
        <button
          className="btn btn-outline-primary settings-logout"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <FiLogOut /> Log out
        </button>
      </div>
    </div>
  );
}
