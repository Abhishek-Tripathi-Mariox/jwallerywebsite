import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  fetchProductsBrowse,
  fetchCategories,
  fetchCategoryById,
  asList,
  normalizeProduct,
} from "../services/api";
import type { Product } from "../types";
import ProductCard from "../components/shared/ProductCard";
import { A } from "../assets/figma";
import { FiChevronDown } from "react-icons/fi";
import { addToCartAction, toggleWishlistAction } from "../lib/cartActions";
import { toast } from "../store/toastStore";
import "./Category.css";

// Values match backend's expected `sortBy` query param.
const SORTS = [
  { v: "newest",     l: "Newest First" },
  { v: "price_low",  l: "Price: Low to High" },
  { v: "price_high", l: "Price: High to Low" },
  { v: "rating",     l: "Top Rated" },
];

const PER_PAGE = 24;
const isObjectId = (s?: string) => !!s && /^[a-f0-9]{24}$/i.test(s);

// Fixed option lists (must match the values the admin product form offers).
const MATERIALS = ["22K Gold", "18K Gold", "24K Gold", "999 Silver", "Rose Gold", "Pearl", "Stone", "Diamond"];
const BRANDS = ["Swarnaz"];
const GOLD_MATERIALS = ["22K Gold", "18K Gold", "24K Gold", "Rose Gold"];
const SILVER_MATERIALS = ["999 Silver"];

type Cat = { _id: string; categoryName: string; image?: string };

