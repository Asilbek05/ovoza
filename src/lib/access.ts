import "server-only";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const FREE_EXPLANATIONS = 3;

export async function getActiveSubscription(userId: string | null | undefined) {
  if (!userId) return null;
  const db = await getDb();
  const now = new Date();
  const [sub] = await db
    .select({ sub: schema.subscriptions, plan: schema.plans })
    .from(schema.subscriptions)
    .innerJoin(schema.plans, eq(schema.plans.id, schema.subscriptions.planId))
    .where(
      and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, "active"),
        or(isNull(schema.subscriptions.endsAt), gt(schema.subscriptions.endsAt, now)),
      ),
    )
    .orderBy(desc(schema.subscriptions.startsAt))
    .limit(1);
  return sub ?? null;
}

export async function hasFullAccess(userId: string | null | undefined) {
  const s = await getActiveSubscription(userId);
  if (!s) return false;
  if (s.sub.testsLeft !== null && s.sub.testsLeft !== undefined && s.sub.testsLeft <= 0 && !s.sub.endsAt) return false;
  return true;
}
