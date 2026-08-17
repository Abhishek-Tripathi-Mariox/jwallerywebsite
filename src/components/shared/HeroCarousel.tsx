import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
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
      {/* Full-scale banner image, no title/description text overlaid on it —
          admin-uploaded banners already carry their own message/design, so a
          second HTML text block on top was redundant. Arrows live inside
          .hero-image (not the outer section) so they stay centered on the
          image itself on every layout. Tapping the image advances to the
          next slide; the small "Shop Now" pill in the corner is the one
          click target that actually navigates, so it stops that tap from
          also counting as an advance. */}
      <div className="container">
        <div className="hero-image">
          <div
            className="hero-image-tap"
            onClick={() => count > 1 && go(safeIndex + 1)}
          >
            <BannerMedia
              src={bannerImage(current) || (isVideo(current.mobileView) ? current.mobileView : A.hero)}
              alt={current.title || "Featured collection"}
            />
          </div>
          <button
            className="btn btn-hero hero-cta"
            onClick={(e) => { e.stopPropagation(); navigate(current.link || "/category/new-arrivals"); }}
          >
            SHOP NOW <FiArrowRight />
          </button>
          {count > 1 && (
            <>
              <button
                className="hero-nav hero-nav-prev"
                aria-label="Previous banner"
                onClick={(e) => { e.stopPropagation(); go(safeIndex - 1); }}
              >
                ‹
              </button>
              <button
                className="hero-nav hero-nav-next"
                aria-label="Next banner"
                onClick={(e) => { e.stopPropagation(); go(safeIndex + 1); }}
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>

      {count > 1 && (
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
      )}
    </section>
  );
}
