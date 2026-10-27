"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb, schema as s } from "@/db";
import { clearUserSession, ensureGuestId, getCurrentUser, readGuestId, setUserSession } from "@/lib/session";
import { getActiveSubscription } from "@/lib/access";
import { claimGuestAttempts, expireIfOverdue, finalizeAttempt, getOwnedAttempt } from "@/lib/attempts";
import { rateLimit, rateReset, waitText } from "@/lib/rate-limit";

type FormState = { ok: false; error: string; field?: string } | null;

const safeNext = (v: FormDataEntryValue | null) => {
  const n = String(v ?? "");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/kabinet";
};
const normPhone = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length === 9 ? `998${d}` : d;
};

/* ───────── Auth ───────── */

const regSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting").max(60, "Ism juda uzun"),
  phone: z.string().regex(/^998\d{9}$/, "Telefon raqamini toʻliq kiriting: +998 XX XXX XX XX"),
  password: z.string().min(6, "Parol kamida 6 belgi").max(72, "Parol 72 belgidan oshmasin"),
  audience: z.enum(["teacher", "applicant"]),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const wait = await rateLimit("register", 8, 3600);
  if (wait) return { ok: false, error: waitText(wait) };
  const parsed = regSchema.safeParse({
    name: form.get("name"), phone: normPhone(String(form.get("phone") ?? "")), password: form.get("password"), audience: form.get("audience") || "teacher",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message, field: String(parsed.error.issues[0].path[0]) };
  const db = await getDb();
  const [exists] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.phone, parsed.data.phone));
  if (exists) return { ok: false, error: "Bu raqam bilan roʻyxatdan oʻtilgan. Kirish sahifasidan kiring.", field: "phone" };
  const [u] = await db
    .insert(s.users)
    .values({ name: parsed.data.name, phone: parsed.data.phone, audience: parsed.data.audience, passwordHash: await bcrypt.hash(parsed.data.password, 10) })
    .returning();
  await setUserSession(u.id);
  await claimGuestAttempts(u.id, await readGuestId());
  redirect(safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const phone = normPhone(String(form.get("phone") ?? ""));
  const password = String(form.get("password") ?? "").slice(0, 200);
  const wait = await rateLimit("login", 10, 600, phone);
  if (wait) return { ok: false, error: waitText(wait) };
  const db = await getDb();
  const [u] = await db.select().from(s.users).where(eq(s.users.phone, phone));
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return { ok: false, error: "Telefon raqami yoki parol notoʻgʻri", field: "password" };
  await rateReset("login", phone);
  await setUserSession(u.id);
  await claimGuestAttempts(u.id, await readGuestId());
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await clearUserSession();
  redirect("/");
}

/* ───────── Tests ───────── */

export async function startAttempt(testId: number) {
  const db = await getDb();
  const [test] = await db.select().from(s.tests).where(and(eq(s.tests.id, testId), eq(s.tests.isPublished, true)));
  if (!test) redirect("/");
  const user = await getCurrentUser();
  const guestId = user ? null : await ensureGuestId();

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.questions).where(eq(s.questions.testId, testId));
  if (n === 0) redirect(`/test/${testId}`);

  // Resume an unfinished attempt instead of burning a second test credit.
  const owner = user ? eq(s.attempts.userId, user.id) : eq(s.attempts.guestId, guestId!);
  const [open] = await db
    .select()
    .from(s.attempts)
    .where(and(owner, eq(s.attempts.testId, testId), isNull(s.attempts.finishedAt), gt(s.attempts.startedAt, new Date(Date.now() - test.durationMin * 60_000))))
    .orderBy(desc(s.attempts.startedAt))
    .limit(1);
  if (open) redirect(`/urinish/${open.id}`);

  if (!test.isFree) {
    if (!user) redirect(`/kirish?next=/test/${testId}`);
    const sub = await getActiveSubscription(user.id);
    if (!sub) redirect(`/tariflar?test=${testId}`);
    if (sub.sub.testsLeft !== null) {
      // atomic decrement: two tabs can't spend the same credit
      const [left] = await db
        .update(s.subscriptions)
        .set({ testsLeft: sql`${s.subscriptions.testsLeft} - 1` })
        .where(and(eq(s.subscriptions.id, sub.sub.id), gt(s.subscriptions.testsLeft, 0)))
        .returning({ testsLeft: s.subscriptions.testsLeft });
      if (!left) redirect(`/tariflar?test=${testId}`);
      if (left.testsLeft! <= 0 && !sub.sub.endsAt) await db.update(s.subscriptions).set({ status: "expired" }).where(eq(s.subscriptions.id, sub.sub.id));
    }
  }

  const [a] = await db.insert(s.attempts).values({ testId, total: n, userId: user?.id ?? null, guestId }).returning({ id: s.attempts.id });
  redirect(`/urinish/${a.id}`);
}

