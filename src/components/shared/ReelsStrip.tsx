import { useEffect, useRef, useState } from "react";
import {
  FaInstagram,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
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
 * the reel's media (autoplaying muted video, or an image); tapping one opens
 * an in-site vertical player so reels actually play here instead of always
 * bouncing out to Instagram. The section always renders (with an empty
 * state) so the slot is visible even before any reels are added.
 */
function ReelCard({
  r,
  hidden,
  onOpen,
}: {
  r: Reel;
  hidden?: boolean;
  onOpen?: () => void;
}) {
  const isVid = r.mediaType ? r.mediaType === "video" : isVideo(r.mediaUrl);
  const videoRef = useRef<HTMLVideoElement>(null);

  // The autoPlay attribute alone can silently fail to start on some browsers
  // once a video is added/re-rendered after mount, so kick it explicitly.
  useEffect(() => {
    if (isVid) videoRef.current?.play().catch(() => {});
  }, [isVid]);

  return (
    <button
      type="button"
      className="reel-card"
      onClick={onOpen}
      aria-label={r.title ? `Play reel: ${r.title}` : "Play reel"}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      {isVid ? (
        <video
          ref={videoRef}
          src={r.mediaUrl}
          poster={r.thumbnailUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        <img src={r.mediaUrl} alt={r.title || "Instagram reel"} />
      )}
      <span
        className="reel-ig"
        role="link"
        aria-label="Open on Instagram"
        onClick={(e) => {
          e.stopPropagation();
          window.open(r.instagramUrl, "_blank", "noopener,noreferrer");
        }}
      >
        <FaInstagram />
      </span>
      {r.title && <span className="reel-caption">{r.title}</span>}
    </button>
  );
}

function ReelPlayer({
  reels,
  index,
  onClose,
  onNavigate,
}: {
  reels: Reel[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const r = reels[index];
  const isVid = r.mediaType ? r.mediaType === "video" : isVideo(r.mediaUrl);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      if (e.key === "ArrowRight" && index < reels.length - 1) onNavigate(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, reels.length, onClose, onNavigate]);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [index]);

  return (
    <div className="reel-player-overlay" onClick={onClose}>
      <button className="reel-player-close" onClick={onClose} aria-label="Close">
        <FaTimes />
      </button>

      {index > 0 && (
        <button
          className="reel-player-nav reel-player-prev"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
          aria-label="Previous reel"
        >
          <FaChevronLeft />
        </button>
      )}
      {index < reels.length - 1 && (
        <button
          className="reel-player-nav reel-player-next"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
          aria-label="Next reel"
        >
          <FaChevronRight />
        </button>
      )}

      <div className="reel-player-frame" onClick={(e) => e.stopPropagation()}>
        {isVid ? (
          <video
            ref={videoRef}
            src={r.mediaUrl}
            poster={r.thumbnailUrl || undefined}
            autoPlay
            muted={muted}
            loop
            playsInline
          />
        ) : (
          <img src={r.mediaUrl} alt={r.title || "Instagram reel"} />
        )}

        {isVid && (
          <button
            className="reel-player-mute"
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
        )}

        {r.title && <span className="reel-player-caption">{r.title}</span>}

        <a
          className="reel-player-ig-link"
          href={r.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <FaInstagram /> View on Instagram
        </a>
      </div>
    </div>
  );
}

export default function ReelsStrip({ reels }: { reels: Reel[] }) {
  // A handful of reels reads fine as a plain scrollable row; enough of them
  // reads better drifting past on their own like a live gallery. The track
  // is duplicated once so the loop has no seam (it resets exactly halfway
  // through, right as the "copy" is indistinguishable from the original).
  const autoScroll = reels.length >= 4;
  const durationS = Math.round(Math.max(18, reels.length * 4.5));
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
                <ReelCard key={r._id || i} r={r} onOpen={() => setOpenIndex(i)} />
              ))}
              {reels.map((r, i) => (
                <ReelCard
                  key={`dup-${r._id || i}`}
                  r={r}
                  hidden
                  onOpen={() => setOpenIndex(i)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="reels-track scrollbar-hide">
            {reels.map((r, i) => (
              <ReelCard key={r._id || i} r={r} onOpen={() => setOpenIndex(i)} />
            ))}
          </div>
        )}
      </div>

      {openIndex !== null && (
        <ReelPlayer
          reels={reels}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </section>
  );
}
