/**
 * Returns true if the response indicates an auth failure (401 / code 3).
 * If `redirect` is true and there's no token, sends the user to /login.
 */
export function isAuthError(res: any): boolean {
  if (!res) return false;
  if (res.code === 3) return true;
  return false;
}

export function hasToken(): boolean {
  return !!localStorage.getItem("userToken");
}

/**
 * Used by buy/wishlist/cart actions: if not logged in, send to /login and
 * return false. The caller should bail out when this returns false.
 */
export function requireAuth(navigate: (to: string) => void): boolean {
  if (hasToken()) return true;
  navigate("/login");
  return false;
}
