import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { fetchStaticPage, type StaticPage as StaticPageData } from "../services/api";
import "./StaticPage.css";

interface Props {
  // Optional override for routes like `/store-locator` that map to a known
  // slug without taking it from the URL.
  slug?: string;
  // Optional fallback content shown when admin hasn't published this page
  // yet — keeps the link from looking dead.
  fallbackTitle?: string;
  fallbackBody?: React.ReactNode;
}

export default function StaticPage({
  slug: forcedSlug,
  fallbackTitle,
  fallbackBody,
}: Props) {
  const navigate = useNavigate();
  const { slug: paramSlug } = useParams();
  const slug = forcedSlug || paramSlug || "";

  const [page, setPage] = useState<StaticPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      const res = await fetchStaticPage(slug);
      if (cancelled) return;
      if (res?.code === 1 && res.data) {
        setPage(res.data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="container static-page">
        <div className="spinner" />
      </div>
    );
  }

  const title = page?.title || fallbackTitle || slug.replace(/-/g, " ");
  const subtitle = page?.subtitle;
  const content = page?.content;
  const showFallback = notFound || !content;

  return (
    <div className="container static-page">
      <button className="back-link" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back
      </button>
      <h1 className="static-page-title">{title}</h1>
      {subtitle && <p className="static-page-subtitle">{subtitle}</p>}

      {!showFallback ? (
        // Admin-authored content. We don't sanitize on the client because the
        // admin author is trusted (only authenticated admins can write); if
        // that ever changes, swap in DOMPurify here.
        <div
          className="static-page-content"
          dangerouslySetInnerHTML={{ __html: content || "" }}
        />
      ) : (
        <div className="static-page-fallback">
          {fallbackBody || (
            <>
              <p>
                We're putting the finishing touches on this page. In the
                meantime, feel free to reach out and we'll help directly.
              </p>
              <Link to="/contact-us" className="btn btn-primary">
                Contact us
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
