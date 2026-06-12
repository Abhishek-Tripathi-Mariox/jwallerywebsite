/** True when a banner media URL points at a video file rather than an image. */
export function isVideo(url?: string): boolean {
  return !!url && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

/**
 * Renders a banner's media as a <video> when the URL is a video file,
 * otherwise as an <img>. The website's banners can be either images or
 * short MP4 clips (the admin lets you upload both), so every banner slot
 * must handle both. Videos autoplay muted+looped like a background clip.
 */
export default function BannerMedia({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        aria-label={alt}
      />
    );
  }
  return <img src={src} alt={alt} className={className} />;
}
