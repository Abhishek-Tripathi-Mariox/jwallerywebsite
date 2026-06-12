import { useEffect, useRef, useState } from "react";
import { FiX, FiMapPin, FiLoader } from "react-icons/fi";
import {
  getCurrentCoords,
  reverseGeocode,
  lookupIndianPincode,
} from "../../lib/location";
import "./AddressModal.css";

export interface AddressFormValues {
  fullName: string;
  email: string;
  pincode: string;
  city: string;
  state: string;
  houseNo: string;
  apartment: string;
  addressType: "Home" | "Work";
}

interface Props {
  open: boolean;
  initialValues?: Partial<AddressFormValues>;
  onClose: () => void;
  onSave: (data: AddressFormValues) => Promise<void> | void;
}

const blank: AddressFormValues = {
  fullName: "",
  email: "",
  pincode: "",
  city: "",
  state: "",
  houseNo: "",
  apartment: "",
  addressType: "Home",
};

export default function AddressModal({ open, initialValues, onClose, onSave }: Props) {
  const [values, setValues] = useState<AddressFormValues>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [pinLookingUp, setPinLookingUp] = useState(false);
  const pinLookupCtl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setValues({ ...blank, ...(initialValues || {}) });
      setError(null);
    }
  }, [open, initialValues]);

  // Auto-fill city/state when the user types a 6-digit pincode. We don't
  // overwrite a city/state the user already typed manually — only fill blanks.
  useEffect(() => {
    if (!open) return;
    const pin = values.pincode;
    if (!/^\d{6}$/.test(pin)) return;
    if (values.city.trim() && values.state.trim()) return;

    pinLookupCtl.current?.abort();
    const ctl = new AbortController();
    pinLookupCtl.current = ctl;
    setPinLookingUp(true);

    (async () => {
      const res = await lookupIndianPincode(pin);
      if (ctl.signal.aborted) return;
      setPinLookingUp(false);
      if (!res) return;
      setValues((s) => ({
        ...s,
        city: s.city.trim() ? s.city : res.city,
        state: s.state.trim() ? s.state : res.state,
      }));
    })();

    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.pincode, open]);

  if (!open) return null;

  const set = <K extends keyof AddressFormValues>(k: K, v: AddressFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const handleUseCurrentLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const coords = await getCurrentCoords();
      if (!coords) {
        setError(
          "Couldn't read your location. Please allow location access and try again.",
        );
        return;
      }
      const resolved = await reverseGeocode(coords.lat, coords.lng);
      if (!resolved) {
        setError("Couldn't look up your address. Please fill it in manually.");
        return;
      }
      // Only fill blanks — never overwrite something the user already typed.
      setValues((s) => ({
        ...s,
        pincode: s.pincode || resolved.pincode || "",
        city: s.city || resolved.city || "",
        state: s.state || resolved.state || "",
        houseNo: s.houseNo || resolved.houseNo || "",
        apartment: s.apartment || resolved.apartment || "",
      }));
    } finally {
      setLocating(false);
    }
  };

  const validate = (): string | null => {
    if (!values.fullName.trim()) return "Please enter your full name";
    if (!values.email.trim()) return "Please enter an email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return "Please enter a valid email";
    if (!/^\d{6}$/.test(values.pincode)) return "Please enter a valid 6-digit pincode";
    if (!values.city.trim()) return "Please enter a city";
    if (!values.state.trim()) return "Please enter a state";
    if (!values.houseNo.trim()) return "Please enter a house number";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="addr-modal-overlay" onClick={onClose}>
      <div className="addr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="addr-modal-close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>

        <h2 className="addr-modal-title">
          {initialValues?.fullName ? "Edit Delivery Address" : "Add Delivery Address"}
        </h2>
        <div className="addr-modal-divider" />

        <button
          type="button"
          className="addr-location-btn"
          onClick={handleUseCurrentLocation}
          disabled={locating}
        >
          {locating ? <FiLoader className="spin" /> : <FiMapPin />}
          {locating ? "Finding your location..." : "Use Current Location"}
        </button>

        <form onSubmit={handleSubmit} className="addr-form">
          <div className="addr-input-with-hint">
            <input
              className="addr-input"
              placeholder="Pincode*"
              value={values.pincode}
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {pinLookingUp && <span className="addr-input-hint">Looking up…</span>}
          </div>
          <div className="addr-row">
            <input
              className="addr-input"
              placeholder="City*"
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <input
              className="addr-input"
              placeholder="State*"
              value={values.state}
              onChange={(e) => set("state", e.target.value)}
            />
          </div>
          <input
            className="addr-input"
            placeholder="House No.*"
            value={values.houseNo}
            onChange={(e) => set("houseNo", e.target.value)}
          />
          <input
            className="addr-input"
            placeholder="Apartment / Street / Area"
            value={values.apartment}
            onChange={(e) => set("apartment", e.target.value)}
          />

          <div className="addr-section-label">Customer Information*</div>
          <input
            className="addr-input"
            placeholder="Full Name*"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
          <input
            className="addr-input"
            placeholder="Email Address*"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />

          <p className="addr-info">
            Please enter the complete address for smooth delivery.
          </p>

          <div className="addr-section-label">Save Address As</div>
          <div className="addr-type-row">
            {(["Home", "Work"] as const).map((t) => (
              <button
                type="button"
                key={t}
                className={`addr-type-btn ${values.addressType === t ? "active" : ""}`}
                onClick={() => set("addressType", t)}
              >
                <span>{t}</span>
                <span className={`addr-radio ${values.addressType === t ? "active" : ""}`} />
              </button>
            ))}
          </div>

          {error && <div className="addr-error">{error}</div>}

          <button type="submit" className="addr-submit" disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