export default function Category() {
  // Accept the category from either the legacy path (/category/:id) or the
  // filter-page query string (/shop?category=<id>). The query form makes it a
  // proper, editable filter rather than a fixed "category detail" URL.
  const { id } = useParams();
  // `searchParams` makes the component re-render on URL change; we read the
  // category from the live URL too as a fallback, because useSearchParams can
  // briefly return empty on the first render after a client-side navigation —
  // which caused a flash of "all products" before the category filter applied.
  const [searchParams] = useSearchParams();
  const activeCatId = isObjectId(id)
    ? (id as string)
    : searchParams.get("category") ||
      new URLSearchParams(window.location.search).get("category") ||
      "";

  // Header/Home nav links to "Gold", "Silver", "New Arrivals", "Offers" pass
  // these as either /category/<slug> (legacy path) or /shop?material=...&
  // discounted=...&sort=... (query form) — accept both so nothing silently
  // falls through to an unfiltered "all products" list.
  const rawSlug = !isObjectId(id) && id ? id : "";
  const materialParam = (
    searchParams.get("material") ||
    (rawSlug === "gold" || rawSlug === "silver" ? rawSlug : "")
  ).toLowerCase();
  const discountedParam =
    searchParams.get("discounted") === "true" || rawSlug === "offers";
  const sortParam =
    searchParams.get("sort") || (rawSlug === "new-arrivals" ? "newest" : "");
  const materialsForParam = (param: string): string[] =>
    param === "gold" ? GOLD_MATERIALS : param === "silver" ? SILVER_MATERIALS : [];

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(sortParam || "newest");
  const [page, setPage] = useState(1);

  // Real categories drive the sidebar filter; the URL category is pre-checked.
  const [allCategories, setAllCategories] = useState<Cat[]>([]);
  const [selCatIds, setSelCatIds] = useState<Set<string>>(
    () => (activeCatId ? new Set([activeCatId]) : new Set())
  );
  const [selMaterials, setSelMaterials] = useState<Set<string>>(
    () => new Set(materialsForParam(materialParam))
  );
  const [selBrands, setSelBrands] = useState<Set<string>>(new Set());
  const [discountOnly, setDiscountOnly] = useState<boolean>(discountedParam);
  // The category the user navigated to — drives the hero title + banner image.
  const [activeCategory, setActiveCategory] = useState<Cat | null>(null);

  // Price filter: draft inputs + applied bounds. Empty = no filter, no max cap.
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [priceFilter, setPriceFilter] = useState<{ min?: number; max?: number }>({});

  // "Shop Now" in the hero scrolls down to the product grid, already loaded
  // on this same page — there's nowhere else for it to navigate to.
  const productsRef = useRef<HTMLDivElement | null>(null);
  const scrollToProducts = () => productsRef.current?.scrollIntoView({ behavior: "smooth" });

  // Quick-filter buttons above the product list — force the matching
  // (possibly collapsed, on mobile) sidebar group open and scroll to it.
  const categoriesGroupRef = useRef<FilterGroupHandle | null>(null);
  const materialGroupRef = useRef<FilterGroupHandle | null>(null);
  const brandGroupRef = useRef<FilterGroupHandle | null>(null);
  const priceGroupRef = useRef<FilterGroupHandle | null>(null);
  const jumpToFilter = (ref: React.RefObject<FilterGroupHandle | null>) => {
    ref.current?.open();
    requestAnimationFrame(() =>
      ref.current?.el?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // Load the category list once for the sidebar.
  useEffect(() => {
    fetchCategories().then((r: any) => {
      setAllCategories(asList<Cat>(r?.data));
    });
  }, []);

  // Reset the category selection only when the URL category actually changes
  // (not on first mount — selCatIds is already seeded from the URL above, so
  // resetting on mount would cause a redundant/duplicate fetch).
  const lastCatRef = useRef(activeCatId);
  useEffect(() => {
    if (activeCatId !== lastCatRef.current) {
      lastCatRef.current = activeCatId;
      setPage(1);
      setSelCatIds(activeCatId ? new Set([activeCatId]) : new Set());
    }
    // Load the banner + title for the navigated-to category.
    if (activeCatId) {
      fetchCategoryById(activeCatId).then((r: any) => {
        const d = r?.data;
        if (d?._id) {
          setActiveCategory({ _id: d._id, categoryName: d.categoryName, image: d.image });
        }
      });
    } else {
      setActiveCategory(null);
    }
  }, [activeCatId]);

  // Same idea as activeCatId above, for the nav-driven material/offers/sort
  // presets — re-apply when the user clicks a different header link while
  // already on this page (client-side routing won't remount the component).
  const lastMaterialRef = useRef(materialParam);
  const lastDiscountedRef = useRef(discountedParam);
  const lastSortRef = useRef(sortParam);
  useEffect(() => {
    if (materialParam !== lastMaterialRef.current) {
      lastMaterialRef.current = materialParam;
      setPage(1);
      setSelMaterials(new Set(materialsForParam(materialParam)));
    }
    if (discountedParam !== lastDiscountedRef.current) {
      lastDiscountedRef.current = discountedParam;
      setPage(1);
      setDiscountOnly(discountedParam);
    }
    if (sortParam && sortParam !== lastSortRef.current) {
      lastSortRef.current = sortParam;
      setSort(sortParam);
    }
  }, [materialParam, discountedParam, sortParam]);

  // Re-fetch whenever filters change. The public browse endpoint works for
  // guests, so products show whether or not the visitor is logged in.
  useEffect(() => {
    setLoading(true);
    fetchProductsBrowse({
      categoryIds: Array.from(selCatIds),
      materials: Array.from(selMaterials),
      brands: Array.from(selBrands),
      ...(priceFilter.min != null ? { minPrice: priceFilter.min } : {}),
      ...(priceFilter.max != null ? { maxPrice: priceFilter.max } : {}),
      sortBy: sort,
      page,
      limit: PER_PAGE,
      discounted: discountOnly,
    }).then((res: any) => {
      const d = res?.data;
      setProducts(asList<any>(d).map(normalizeProduct));
      setTotal(typeof d?.total === "number" ? d.total : asList<any>(d).length);
      setLoading(false);
    });
  }, [selCatIds, selMaterials, selBrands, priceFilter, sort, page, discountOnly]);

  const onAdd = async (p: Product) => {
    const r = await addToCartAction(p, 1);
    if (r.ok) toast.success("Added to cart");
    else toast.error(r.message || "Could not add to cart");
  };
  const onWish = async (p: Product) => {
    const r = await toggleWishlistAction(p);
    if (!r.ok) {
      toast.error(r.message || "Could not update wishlist");
      return;
    }
    toast.success(r.wishlisted ? "Added to wishlist" : "Removed from wishlist");
  };

  const toggleCat = (cid: string) => {
    setPage(1);
    setSelCatIds((prev) => {
      const next = new Set(prev);
      next.has(cid) ? next.delete(cid) : next.add(cid);
      return next;
    });
  };

  const toggleIn = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    val: string
  ) => {
    setPage(1);
    setter((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  };

  const applyPrice = () => {
    const parse = (s: string) => {
      const n = Number(s.trim());
      return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    setPage(1);
    setPriceFilter({ min: parse(minInput), max: parse(maxInput) });
  };

  const clearPrice = () => {
    setMinInput("");
    setMaxInput("");
    setPage(1);
    setPriceFilter({});
  };

  const presetTitle =
    materialParam === "gold"
      ? "Gold Jewellery"
      : materialParam === "silver"
      ? "Silver Jewellery"
      : discountedParam
      ? "Offers"
      : sortParam === "newest"
      ? "New Arrivals"
      : "";
  const slugTitle = (id || "products").toString().replace(/-/g, " ");
  const heroTitle = `Timeless ${activeCategory?.categoryName || presetTitle || slugTitle}`;
  const heroImage = activeCategory?.image || A.banner.bridal;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="cat-page">
      <div className="container">
        {/* Hero banner — dynamic: uses the category's own image when available */}
        <section
          className="cat-hero"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0) 100%), url(${heroImage})`,
          }}
        >
          <div className="cat-hero-text">
            <h1>{heroTitle.toUpperCase()}</h1>
            <p>Discover handcrafted designs that celebrate timeless elegance — perfect for every occasion.</p>
            <button className="btn btn-primary" onClick={scrollToProducts}>Shop Now</button>
          </div>
        </section>

        <h2 className="cat-title">Our Products</h2>

        {/* Quick filter nav — jumps straight to a sidebar filter group,
            which may be collapsed on mobile, instead of making users scroll
            and expand it themselves. */}
        <div className="cat-quick-filters">
          <button type="button" onClick={() => jumpToFilter(categoriesGroupRef)}>Categories</button>
          <button type="button" onClick={() => jumpToFilter(materialGroupRef)}>Material</button>
          <button type="button" onClick={() => jumpToFilter(brandGroupRef)}>Brand</button>
          <button type="button" onClick={() => jumpToFilter(priceGroupRef)}>Price Range</button>
        </div>

        {/* Title bar */}
        <div className="cat-toolbar">
          <div className="cat-toolbar-right">
            <span className="cat-count">{total} items</span>
            <label className="cat-sort">
              <span>Sort by:</span>
              <select value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }}>
                {SORTS.map((s) => (
                  <option key={s.v} value={s.v}>{s.l}</option>
                ))}
              </select>
              <FiChevronDown />
            </label>
          </div>
        </div>

        <div className="cat-layout" ref={productsRef}>
          {/* Sidebar */}
          <aside className="cat-sidebar">
            <FilterGroup title="Categories" ref={categoriesGroupRef}>
              {allCategories.length === 0 ? (
                <span className="filter-empty">Loading…</span>
              ) : (
                allCategories.map((c) => (
                  <label key={c._id} className="filter-row">
                    <input
                      type="checkbox"
                      checked={selCatIds.has(c._id)}
                      onChange={() => toggleCat(c._id)}
                    />
                    <span>{c.categoryName}</span>
                  </label>
                ))
              )}
            </FilterGroup>

            <FilterGroup title="Material" ref={materialGroupRef}>
              {MATERIALS.map((m) => (
                <label key={m} className="filter-row">
                  <input
                    type="checkbox"
                    checked={selMaterials.has(m)}
                    onChange={() => toggleIn(setSelMaterials, m)}
                  />
                  <span>{m}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Brand" ref={brandGroupRef}>
              {BRANDS.map((b) => (
                <label key={b} className="filter-row">
                  <input
                    type="checkbox"
                    checked={selBrands.has(b)}
                    onChange={() => toggleIn(setSelBrands, b)}
                  />
                  <span>{b}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Price Range" ref={priceGroupRef}>
              <div className="filter-price">
                <div className="filter-price-inputs">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Min ₹"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                    className="filter-price-input"
                  />
                  <span className="filter-price-sep">–</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Max ₹ (no limit)"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                    className="filter-price-input"
                  />
                </div>
                <div className="filter-price-actions">
                  <button className="btn btn-primary btn-sm" onClick={applyPrice}>
                    Apply
                  </button>
                  {(priceFilter.min != null || priceFilter.max != null) && (
                    <button className="filter-price-clear" onClick={clearPrice}>
                      Clear
                    </button>
                  )}
                </div>
                {(priceFilter.min != null || priceFilter.max != null) && (
                  <p className="filter-price-summary">
                    {priceFilter.min != null
                      ? `₹${priceFilter.min.toLocaleString("en-IN")}`
                      : "₹0"}
                    {" – "}
                    {priceFilter.max != null
                      ? `₹${priceFilter.max.toLocaleString("en-IN")}`
                      : "No limit"}
                  </p>
                )}
              </div>
            </FilterGroup>
          </aside>

          {/* Grid */}
          <div className="cat-content">
            {loading ? (
              <div className="spinner" />
            ) : products.length === 0 ? (
              <div className="empty">No products match these filters.</div>
            ) : (
              <>
                <div className="cat-grid">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} onAdd={onAdd} onWishlist={onWish} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="cat-pager">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        className={"cat-pager-dot" + (n === page ? " active" : "")}
                        onClick={() => setPage(n)}
                        aria-label={`Page ${n}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface FilterGroupHandle {
  open: () => void;
  el: HTMLDivElement | null;
}

const FilterGroup = forwardRef<
  FilterGroupHandle,
  { title: string; children: React.ReactNode }
>(function FilterGroup({ title, children }, ref) {
  // Collapsed by default on mobile (sidebar renders above the product grid
  // there, per Category.css's 820px breakpoint) so users see products sooner
  // instead of scrolling past four open filter groups first.
  const [open, setOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 820,
  );
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Lets the quick-filter buttons above the product list force this group
  // open (it may currently be collapsed on mobile) and scroll to it.
  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    get el() {
      return wrapRef.current;
    },
  }));

  return (
    <div className="filter-group" ref={wrapRef}>
      <button className="filter-head" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <FiChevronDown style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && <div className="filter-body">{children}</div>}
    </div>
  );
});
