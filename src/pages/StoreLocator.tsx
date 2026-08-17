import { useEffect, useState } from "react";
import { FiClock, FiMapPin, FiNavigation, FiPhone, FiHome } from "react-icons/fi";
import { fetchStores, type Store } from "../services/api";
import "./StoreLocator.css";

const directionsUrl = (store: Store) => {
  const query = store.latitude && store.longitude
    ? `${store.latitude},${store.longitude}`
    : [store.address, store.city, store.state, store.pincode].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

// No Google Maps JS API key is configured for this project, so the embed
// uses the key-less `output=embed` form instead of the Maps JavaScript API.
const embedUrl = (store: Store) => {
  const query = store.latitude && store.longitude
    ? `${store.latitude},${store.longitude}`
    : [store.address, store.city, store.state, store.pincode].filter(Boolean).join(", ");
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
};

export default function StoreLocator() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetchStores();
      const list = res.data || [];
      setStores(list);
      setSelectedId(list[0]?._id || null);
      setLoading(false);
    })();
  }, []);

  const selectedStore = stores.find((s) => s._id === selectedId) || stores[0];

  return (
    <div className="container store-locator-page">
      <h1>Store Locator</h1>
      <p className="store-locator-intro">Visit us in person at one of our stores.</p>

      {loading ? (
        <div className="spinner" />
      ) : stores.length === 0 ? (
        <div className="empty">
          <FiHome size={40} />
          <p>Store locations will appear here soon.</p>
        </div>
      ) : (
        <>
          {selectedStore && (
            <div className="store-map-wrap">
              <iframe
                key={selectedStore._id}
                title={`Map — ${selectedStore.name}`}
                src={embedUrl(selectedStore)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
          <div className="store-grid">
          {stores.map((store) => (
            <div
              key={store._id}
              className={`store-card ${store._id === selectedId ? "active" : ""}`}
              onClick={() => setSelectedId(store._id)}
            >
              <h3>{store.name}</h3>
              <p className="store-row">
                <FiMapPin />
                <span>{[store.address, store.city, store.state, store.pincode].filter(Boolean).join(", ")}</span>
              </p>
              {store.workingHours && (
                <p className="store-row">
                  <FiClock />
                  <span>{store.workingHours}</span>
                </p>
              )}
              {store.phone && (
                <p className="store-row">
                  <FiPhone />
                  <span>{store.phone}</span>
                </p>
              )}
              <div className="store-actions">
                <a href={directionsUrl(store)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <FiNavigation /> Directions
                </a>
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="btn btn-outline-primary">
                    <FiPhone /> Call
                  </a>
                )}
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
}
