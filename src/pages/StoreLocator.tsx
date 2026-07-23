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

export default function StoreLocator() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetchStores();
      setStores(res.data || []);
      setLoading(false);
    })();
  }, []);

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
        <div className="store-grid">
          {stores.map((store) => (
            <div key={store._id} className="store-card">
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
      )}
    </div>
  );
}
