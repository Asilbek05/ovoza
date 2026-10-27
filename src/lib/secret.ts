/** Edge-safe: used by middleware and by server code. */
const DEV_SECRET = "dev-only-secret-change-me-please-0123456789";

export function authSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET (kamida 32 belgi) sozlanmagan");
    return new TextEncoder().encode(s && s.length >= 8 ? s : DEV_SECRET);
  }
  return new TextEncoder().encode(s);
}

export const USER_COOKIE = "tushun_session";
export const ADMIN_COOKIE = "tushun_admin";
export const GUEST_COOKIE = "tushun_guest";
