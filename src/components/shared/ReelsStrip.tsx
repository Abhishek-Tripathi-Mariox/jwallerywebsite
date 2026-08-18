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
function ReelCard({ r, hidden }: { r: Reel; hidden?: boolean }) {
  const isVid = r.mediaType ? r.mediaType === "video" : isVideo(r.mediaUrl);
  return (
    <a
      className="reel-card"
      href={r.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={r.title || "Open reel on Instagram"}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
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
}

export default function ReelsStrip({ reels }: { reels: Reel[] }) {
  // A handful of reels reads fine as a plain scrollable row; enough of them
  // reads better drifting past on their own like a live gallery. The track
  // is duplicated once so the loop has no seam (it resets exactly halfway
  // through, right as the "copy" is indistinguishable from the original).
  const autoScroll = reels.length >= 4;
  const durationS = Math.round(Math.max(18, reels.length * 4.5));

  return (
    <section className="section reels-section">
      <div className="container">
        <h2 className="section-title">Instagram Reels</h2>

        {reels.length === 0 ? (
          <p className="reels-empty">No reels yet.</p>
        ) : autoScroll ? (
          <div className="reels-viewport">
            <div
              className="reels-track reels-track-auto"
              style={{ animationDuration: `${durationS}s` }}
            >
              {reels.map((r, i) => (
                <ReelCard key={r._id || i} r={r} />
              ))}
              {reels.map((r, i) => (
                <ReelCard key={`dup-${r._id || i}`} r={r} hidden />
              ))}
            </div>
          </div>
        ) : (
          <div className="reels-track scrollbar-hide">
            {reels.map((r, i) => (
              <ReelCard key={r._id || i} r={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
