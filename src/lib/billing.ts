import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";

type Provider = "click" | "payme" | "manual";

/**
 * Marks an order paid and opens the subscription — exactly once.
 * Safe to call repeatedly (webhook retries, double-clicks in admin): a second call is a no-op.
 */
export async function payOrder(orderId: number, provider: Provider): Promise<{ ok: boolean; already?: boolean; error?: string }> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    // the status guard in WHERE makes this atomic: only one caller flips pending → paid
    const [o] = await tx
      .update(s.orders)
      .set({ status: "paid", provider, paidAt: new Date() })
      .where(and(eq(s.orders.id, orderId), eq(s.orders.status, "pending")))
      .returning();
    if (!o) {
      const [exists] = await tx.select({ status: s.orders.status }).from(s.orders).where(eq(s.orders.id, orderId));
      if (!exists) return { ok: false, error: "Buyurtma topilmadi" };
      return exists.status === "paid" ? { ok: true, already: true } : { ok: false, error: "Buyurtma bekor qilingan" };
    }
    const [plan] = await tx.select().from(s.plans).where(eq(s.plans.id, o.planId));
    if (!plan) throw new Error("Tarif topilmadi");
    const now = new Date();
    await tx.insert(s.subscriptions).values({
      userId: o.userId, planId: o.planId, startsAt: now, status: "active", orderId: o.id,
      endsAt: plan.periodDays ? new Date(now.getTime() + plan.periodDays * 86400_000) : null,
      testsLeft: plan.testsLimit,
    });
    return { ok: true };
  });
}

/** Refund / cancel after payment: order becomes failed, the subscription it opened is cancelled. */
export async function revokeOrder(orderId: number) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.update(s.orders).set({ status: "failed" }).where(eq(s.orders.id, orderId));
    await tx.update(s.subscriptions).set({ status: "cancelled" }).where(eq(s.subscriptions.orderId, orderId));
  });
}

/** Direct grant from admin (no order). */
export async function grantPlan(userId: string, planId: number) {
  const db = await getDb();
  const [plan] = await db.select().from(s.plans).where(eq(s.plans.id, planId));
  if (!plan) throw new Error("Tarif topilmadi");
  const now = new Date();
  await db.insert(s.subscriptions).values({
    userId, planId, startsAt: now, status: "active",
    endsAt: plan.periodDays ? new Date(now.getTime() + plan.periodDays * 86400_000) : null,
    testsLeft: plan.testsLimit,
  });
}
