import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

import { ADMIN_COOKIE, GUEST_COOKIE, USER_COOKIE, authSecret as secret } from "./secret";

async function sign(payload: Record<string, unknown>, days: number) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${days}d`).sign(secret());
}
async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T;
  } catch {
    return null;
  }
}

const cookieOpts = (days: number) => ({
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: days * 86400,
});

export async function setUserSession(userId: string) {
  (await cookies()).set(USER_COOKIE, await sign({ uid: userId }, 60), cookieOpts(60));
}
export async function clearUserSession() {
  (await cookies()).delete(USER_COOKIE);
}
export async function getCurrentUser() {
  const p = await verify<{ uid: string }>((await cookies()).get(USER_COOKIE)?.value);
  if (!p?.uid) return null;
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, p.uid)).limit(1);
  return u ?? null;
}

export async function setAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, await sign({ admin: true }, 7), cookieOpts(7));
}
export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
export async function isAdmin() {
  const p = await verify<{ admin: boolean }>((await cookies()).get(ADMIN_COOKIE)?.value);
  return p?.admin === true;
}

/** Read guest id (no write). */
export async function readGuestId() {
  return (await cookies()).get(GUEST_COOKIE)?.value ?? null;
}
/** Get or create guest id. Only call from server actions / route handlers. */
export async function ensureGuestId() {
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  if (!id) {
    id = crypto.randomUUID();
    jar.set(GUEST_COOKIE, id, cookieOpts(180));
  }
  return id;
}
