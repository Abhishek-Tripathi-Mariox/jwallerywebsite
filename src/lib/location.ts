/**
 * Lightweight geocoding helpers backed by free public APIs.
 *
 * - Browser Geolocation API for the user's coordinates.
 * - Nominatim (OpenStreetMap) for reverse geocoding lat/lng -> address parts.
 * - api.postalpincode.in for Indian PIN -> city/state lookup.
 *
 * All callers must tolerate failure: each helper returns a partial result
 * (or null) so the modal can fall back to manual entry without crashing.
 */

export interface ResolvedLocation {
  pincode?: string;
  city?: string;
  state?: string;
  houseNo?: string;
  apartment?: string;
}

/**
 * Wrap the browser geolocation in a promise. Resolves to null when the user
 * denies permission or the device has no fix. We don't differentiate failure
 * modes — the caller just gets null and shows a generic toast.
 */
export const getCurrentCoords = (): Promise<{
  lat: number;
  lng: number;
} | null> =>
  new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });

/**
 * Reverse-geocode lat/lng -> structured address using Nominatim. Their usage
 * policy asks for a unique User-Agent / Referer; browsers send Referer
 * automatically. Free tier limit is 1 req/sec, which is fine for a one-shot
 * "use current location" click.
 */
export const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<ResolvedLocation | null> => {
  try {
    // Force English results — without `accept-language`, Nominatim returns
    // names in the local script (e.g. "कासगंज" for Kasganj). The query param
    // is the documented control; we also send the header for older mirrors.
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1&accept-language=en`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const a = json?.address || {};
    const nd = json?.namedetails || {};

    // Belt-and-suspenders: if a returned field still contains non-ASCII
    // characters (e.g. Devanagari), prefer the `name:en` from namedetails.
    // This handles mirrors that ignore accept-language for some fields.
    const isAscii = (v?: string) => !!v && /^[\x00-\x7F]+$/.test(v);
    const pickEn = (val: string | undefined, enKey: string) => {
      if (isAscii(val)) return val;
      const en = nd[enKey];
      return isAscii(en) ? en : val;
    };

    const houseNo = [a.house_number, a.road].filter(Boolean).join(" ");
    const apartment = a.neighbourhood || a.suburb || a.village || "";
    const city =
      pickEn(a.city, "name:en") ||
      pickEn(a.town, "name:en") ||
      pickEn(a.village, "name:en") ||
      pickEn(a.county, "name:en") ||
      pickEn(a.state_district, "name:en") ||
      "";
    const state = pickEn(a.state, "name:en") || "";
    const pincode = a.postcode || "";

    return {
      pincode: pincode && /^\d{6}$/.test(pincode) ? pincode : undefined,
      city: city || undefined,
      state: state || undefined,
      houseNo: houseNo || undefined,
      apartment: apartment || undefined,
    };
  } catch {
    return null;
  }
};

/**
 * Look up an Indian PIN code via the free postalpincode.in API. Returns city +
 * state when at least one post office is found, else null.
 */
export const lookupIndianPincode = async (
  pincode: string,
): Promise<{ city: string; state: string } | null> => {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!res.ok) return null;
    const json: any = await res.json();
    const offices = Array.isArray(json) ? json[0]?.PostOffice : null;
    if (!offices || offices.length === 0) return null;
    const first = offices[0];
    const city =
      first.District || first.Block || first.Division || first.Region || "";
    const state = first.State || "";
    if (!city && !state) return null;
    return { city, state };
  } catch {
    return null;
  }
};
