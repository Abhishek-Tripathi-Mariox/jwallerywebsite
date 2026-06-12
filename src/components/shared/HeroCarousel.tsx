import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { bannerImage } from "../../services/api";
import { A } from "../../assets/figma";
import BannerMedia, { isVideo } from "./BannerMedia";

type AnyBanner = Record<string, any>;

/**
 * Auto-scrolling hero banner for the "New Collection" area.
 * Cycles through every active `home_hero` banner the admin has published,
 * showing each banner's image + title + subtitle + CTA. Pauses on hover and
 * exposes clickable dots. Falls back to a single static slide when only one
 * banner is present.
 */
export default function HeroCarousel({
  banners,
  intervalMs = 5000,
}: {
  banners: AnyBanner[];
  intervalMs?: number;
}) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = banners.length;
  const safeIndex = count ? index % count : 0;
  const current = banners[safeIndex];

  const go = useCallback(
    (next: number) => setIndex((next + count) % Math.max(count, 1)),
    [count]
  );

  // Auto-advance only when there is more than one slide.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, paused, intervalMs]);

  if (!count) return null;

  return (
    <section
      className="hero hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container hero-inner">
        <div className="hero-text">
          {current.subtitle && (
            <span className="hero-eyebrow">{current.subtitle}</span>
          )}
          <h1>{current.title}</h1>
          <button
            className="btn btn-outline"
            onClick={() => navigate(current.link || "/category/new-arrivals")}
          >
            SHOP NOW
          </button>
        </div>
        <div className="hero-image">
          <BannerMedia
            src={bannerImage(current) || (isVideo(current.mobileView) ? current.mobileView : A.hero)}
            alt={current.title || "Featured collection"}
          />
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            className="hero-nav hero-nav-prev"
            aria-label="Previous banner"
            onClick={() => go(safeIndex - 1)}
          >
            ‹
          </button>
          <button
            className="hero-nav hero-nav-next"
            aria-label="Next banner"
            onClick={() => go(safeIndex + 1)}
          >
            ›
          </button>
          <div className="hero-dots">
            {banners.map((b, i) => (
              <button
                key={b._id || i}
                className={`hero-dot ${i === safeIndex ? "active" : ""}`}
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
