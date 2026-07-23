import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchHomeScreen,
  fetchHomeCategories,
  fetchSpecialOffers,
  fetchBanners,
  fetchGoldPrices,
  fetchCustomerReviews,
  fetchReels,
  asList,
  normalizeProduct,
  bannerImage,
} from "../services/api";
import type { Category, Product } from "../types";
import ProductCard from "../components/shared/ProductCard";
import HeroCarousel from "../components/shared/HeroCarousel";
import CustomerReviews from "../components/shared/CustomerReviews";
import ReelsStrip from "../components/shared/ReelsStrip";
import BannerMedia, { isVideo } from "../components/shared/BannerMedia";
import { FiArrowRight, FiPlay, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaGem } from "react-icons/fa";
import { IoShieldCheckmarkOutline, IoInfiniteOutline, IoArrowUndoOutline } from "react-icons/io5";
import { A } from "../assets/figma";
import { hasToken } from "../lib/authGate";
import { addToCartAction, toggleWishlistAction } from "../lib/cartActions";
import { toast } from "../store/toastStore";
import "./Home.css";


export default function Home() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [goldPrices, setGoldPrices] = useState<any[]>([]);
  const [customerReviews, setCustomerReviews] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);

  // Customer reviews load independently so the "Customer View" section works
  // for both guests and logged-in users (homeScreen returns early for users).
  useEffect(() => {
    fetchCustomerReviews().then((res) => setCustomerReviews(asList<any>(res?.data)));
  }, []);

  // Reels load independently too (public endpoint), so the "Instagram Reels"
  // section renders for guests and logged-in users alike.
  useEffect(() => {
    fetchReels().then((res) => setReels(asList<any>(res?.data)));
  }, []);

  useEffect(() => {
    (async () => {
      // homeScreen aggregates everything in one call when logged in.
      // For guests, fall back to per-section public endpoints.
      if (hasToken()) {
        const home = await fetchHomeScreen();
        if (home?.code === 1 && home.data) {
          const d: any = home.data;
          if (d.categories) setCategories(d.categories.map((c: any) => ({
            _id: c._id, categoryName: c.name || c.categoryName, image: c.image,
          })));
          if (d.newArrivals) setNewArrivals(d.newArrivals.map(normalizeProduct));
          if (d.featuredProducts) {
            const list = d.featuredProducts.map(normalizeProduct);
            setFeatured(list);
            setTrending(list);
          }
          if (d.banners) setBanners(d.banners);
          if (d.liveGoldPrice) setGoldPrices(d.liveGoldPrice);
          return;
        }
      }

      // Public fallbacks
      const [cats, bans, prices, offers] = await Promise.all([
        fetchHomeCategories(),
        fetchBanners(),
        fetchGoldPrices(),
        fetchSpecialOffers(),
      ]);
      setCategories(asList<Category>(cats?.data));
      setBanners(asList<any>(bans?.data));
      setGoldPrices(asList<any>(prices?.data));
      const offerList = asList<any>(offers?.data).map(normalizeProduct);
      setTrending(offerList);
      setFeatured(offerList);
    })();
  }, []);

  const cats = categories;
  const trendingList = trending;
  const newArrivalList = newArrivals;
  const bestSellers = featured;

  // Group banners by the slot they belong to. The backend tags each banner
  // with a `section` so a single admin screen drives every block below.
  const bySection = (s: string) =>
    banners.filter((b) => (b.section || "home_offers") === s);

  const offerBanners = bySection("home_offers");
  const heroBanners = bySection("home_hero");
  const sundarKeelBanner = bySection("home_sundar_keel")[0];
  const bridalBanner = bySection("home_bridal")[0];
  const templeBanner = bySection("home_temple")[0];
  const ctaBanner = bySection("home_cta")[0];
  const matchTiles = bySection("match_tiles");

  // When the admin hasn't curated any "match" tiles, fall back to real
  // products from the catalog instead of dressing categories up as fake
  // videos with misleading play buttons.
  const matchFallbackProducts = (
    bestSellers.length ? bestSellers : newArrivalList.length ? newArrivalList : trendingList
  ).slice(0, 4);

  // Horizontal carousel for the offer banners — shows 2 at a time and lets
  // the rest scroll. Arrows page by the visible width (one pair at a time).
  const offerTrackRef = useRef<HTMLDivElement>(null);
  const scrollOffers = (dir: 1 | -1) => {
    const track = offerTrackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth, behavior: "smooth" });
  };

  const onAdd = async (p: Product) => {
    const r = await addToCartAction(p, 1);
    if (r.ok) toast.success("Added to cart");
    else toast.error(r.message || "Could not add to cart");
  };

  const onWish = async (p: Product) => {
    const r = await toggleWishlistAction(p);
    if (!r.ok) toast.error(r.message || "Could not update wishlist");
  };

  return (
    <div className="home">
      {/* Live gold price strip (only when backend has prices) */}
      {goldPrices.length > 0 && (
        <div className="gold-strip">
          <div className="container gold-strip-inner">
            {goldPrices
              .filter((g: any) => String(g.purity || g.type).toLowerCase() !== "diamond")
              .map((g: any, i: number) => (
                <span key={i} className="gold-strip-pill">
                  <strong>{g.purity || g.type}</strong> ₹{Number(g.rate).toLocaleString("en-IN")}/g
                </span>
              ))}
            <span className="gold-strip-live">● LIVE</span>
          </div>
        </div>
      )}

      {/* Hero — auto-scrolling carousel of the admin's `home_hero` banners.
          Falls back to the static default when none are published. */}
      {heroBanners.length > 0 ? (
        <HeroCarousel banners={heroBanners} />
      ) : (
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-text">
              <span className="hero-eyebrow">New Collection</span>
              <h1>NEW COLLECTION ARRIVED</h1>
              <p>
                Discover the timeless beauty of our newest collection —
                handcrafted in 22K gold and brilliant diamonds.
              </p>
              <button
                className="btn btn-outline"
                onClick={() => navigate("/category/new-arrivals")}
              >
                SHOP NOW
              </button>
            </div>
            <div className="hero-image">
              <img src={A.hero} alt="Featured collection" />
            </div>
          </div>
        </section>
      )}

      {/* Shop by Category — hidden when backend has no categories yet */}
      {cats.length > 0 && (
        <section className="section soft-bg">
          <div className="container">
            <h2 className="section-title">Shop by Category</h2>
            <div className="grid grid-5">
              {cats.slice(0, 5).map((c) => (
                <Link key={c._id} to={`/shop?category=${c._id}`} className="cat-card">
                  <div className="cat-img">
                    {c.image ? (
                      <img src={c.image} alt={c.categoryName} />
                    ) : (
                      <div className="img-placeholder">{c.categoryName}</div>
                    )}
                  </div>
                  <h4>{c.categoryName}</h4>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offer Banners (after "Shop by Category") — renders every admin
          `home_offers` banner, alternating the light/dark card styles. */}
      {offerBanners.length > 0 && (
        <section className="container offer-section">
          <div className="offer-carousel">
            {offerBanners.length > 2 && (
              <button
                type="button"
                className="offer-nav offer-nav-prev"
                aria-label="Previous offers"
                onClick={() => scrollOffers(-1)}
              >
                <FiChevronLeft />
              </button>
            )}
            <div className="offer-track" ref={offerTrackRef}>
              {offerBanners.map((offer, i) => (
                <div
                  key={offer._id || i}
                  className={`offer-card ${i % 2 === 0 ? "offer-light" : "offer-dark"}`}
                >
                  {bannerImage(offer) && (
                    <BannerMedia
                      src={bannerImage(offer)}
                      alt={offer.title}
                      className="offer-media"
                    />
                  )}
                  {offer.subtitle && (
                    <span className="offer-tag">{offer.subtitle}</span>
                  )}
                  <h3>{offer.title}</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(offer.link || "/category/all")}
                  >
                    Shop Now <FiArrowRight />
                  </button>
                </div>
              ))}
            </div>
            {offerBanners.length > 2 && (
              <button
                type="button"
                className="offer-nav offer-nav-next"
                aria-label="Next offers"
                onClick={() => scrollOffers(1)}
              >
                <FiChevronRight />
              </button>
            )}
          </div>
        </section>
      )}

      {/* Trending Now — hidden when no trending products */}
      {trendingList.length > 0 && (
        <section className="section soft-bg">
          <div className="container">
            <h2 className="section-title">Trending Now 🔥</h2>
            <div className="grid grid-4">
              {trendingList.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} onAdd={onAdd} onWishlist={onWish} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Explore Our Collections (round) */}
      {cats.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">
              Explore Our Collections
              <Link to="/category/all" className="see-all">See All <FiArrowRight /></Link>
            </h2>
            <div className="round-cats">
              {cats.slice(0, 5).map((c) => (
                <Link key={c._id} to={`/shop?category=${c._id}`} className="round-cat">
                  <div className="round-cat-circle">
                    {c.image ? <img src={c.image} alt={c.categoryName} /> : null}
                  </div>
                  <span>{c.categoryName}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivalList.length > 0 && (
        <section className="section soft-bg">
          <div className="container">
            <h2 className="section-title">
              New Arrivals ✨
              <Link to="/category/new-arrivals" className="see-all">See All <FiArrowRight /></Link>
            </h2>
            <div className="grid grid-4">
              {newArrivalList.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} onAdd={onAdd} onWishlist={onWish} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sundar Keel Collections — all three cards come from admin banners.
          Hidden entirely when none of the three is configured. */}
      {(sundarKeelBanner || bridalBanner || templeBanner) && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">
              {sundarKeelBanner?.title || "Featured Collections"} 💎
            </h2>
            <div className="grid grid-2">
              {sundarKeelBanner && (
                <div
                  className="feature-card"
                  onClick={() =>
                    sundarKeelBanner.link && navigate(sundarKeelBanner.link)
                  }
                  style={{ cursor: sundarKeelBanner.link ? "pointer" : "default" }}
                >
                  <img
                    src={bannerImage(sundarKeelBanner)}
                    alt={sundarKeelBanner.title}
                  />
                  <div className="feature-text">
                    <h4>{sundarKeelBanner.title}</h4>
                    {sundarKeelBanner.subtitle && (
                      <p>{sundarKeelBanner.subtitle}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="feature-stack">
                {bridalBanner && (
                  <div
                    className="feature-card small"
                    onClick={() =>
                      bridalBanner.link && navigate(bridalBanner.link)
                    }
                    style={{ cursor: bridalBanner.link ? "pointer" : "default" }}
                  >
                    <img
                      src={bannerImage(bridalBanner)}
                      alt={bridalBanner.title}
                    />
                    <div className="feature-text">
                      <h4>{bridalBanner.title}</h4>
                      {bridalBanner.subtitle && <p>{bridalBanner.subtitle}</p>}
                    </div>
                  </div>
                )}
                {templeBanner && (
                  <div
                    className="feature-card small"
                    onClick={() =>
                      templeBanner.link && navigate(templeBanner.link)
                    }
                    style={{ cursor: templeBanner.link ? "pointer" : "default" }}
                  >
                    <img
                      src={bannerImage(templeBanner)}
                      alt={templeBanner.title}
                    />
                    <div className="feature-text">
                      <h4>{templeBanner.title}</h4>
                      {templeBanner.subtitle && <p>{templeBanner.subtitle}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Find Your Perfect Match — curated `match_tiles` banners when the admin
          has set them up; otherwise real products from the catalog. The play
          overlay only appears on tiles whose media is actually a video. */}
      {(matchTiles.length > 0 || matchFallbackProducts.length > 0) && (
        <section className="section soft-bg">
          <div className="container">
            <h2 className="section-title">Find Your Perfect Match 💍</h2>
            <div className="grid grid-4">
              {matchTiles.length > 0
                ? matchTiles.slice(0, 4).map((m) => {
                    const media = bannerImage(m);
                    return (
                      <div
                        key={m._id}
                        className="video-card"
                        onClick={() => m.link && navigate(m.link)}
                        style={{ cursor: m.link ? "pointer" : "default" }}
                      >
                        <BannerMedia src={media} alt={m.title} />
                        {isVideo(media) && (
                          <button className="play-btn"><FiPlay /></button>
                        )}
                        <span className="video-label">{m.title}</span>
                      </div>
                    );
                  })
                : matchFallbackProducts.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      onAdd={onAdd}
                      onWishlist={onWish}
                    />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Seller */}
      {bestSellers.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">Best Seller Products</h2>
            <div className="grid grid-4">
              {bestSellers.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} onAdd={onAdd} onWishlist={onWish} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instagram Reels — admin-curated reels. Always shown (with an empty
          state) so the section is visible even before any reels exist. */}
      <ReelsStrip reels={reels} />

      {/* Customer View — admin-curated testimonials. Always shown (with an
          empty state) so the section is visible even before reviews exist. */}
      <CustomerReviews reviews={customerReviews} />

      {/* Assurance — matches the mobile app's Assurance card */}
      <section className="section assurance">
        <div className="container">
          <div className="assurance-card">
            <h2 className="assurance-title">Assurance</h2>
            <p className="assurance-subtitle">Crafted By Experts, Cherished By You</p>
            <div className="assurance-grid">
              <div className="assurance-item">
                <span className="assurance-icon"><FaGem /></span>
                <p>10% purity<br />of 24k Gold</p>
              </div>
              <div className="assurance-item">
                <span className="assurance-icon"><IoShieldCheckmarkOutline /></span>
                <p>5 years<br />warranty</p>
              </div>
              <div className="assurance-item">
                <span className="assurance-icon"><IoInfiniteOutline /></span>
                <p>Premiere<br />Design</p>
              </div>
              <div className="assurance-item">
                <span className="assurance-icon"><IoArrowUndoOutline /></span>
                <p>easy 3-5<br />Days return</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner — driven by admin's `home_cta` banner */}
      {ctaBanner && (
        <section
          className="container cta-banner"
          style={
            bannerImage(ctaBanner)
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${bannerImage(ctaBanner)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="cta-inner">
            <div>
              {ctaBanner.subtitle && (
                <span className="offer-tag light">{ctaBanner.subtitle}</span>
              )}
              <h2 style={{ color: "#fff", whiteSpace: "pre-line" }}>
                {ctaBanner.title}
              </h2>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  className="btn btn-dark"
                  onClick={() =>
                    navigate(ctaBanner.link || "/category/all")
                  }
                >
                  Explore Collection
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
