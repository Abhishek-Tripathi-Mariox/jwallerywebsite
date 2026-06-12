import { Link } from "react-router-dom";
import { FiHeart, FiShoppingBag } from "react-icons/fi";
import type { Product } from "../../types";
import { hasToken } from "../../lib/authGate";
import { useUiStore } from "../../store";
import { useIsGuestWishlisted } from "../../store/guestStore";
import "./ProductCard.css";

interface Props {
  product: Product;
  onAdd?: (p: Product) => void;
  onWishlist?: (p: Product) => void;
}

const formatPrice = (n?: number) =>
  n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

export default function ProductCard({ product, onAdd, onWishlist }: Props) {
  const img = product.productImages?.[0]?.url || product.productImage;

  // Reflect wishlisted state from the correct source: the server-backed UI
  // store when logged in, the local guest store otherwise.
  const serverWishlisted = useUiStore((s) => !!s.wishlistIds[product._id]);
  const guestWishlisted = useIsGuestWishlisted(product._id);
  const wishlisted = hasToken() ? serverWishlisted : guestWishlisted;

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="product-img-wrap">
        {img ? (
          <img src={img} alt={product.productName} loading="lazy" />
        ) : (
          <div className="img-placeholder">No Image</div>
        )}
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          type="button"
          className={`wishlist-btn ${wishlisted ? "active" : ""}`}
          onClick={(e) => {
            // Inside a <Link> — stop the click from triggering navigation.
            e.preventDefault();
            e.stopPropagation();
            onWishlist?.(product);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
        >
          <FiHeart />
        </button>
      </Link>
      <div className="product-body">
        <h4 className="product-name">{product.productName}</h4>
        <div className="product-row">
          <div className="product-price">
            {formatPrice(
              product.computedPrice ||
                product.discountPrice ||
                product.price,
            )}
          </div>
          <button
            className="add-btn"
            onClick={() => onAdd?.(product)}
            aria-label="Add to cart"
          >
            <FiShoppingBag />
          </button>
        </div>
      </div>
    </div>
  );
}
