# Jewellery Website (React + Vite + TypeScript)

Customer-facing website for the Swarnaz Jewellery platform. Reuses the existing
backend APIs (`/v1/api/user/*`) shared with the React Native app and admin panel.

## Setup

```bash
cd website
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if needed
npm run dev
```

Default API base: `http://localhost:9110/v1/api`.

## Stack
- Vite + React 18 + TypeScript
- React Router v6
- Axios with auth interceptor (token stored in `localStorage.userToken`)
- Zustand for global state (auth, cart/wishlist counts)
- react-icons

## Structure
```
src/
  components/
    layout/      Header, Footer, PriceTicker
    shared/      ProductCard, etc.
  pages/         Home, Category, ProductDetail, Cart, Wishlist, Login, Profile
  services/      api.ts (wraps backend endpoints)
  store/         Zustand stores
  lib/           axios instance
  types/         shared TS types
  styles/        global.css
```

## Notes
- The Home page mirrors the Figma design (Hero, Shop by Category, Offer Banners,
  Trending, Explore Collections, New Arrivals, Sundar Keel, Find Your Match,
  Best Sellers, Assurance, CTA banner).
- All content is wired to the backend; fallbacks render gracefully when data is
  empty.
# jwellery-website-swaraj
# jwallerywebsite
