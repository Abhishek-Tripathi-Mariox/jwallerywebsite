import { FaInstagram } from "react-icons/fa";
import { isVideo } from "./BannerMedia";

type Reel = {
  _id?: string;
  title?: string;
  mediaUrl: string;
  mediaType?: "image" | "video";
  thumbnailUrl?: string;
  instagramUrl: string;
};

/**
 * "Instagram Reels" home section, fed by admin-curated reels. Each card shows
 * the reel's media (autoplaying muted video, or an image) and links out to the
 * reel on instagram.com in a new tab. The section always renders (with an empty
 * state) so the slot is visible even before any reels are added.
 */
export default function ReelsStrip({ reels }: { reels: Reel[] }) {
  return (
    <section className="section reels-section">
      <div className="container">
        <h2 className="section-title">Instagram Reels</h2>

        {reels.length === 0 ? (
          <p className="reels-empty">No reels yet.</p>
        ) : (
          <div className="reels-track scrollbar-hide">
            {reels.map((r, i) => {
              const isVid = r.mediaType
                ? r.mediaType === "video"
                : isVideo(r.mediaUrl);
              return (
                <a
                  key={r._id || i}
                  className="reel-card"
                  href={r.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={r.title || "Open reel on Instagram"}
                >
                  {isVid ? (
                    <video
                      src={r.mediaUrl}
                      poster={r.thumbnailUrl || undefined}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img src={r.mediaUrl} alt={r.title || "Instagram reel"} />
                  )}
                  <span className="reel-ig" aria-hidden="true">
                    <FaInstagram />
                  </span>
                  {r.title && <span className="reel-caption">{r.title}</span>}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
