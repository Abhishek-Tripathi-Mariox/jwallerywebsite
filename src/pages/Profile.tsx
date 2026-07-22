import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiUser, FiPackage, FiMapPin, FiHeart, FiSettings, FiFileText, FiBell, FiLogOut,
} from "react-icons/fi";
import { fetchProfile } from "../services/api";
import { useAuthStore } from "../store";
import "./Profile.css";

// `Payment Methods` was removed — the backend doesn't store saved cards;
// payments are collected per-order via Razorpay/COD at checkout.
const TILES = [
  { icon: FiPackage,    title: "My Orders",          desc: "Track, return, or buy again",      to: "/orders"        },
  { icon: FiMapPin,     title: "Saved Addresses",    desc: "Manage shipping addresses",        to: "/addresses"     },
  { icon: FiHeart,      title: "Wishlist",           desc: "Your saved-for-later pieces",      to: "/wishlist"      },
  { icon: FiBell,       title: "Notifications",      desc: "See order & promotional updates",  to: "/notifications" },
  { icon: FiSettings,   title: "Settings",           desc: "Preferences and notifications",    to: "/settings"      },
  { icon: FiFileText,   title: "Terms & Conditions", desc: "Read our policies",                to: "/terms"         },
];

export default function Profile() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchProfile().then((res: any) => setProfile(res?.data));
  }, [token, navigate]);

  if (!token) return null;

  const composedName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const name =
    profile?.fullName?.trim() ||
    composedName ||
    profile?.name ||
    "Welcome Back!";
  const contact =
    profile?.email ||
    (profile?.mobileNumber
      ? `${profile.countryCode || ""} ${profile.mobileNumber}`.trim()
      : "");

  return (
    <div className="container profile-page">
      <div className="profile-banner">
        <div className="profile-avatar">
          <FiUser />
        </div>
        <div>
          <h1>{name}</h1>
          <p>{contact}</p>
        </div>
      </div>

      <div className="profile-tiles">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.title} to={t.to} className="profile-tile">
              <span className="profile-tile-icon"><Icon /></span>
              <span className="profile-tile-text">
                <strong>{t.title}</strong>
                <span>{t.desc}</span>
              </span>
            </Link>
          );
        })}
      </div>

      <button
        className="profile-logout"
        onClick={() => { logout(); navigate("/"); }}
      >
        <FiLogOut /> Logout
      </button>

      <Link to="/account/delete" className="profile-delete-account">
        Delete my account
      </Link>
    </div>
  );
}