export async function saveAnswer(attemptId: string, questionId: number, selectedIndex: number | null, isGuess: boolean) {
  if (selectedIndex !== null && (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 5)) return { ok: false as const };
  const owned = await getOwnedAttempt(attemptId);
  if (!owned || owned.attempt.finishedAt) return { ok: false as const, expired: true };
  if (await expireIfOverdue(owned.attempt)) return { ok: false as const, expired: true };
  const db = await getDb();
  const [q] = await db.select().from(s.questions).where(and(eq(s.questions.id, questionId), eq(s.questions.testId, owned.attempt.testId)));
  if (!q || (selectedIndex !== null && selectedIndex >= q.options.length)) return { ok: false as const };
  const isCorrect = selectedIndex !== null && selectedIndex === q.correctIndex;
  await db
    .insert(s.attemptAnswers)
    .values({ attemptId, questionId, selectedIndex, isGuess, isCorrect })
    .onConflictDoUpdate({ target: [s.attemptAnswers.attemptId, s.attemptAnswers.questionId], set: { selectedIndex, isGuess, isCorrect } });
  return { ok: true as const };
}

export async function finishAttempt(attemptId: string) {
  const owned = await getOwnedAttempt(attemptId);
  if (!owned) redirect("/");
  if (!owned.attempt.finishedAt) await finalizeAttempt(attemptId);
  redirect(`/natija/${attemptId}`);
}

export async function sendFeedback(questionId: number, value: "understood" | "not_understood") {
  if (!Number.isInteger(questionId) || (value !== "understood" && value !== "not_understood")) return { ok: false };
  const user = await getCurrentUser();
  const key = user?.id ?? (await ensureGuestId());
  const db = await getDb();
  const [q] = await db.select({ id: s.questions.id }).from(s.questions).where(eq(s.questions.id, questionId));
  if (!q) return { ok: false };
  await db
    .insert(s.feedback)
    .values({ userKey: key, questionId, value })
    .onConflictDoUpdate({ target: [s.feedback.userKey, s.feedback.questionId], set: { value, createdAt: new Date() } });
  return { ok: true };
}

/* ───────── Orders ───────── */

export async function createOrder(planId: number) {
  const user = await getCurrentUser();
  if (!user) redirect(`/kirish?next=/tariflar`);
  const db = await getDb();
  const [plan] = await db.select().from(s.plans).where(and(eq(s.plans.id, planId), eq(s.plans.isActive, true)));
  if (!plan || plan.priceUzs <= 0) redirect("/tariflar");
  const [pending] = await db.select().from(s.orders).where(and(eq(s.orders.userId, user.id), eq(s.orders.planId, planId), eq(s.orders.status, "pending")));
  if (!pending) await db.insert(s.orders).values({ userId: user.id, planId, amountUzs: plan.priceUzs, provider: "manual" });
  revalidatePath("/kabinet");
  redirect(`/kabinet?buyurtma=1`);
}
