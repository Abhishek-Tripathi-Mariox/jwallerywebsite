import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import { useAuthStore, useUiStore } from "../../store";
import { useLogoStore } from "../../store/logoStore";
import { useGuestStore } from "../../store/guestStore";
import { A } from "../../assets/figma";
import NotificationBell from "./NotificationBell";
import "./Header.css";

const NAV = [
  { label: "New Arrivals", to: "/category/new-arrivals" },
  { label: "Gold", to: "/category/gold" },
  { label: "Silver", to: "/category/silver" },
  { label: "Collections", to: "/category/collections" },
  { label: "Offers", to: "/category/offers", highlight: true },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();
  const serverCartCount = useUiStore((s) => s.cartCount);
  const serverWishlistCount = useUiStore((s) => s.wishlistCount);
  const refreshCounts = useUiStore((s) => s.refreshCounts);
  const guestCartCount = useGuestStore((s) => s.cartCount);
  const guestWishlistCount = useGuestStore((s) => s.wishlistCount);
  const primaryLogo = useLogoStore((s) => s.byType.primary?.imageUrl);
  const [menuOpen, setMenuOpen] = useState(false);

  // Refresh counts on every route change. This is what makes the cart /
  // wishlist badges feel live — landing on Home, opening a product, returning
  // to checkout, etc. all triggers a fresh count read.
  useEffect(() => {
    refreshCounts();
  }, [location.pathname, token, refreshCounts]);

  // Close the mobile drawer whenever the route changes (e.g. tapping a link).
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const cartCount = token ? serverCartCount : guestCartCount;
  const wishlistCount = token ? serverWishlistCount : guestWishlistCount;

  return (
    <header className="site-header">
      {/* Top utility strip */}
      <div className="utility-bar">
        <div className="container utility-inner">
          <div className="utility-left">Free Shipping on Orders Above ₹10,000 | COD Available</div>
          <div className="utility-right">
            <Link to="/orders">Track Order</Link>
            <Link to="/store-locator">Store Locator</Link>
            <Link to="/contact-us">Contact Us</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container header-main">
        <button
          className="nav-toggle"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <FiMenu />
        </button>

        <Link to="/" className="brand" aria-label="Swarnaz home">
          <img src={primaryLogo || A.logo} alt="Swarnaz" className="brand-logo" />
        </Link>

        <nav className="primary-nav">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                [n.highlight ? "highlight" : "", isActive ? "active" : ""].join(" ").trim()
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <NotificationBell />
          <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
            <FiHeart />
            {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="icon-btn" aria-label="Cart">
            <FiShoppingCart />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          <button
            className="icon-btn"
            aria-label="Account"
            onClick={() => navigate(token ? "/profile" : "/login")}
          >
            <FiUser />
          </button>
        </div>
      </div>

      {/* Mobile slide-in drawer */}
      <div
        className={`nav-drawer-backdrop ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <aside className={`nav-drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="nav-drawer-head">
          <Link to="/" className="brand" aria-label="Swarnaz home">
            <img src={primaryLogo || A.logo} alt="Swarnaz" className="brand-logo" />
          </Link>
          <button
            className="icon-btn"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <FiX />
          </button>
        </div>

        <nav className="nav-drawer-links">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                [n.highlight ? "highlight" : "", isActive ? "active" : ""].join(" ").trim()
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-drawer-utility">
          <Link to="/orders">Track Order</Link>
          <Link to="/store-locator">Store Locator</Link>
          <Link to="/contact-us">Contact Us</Link>
        </div>
      </aside>
    </header>
  );
}
