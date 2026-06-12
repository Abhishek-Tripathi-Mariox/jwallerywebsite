import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Addresses from "./pages/Addresses";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Contact from "./pages/Contact";
import StaticPage from "./pages/StaticPage";
import NotFound from "./pages/NotFound";
import { useLogoStore } from "./store/logoStore";
import Toaster from "./components/shared/Toaster";

function useApplyBrandAssets() {
  const byType = useLogoStore((s) => s.byType);
  const fetchLogos = useLogoStore((s) => s.fetch);

  useEffect(() => {
    fetchLogos();
  }, [fetchLogos]);

  useEffect(() => {
    const faviconUrl = byType.favicon?.imageUrl;
    if (!faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [byType.favicon?.imageUrl]);

  useEffect(() => {
    const title = byType.primary?.title || byType.favicon?.title;
    if (title) document.title = title;
  }, [byType.primary?.title, byType.favicon?.title]);
}

export default function App() {
  useApplyBrandAssets();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Filter/shop page — category comes from ?category=<id> and is an
              editable filter. /category/:id kept for back-compat. */}
          <Route path="/shop" element={<Category />} />
          <Route path="/category/:id" element={<Category />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/contact-us" element={<Contact />} />
          {/* CMS-driven static pages — admin publishes content per slug. */}
          <Route
            path="/store-locator"
            element={
              <StaticPage
                slug="store-locator"
                fallbackTitle="Store Locator"
                fallbackBody={
                  <p>
                    Store locations will appear here soon. For directions or
                    appointments, please use the Contact form.
                  </p>
                }
              />
            }
          />
          <Route
            path="/about-us"
            element={<StaticPage slug="about-us" fallbackTitle="About Us" />}
          />
          <Route
            path="/our-story"
            element={<StaticPage slug="our-story" fallbackTitle="Our Story" />}
          />
          <Route
            path="/privacy-policy"
            element={
              <StaticPage slug="privacy-policy" fallbackTitle="Privacy Policy" />
            }
          />
          <Route
            path="/terms"
            element={
              <StaticPage slug="terms" fallbackTitle="Terms of Service" />
            }
          />
          <Route
            path="/shipping-policy"
            element={
              <StaticPage
                slug="shipping-policy"
                fallbackTitle="Shipping Policy"
              />
            }
          />
          <Route
            path="/return-policy"
            element={
              <StaticPage slug="return-policy" fallbackTitle="Return Policy" />
            }
          />
          <Route
            path="/help"
            element={<StaticPage slug="help" fallbackTitle="Help" />}
          />
          <Route path="/pages/:slug" element={<StaticPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
