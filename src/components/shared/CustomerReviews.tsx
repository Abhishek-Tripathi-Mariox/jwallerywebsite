import { useEffect, useMemo, useRef, useState } from "react";

type Review = {
  _id?: string;
  name?: string;
  rating?: number;
  reviewText?: string;
  avatar?: string;
};

function Stars({ rating = 5 }: { rating?: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="cv-stars" aria-label={`${r} out of 5`}>
      {"★".repeat(r)}
      <span className="cv-stars-empty">{"★".repeat(5 - r)}</span>
    </span>
  );
}

function initials(name = "") {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/**
 * "Customer View" testimonials carousel, fed by admin-curated reviews.
 * Always renders the section (with an empty state) so the slot is visible
 * even before any reviews are added.
 */
export default function CustomerReviews({ reviews }: { reviews: Review[] }) {
  const [perPage, setPerPage] = useState(3);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerPage(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(reviews.length / perPage));

  // Keep page in range when perPage / list size changes.
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const cardBasis = useMemo(() => `${100 / perPage}%`, [perPage]);

  // Swipe support — the prev/next buttons are hidden below 640px (Home.css),
  // and the track is transform-driven rather than a native scroll surface,
  // so there was previously no way to change pages by touch at all.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 40;
    if (deltaX <= -SWIPE_THRESHOLD) {
      setPage((p) => (p + 1) % pageCount);
    } else if (deltaX >= SWIPE_THRESHOLD) {
      setPage((p) => (p - 1 + pageCount) % pageCount);
    }
  };

  return (
    <section className="section customer-view">
      <div className="container">
        <h2 className="section-title cv-title">
          <span className="cv-dash" /> Customer View <span className="cv-dash" />
        </h2>

        {reviews.length === 0 ? (
          <p className="cv-empty">No customer reviews yet.</p>
        ) : (
          <div className="cv-carousel">
            {reviews.length > perPage && (
              <button
                className="cv-nav cv-nav-prev"
                aria-label="Previous reviews"
                onClick={() => setPage((p) => (p - 1 + pageCount) % pageCount)}
              >
                ‹
              </button>
            )}

            <div
              className="cv-viewport"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="cv-track"
                style={{ transform: `translateX(-${page * 100}%)` }}
              >
                {reviews.map((r, i) => (
                  <div key={r._id || i} className="cv-slot" style={{ flexBasis: cardBasis }}>
                    <div className="cv-card">
                      <div className="cv-head">
                        <div className="cv-avatar">
                          {r.avatar ? (
                            <img src={r.avatar} alt={r.name || "Customer"} />
                          ) : (
                            <span>{initials(r.name)}</span>
                          )}
                        </div>
                        <span className="cv-name">{r.name}</span>
                        <Stars rating={r.rating} />
                      </div>
                      <div className="cv-divider" />
                      <p className="cv-text">{r.reviewText}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {reviews.length > perPage && (
              <button
                className="cv-nav cv-nav-next"
                aria-label="Next reviews"
                onClick={() => setPage((p) => (p + 1) % pageCount)}
              >
                ›
              </button>
            )}
          </div>
        )}

        {reviews.length > perPage && (
          <div className="cv-dots">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                className={`cv-dot ${i === page ? "active" : ""}`}
                aria-label={`Go to page ${i + 1}`}
                onClick={() => setPage(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
