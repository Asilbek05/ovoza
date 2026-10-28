import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { payOrder, revokeOrder } from "@/lib/billing";
import { clickConfigured } from "@/lib/payments";

/** Click Shop API (prepare / complete). Docs: https://docs.click.uz */
const md5 = (v: string) => createHash("md5").update(v).digest("hex");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

type Form = Record<string, string>;
const out = (base: Form, error: number, note: string, extra: Record<string, unknown> = {}) =>
  Response.json({ click_trans_id: base.click_trans_id, merchant_trans_id: base.merchant_trans_id, ...extra, error, error_note: note });

export async function clickHandler(req: Request, step: "prepare" | "complete") {
  const raw = await req.text();
  const f: Form = Object.fromEntries(new URLSearchParams(raw));
  if (!clickConfigured()) return out(f, -8, "Click sozlanmagan");

  const secret = process.env.CLICK_SECRET_KEY!;
  const prepareId = step === "complete" ? f.merchant_prepare_id ?? "" : "";
  const sign = md5(`${f.click_trans_id}${f.service_id}${secret}${f.merchant_trans_id}${prepareId}${f.amount}${f.action}${f.sign_time}`);
  if (f.service_id !== process.env.CLICK_SERVICE_ID || !same(sign, f.sign_string ?? "")) return out(f, -1, "SIGN CHECK FAILED!");
  if (f.action !== (step === "prepare" ? "0" : "1")) return out(f, -3, "Action not found");

  const db = await getDb();
  const orderId = Number(f.merchant_trans_id);
  if (!Number.isInteger(orderId)) return out(f, -5, "Order not found");
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
  if (!o) return out(f, -5, "Order not found");
  if (Math.abs(Number(f.amount) - o.amountUzs) > 0.01) return out(f, -2, "Incorrect parameter amount");

  const [t] = await db.select().from(s.paymentTransactions).where(and(eq(s.paymentTransactions.provider, "click"), eq(s.paymentTransactions.providerTransId, f.click_trans_id)));

  if (step === "prepare") {
    if (o.status === "paid") return out(f, -4, "Already paid");
    if (o.status !== "pending") return out(f, -9, "Transaction cancelled");
    if (t) return out(f, 0, "Success", { merchant_prepare_id: t.id });
    const [created] = await db.insert(s.paymentTransactions).values({ provider: "click", providerTransId: f.click_trans_id, orderId, amountUzs: o.amountUzs, state: 1, createTime: Date.now() }).returning();
    return out(f, 0, "Success", { merchant_prepare_id: created.id });
  }

  // complete
  if (!t || String(t.id) !== prepareId) return out(f, -6, "Transaction does not exist");
  if (t.state === 2) return out(f, -4, "Already paid");
  if (t.state < 0) return out(f, -9, "Transaction cancelled");
  if (Number(f.error) < 0) {
    // Click reports the payment failed on its side
    await db.update(s.paymentTransactions).set({ state: -1, cancelTime: Date.now() }).where(eq(s.paymentTransactions.id, t.id));
    return out(f, -9, "Transaction cancelled");
  }
  const r = await payOrder(orderId, "click");
  if (!r.ok) {
    if (o.status === "failed") await revokeOrder(orderId);
    return out(f, -7, r.error ?? "Failed to update user");
  }
  await db.update(s.paymentTransactions).set({ state: 2, performTime: Date.now() }).where(eq(s.paymentTransactions.id, t.id));
  return out(f, 0, "Success", { merchant_confirm_id: t.id });
}
