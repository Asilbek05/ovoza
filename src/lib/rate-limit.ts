import "server-only";
import { headers } from "next/headers";

type Hit = { count: number; reset: number };
const g = globalThis as unknown as { __tushunRate?: Map<string, Hit> };
const store = (g.__tushunRate ??= new Map<string, Hit>());

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Fixed-window limiter, per server instance. Returns seconds to wait, or 0 when allowed. */
export async function rateLimit(scope: string, max: number, windowSec: number, key?: string): Promise<number> {
  const id = `${scope}:${key ?? (await clientIp())}`;
  const now = Date.now();
  if (store.size > 5000) for (const [k, v] of store) if (v.reset < now) store.delete(k);
  const hit = store.get(id);
  if (!hit || hit.reset < now) {
    store.set(id, { count: 1, reset: now + windowSec * 1000 });
    return 0;
  }
  hit.count++;
  return hit.count > max ? Math.ceil((hit.reset - now) / 1000) : 0;
}

export async function rateReset(scope: string, key?: string) {
  store.delete(`${scope}:${key ?? (await clientIp())}`);
}

export const waitText = (sec: number) => `Juda koʻp urinish. ${sec > 60 ? `${Math.ceil(sec / 60)} daqiqadan` : `${sec} soniyadan`} keyin qayta urinib koʻring.`;
