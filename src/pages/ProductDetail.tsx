import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiHeart, FiShoppingCart } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import {
  fetchProductDetails,
  fetchFeaturedProducts,
  fetchNewArrivals,
  fetchChargesConfig,
  asList,
  normalizeProduct,
} from "../services/api";
import type { Product } from "../types";
import ProductCard from "../components/shared/ProductCard";
import { addToCartAction, toggleWishlistAction } from "../lib/cartActions";
import { toast } from "../store/toastStore";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [prepaidPercent, setPrepaidPercent] = useState(0);

  useEffect(() => {
    fetchChargesConfig().then((r: any) => {
      const c = r?.data;
      if (c?.prepaidDiscountActive) setPrepaidPercent(Number(c.prepaidDiscountPercent) || 0);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setActiveImg(0);
    fetchProductDetails(id).then((res: any) => {
      // backend returns the product object directly under `data`
      setProduct(res?.code === 1 ? (res.data as Product) : null);
      setLoading(false);
    });
  }, [id]);

  // Recommended products — real catalog items (featured, falling back to new
  // arrivals). Loaded once; the current product is filtered out at render.
  useEffect(() => {
    (async () => {
      let list = asList<any>((await fetchFeaturedProducts())?.data);
      if (!list.length) list = asList<any>((await fetchNewArrivals())?.data);
      setRecommended(list.map(normalizeProduct));
    })();
  }, []);

  const recommendedProducts = recommended
    .filter((rp) => rp._id !== id)
    .slice(0, 4);

  const onCardAdd = async (rp: Product) => {
    const r = await addToCartAction(rp, 1);
    if (r.ok) toast.success("Added to cart");
    else toast.error(r.message || "Could not add to cart");
  };

  const onCardWish = async (rp: Product) => {
    const r = await toggleWishlistAction(rp);
    if (!r.ok) toast.error(r.message || "Could not update wishlist");
  };

  // While the request is in flight we show a skeleton — never placeholder
  // product data — so the user perceives loading instead of seeing fake
  // details (e.g. "Product 1") swapped out a moment later.
  if (loading) {
    return (
      <div className="container pdp">
        <button className="back-link" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back to Products
        </button>
        <div className="pdp-card">
          <div className="pdp-grid">
            <div className="pdp-image">
              <div className="sk sk-image" />
              <div className="pdp-thumbs">
                <div className="sk sk-thumb" />
                <div className="sk sk-thumb" />
                <div className="sk sk-thumb" />
              </div>
            </div>
            <div className="pdp-info">
              <div className="sk sk-line" style={{ width: "40%" }} />
              <div className="sk sk-line sk-title" style={{ width: "75%" }} />
              <div className="sk sk-line" style={{ width: "100%" }} />
              <div className="sk sk-line" style={{ width: "92%" }} />
              <div className="sk sk-line" style={{ width: "60%", marginBottom: 28 }} />
              <div className="sk sk-line sk-price" style={{ width: "45%" }} />
              <div className="sk sk-specs">
                <div className="sk sk-line" style={{ width: "100%" }} />
                <div className="sk sk-line" style={{ width: "100%" }} />
                <div className="sk sk-line" style={{ width: "100%" }} />
              </div>
              <div className="pdp-actions">
                <div className="sk sk-btn" />
                <div className="sk sk-btn" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container pdp">
        <button className="back-link" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back to Products
        </button>
        <div className="pdp-card">
          <div className="pdp-empty">
            <h2>Product not found</h2>
            <p>This product may no longer be available.</p>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const p: Product = product;

  const images =
    p.productImages?.map((i) => i.url) ||
    (p.productImage ? [p.productImage] : []);

  return (
    <div className="container pdp">
      <button className="back-link" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back to Products
      </button>

      <div className="pdp-card">
      <div className="pdp-grid">
        <div className="pdp-image">
          {images[activeImg] ? (
            <img src={images[activeImg]} alt={p.productName} />
          ) : (
            <div className="empty" style={{ aspectRatio: "1/1" }}>No image</div>
          )}
          {images.length > 1 && (
            <div className="pdp-thumbs">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={i === activeImg ? "active" : ""}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <div className="pdp-rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <FaStar key={i} />
            ))}
            <span>(248 reviews)</span>
          </div>

          <h1 className="pdp-title">{p.productName}</h1>

          <p className="pdp-desc">
            {p.description ||
              "Beautiful handcrafted jewellery piece made with premium materials."}
          </p>

          <div className="pdp-price-block">
            <div className="pdp-price">
              ₹
              {Number(
                p.computedPrice || p.discountPrice || p.price,
              ).toLocaleString("en-IN")}
            </div>
            <div className="pdp-tax">Inclusive of all taxes</div>
            {p.goldBreakdown && (
              <details
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <summary
                  style={{
                    fontWeight: 600,
                    color: "var(--color-primary)",
                  }}
                >
                  How is this price calculated?
                </summary>
                <div
                  style={{
                    background: "#fff8e1",
                    border: "1px solid #f4d97a",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginTop: 6,
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    Weight: <strong>{p.goldBreakdown.weightGrams}g</strong>
                  </div>
                  <div>
                    Gold purity:{" "}
                    <strong>{p.goldBreakdown.goldPurityPercent}%</strong>
                  </div>
                  <div>
                    Making charge:{" "}
                    <strong>{p.goldBreakdown.makingChargePercent}%</strong>
                  </div>
                  <div>
                    Gold equivalent:{" "}
                    <strong>
                      {p.goldBreakdown.goldEquivalentGrams.toFixed(4)}g
                    </strong>{" "}
                    of 24K
                  </div>
                  <div>
                    24K rate today:{" "}
                    <strong>
                      ₹
                      {Number(p.goldBreakdown.rate24K).toLocaleString("en-IN")}
                      /g
                    </strong>
                  </div>
                </div>
              </details>
            )}
          </div>

          <div className="pdp-specs">
            {p.goldBreakdown ? (
              <>
                <div className="spec-row">
                  <span>Weight</span>
                  <strong>{p.goldBreakdown.weightGrams}g</strong>
                </div>
                <div className="spec-row">
                  <span>Gold purity</span>
                  <strong>{p.goldBreakdown.goldPurityPercent}%</strong>
                </div>
                <div className="spec-row">
                  <span>Making charge</span>
                  <strong>{p.goldBreakdown.makingChargePercent}%</strong>
                </div>
              </>
            ) : (
              <>
                <div className="spec-row">
                  <span>Material</span>
                  <strong>{(p as any).material || "—"}</strong>
                </div>
                <div className="spec-row">
                  <span>Purity</span>
                  <strong>BIS Hallmarked</strong>
                </div>
              </>
            )}
          </div>

          <div className="pdp-actions">
            <button
              className="btn btn-primary"
              onClick={async () => {
                const r = await addToCartAction(p, 1);
                if (r.ok) navigate("/checkout");
                else toast.error(r.message || "Could not add to cart");
              }}
            >
              <FiShoppingCart /> Buy Now
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={async () => {
                const r = await addToCartAction(p, 1);
                if (r.ok) toast.success("Added to cart");
                else toast.error(r.message || "Could not add to cart");
              }}
            >
              <FiShoppingCart /> Add to Cart
            </button>
            <button
              className="btn-icon"
              aria-label="Wishlist"
              onClick={async () => {
                const r = await toggleWishlistAction(p);
                if (!r.ok) {
                  toast.error(r.message || "Could not update wishlist");
                  return;
                }
                toast.success(
                  r.wishlisted ? "Added to wishlist" : "Removed from wishlist",
                );
              }}
            >
              <FiHeart />
            </button>
          </div>

          {prepaidPercent > 0 && (
            <p
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "#fdf4e3",
                border: "1px dashed #c9962b",
                borderRadius: 10,
                color: "#8a5a00",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              💸 Get a special {prepaidPercent}% discount on prepaid orders.
            </p>
          )}
        </div>
      </div>
      </div>

      {/* Recommended products — real catalog items so shoppers can keep
          browsing without going back. Hidden when there are none. */}
      {recommendedProducts.length > 0 && (
        <section className="pdp-reco">
          <h2 className="pdp-reco-title">You May Also Like</h2>
          <div className="grid grid-4">
            {recommendedProducts.map((rp) => (
              <ProductCard
                key={rp._id}
                product={rp}
                onAdd={onCardAdd}
                onWishlist={onCardWish}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
