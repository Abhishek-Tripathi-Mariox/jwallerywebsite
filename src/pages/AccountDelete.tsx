import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiAlertTriangle } from "react-icons/fi";
import { deleteAccount } from "../services/api";
import { useAuthStore } from "../store";
import "./AccountDelete.css";

// Publicly reachable (does not require the app installed) so it can be used
// as the Google Play "Data safety > Delete data URL". Content is visible
// even when logged out so the page still explains the process; the actual
// delete action requires being logged in, same as any other account action.
export default function AccountDelete() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!token) { navigate("/login"); return; }
    setDeleting(true);
    try {
      const res: any = await deleteAccount();
      if (res?.code === 1) {
        logout();
        navigate("/", { replace: true });
      } else {
        alert(res?.message || "Could not delete account. Please try again.");
      }
    } catch {
      alert("Could not delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container account-delete-page">
      <h1>Delete Your Account</h1>
      <p className="account-delete-intro">
        You can permanently delete your Swarnaz account and personal data at any time.
        This works whether or not you have the app installed.
      </p>

      <div className="account-delete-card">
        <h2>What gets deleted</h2>
        <ul>
          <li>Your name, email, date of birth, and profile photo</li>
          <li>Your saved delivery addresses</li>
          <li>Your device/notification token</li>
        </ul>

        <h2>What we keep</h2>
        <ul>
          <li>
            Your past order records — kept for legal, tax, and accounting
            purposes, but no longer linked to identifying personal details
          </li>
        </ul>
        <p className="account-delete-note">
          Your account is deactivated immediately and cannot be used again after deletion.
        </p>
      </div>

      {!token ? (
        <div className="account-delete-action">
          <p>Log in to delete your account.</p>
          <Link to="/login" className="btn btn-primary">Log In</Link>
        </div>
      ) : !confirming ? (
        <div className="account-delete-action">
          <button className="btn btn-outline-primary" onClick={() => navigate("/profile")}>
            Cancel
          </button>
          <button className="btn account-delete-btn" onClick={() => setConfirming(true)}>
            <FiAlertTriangle /> Delete My Account
          </button>
        </div>
      ) : (
        <div className="account-delete-confirm">
          <p><strong>Are you sure?</strong> This cannot be undone.</p>
          <div className="account-delete-confirm-actions">
            <button className="btn btn-outline-primary" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </button>
            <button className="btn account-delete-btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes, Delete My Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
