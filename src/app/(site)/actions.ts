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
import { sendSms, smsConfigured } from "@/lib/sms";
import { createHash, randomInt } from "crypto";

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

export type AnswerPatch = { selected: number | null; guess: boolean; flagged: boolean; addSec: number };

export async function saveAnswer(attemptId: string, questionId: number, patch: AnswerPatch) {
  const { selected, guess, flagged } = patch;
  if (selected !== null && (!Number.isInteger(selected) || selected < 0 || selected > 5)) return { ok: false as const };
  const addSec = Number.isFinite(patch.addSec) ? Math.max(0, Math.min(900, Math.round(patch.addSec))) : 0;
  const owned = await getOwnedAttempt(attemptId);
  if (!owned || owned.attempt.finishedAt) return { ok: false as const, expired: true };
  if (await expireIfOverdue(owned.attempt)) return { ok: false as const, expired: true };
  const db = await getDb();
  const [q] = await db.select().from(s.questions).where(and(eq(s.questions.id, questionId), eq(s.questions.testId, owned.attempt.testId)));
  if (!q || (selected !== null && selected >= q.options.length)) return { ok: false as const };
  const isCorrect = selected !== null && selected === q.correctIndex;
  await db
    .insert(s.attemptAnswers)
    .values({ attemptId, questionId, selectedIndex: selected, isGuess: guess, isCorrect, flagged, timeSpentSec: addSec })
    .onConflictDoUpdate({
      target: [s.attemptAnswers.attemptId, s.attemptAnswers.questionId],
      set: { selectedIndex: selected, isGuess: guess, isCorrect, flagged, timeSpentSec: sql`${s.attemptAnswers.timeSpentSec} + ${addSec}` },
    });
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

/* ───────── Profile ───────── */

type ProfileState = { ok: boolean; message: string } | null;

export async function updateProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish?next=/kabinet/profil");
  const parsed = z.object({ name: z.string().trim().min(2, "Ismingizni kiriting").max(60, "Ism juda uzun"), audience: z.enum(["teacher", "applicant"]) }).safeParse({ name: form.get("name"), audience: form.get("audience") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const db = await getDb();
  await db.update(s.users).set(parsed.data).where(eq(s.users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Saqlandi" };
}

export async function changePassword(_: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish?next=/kabinet/profil");
  const wait = await rateLimit("pwd", 6, 900, user.id);
  if (wait) return { ok: false, message: waitText(wait) };
  const current = String(form.get("current") ?? "").slice(0, 200);
  const parsed = z.string().min(6, "Yangi parol kamida 6 belgi").max(72, "Parol 72 belgidan oshmasin").safeParse(form.get("next"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { ok: false, message: "Joriy parol notoʻgʻri" };
  const db = await getDb();
  await db.update(s.users).set({ passwordHash: await bcrypt.hash(parsed.data, 10) }).where(eq(s.users.id, user.id));
  return { ok: true, message: "Parol almashtirildi" };
}

/* ───────── Password reset by SMS code ───────── */

export type ResetResult = { ok: boolean; message: string; devCode?: string };
const codeHash = (phone: string, code: string) => createHash("sha256").update(`${phone}:${code}:${process.env.AUTH_SECRET ?? "dev"}`).digest("hex");

export async function requestResetCode(rawPhone: string): Promise<ResetResult> {
  const phone = normPhone(String(rawPhone ?? ""));
  if (!/^998\d{9}$/.test(phone)) return { ok: false, message: "Telefon raqamini toʻliq kiriting: +998 XX XXX XX XX" };
  const wait = await rateLimit("reset-req", 5, 3600, phone);
  if (wait) return { ok: false, message: waitText(wait) };
  const wait2 = await rateLimit("reset-ip", 15, 3600);
  if (wait2) return { ok: false, message: waitText(wait2) };
  const live = process.env.NODE_ENV === "production" || smsConfigured();
  if (live && !smsConfigured()) return { ok: false, message: "SMS xizmati sozlanmagan. Parolni tiklash uchun administratorga murojaat qiling (Aloqa sahifasi)." };

  const db = await getDb();
  const generic: ResetResult = { ok: true, message: "Agar bu raqam roʻyxatdan oʻtgan boʻlsa, 6 xonali kod SMS orqali yuborildi." };
  const [u] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.phone, phone));
  if (!u) return generic; // never reveal which numbers exist

  const [prev] = await db.select().from(s.otpCodes).where(eq(s.otpCodes.phone, phone));
  if (prev && Date.now() - prev.lastSent.getTime() < 60_000) return { ok: false, message: "Kod yaqinda yuborilgan. 1 daqiqadan keyin qayta soʻrang." };

  const code = String(randomInt(100000, 1000000));
  const row = { codeHash: codeHash(phone, code), expiresAt: new Date(Date.now() + 10 * 60_000), attempts: 0, lastSent: new Date() };
  await db.insert(s.otpCodes).values({ phone, ...row }).onConflictDoUpdate({ target: s.otpCodes.phone, set: row });

  if (smsConfigured()) {
    const r = await sendSms(phone, `ovoza: parolni tiklash kodi ${code}. Hech kimga bermang.`);
    if (!r.ok) return { ok: false, message: "SMS yuborib boʻlmadi. Birozdan keyin qayta urinib koʻring." };
    return generic;
  }
  // development without an SMS gateway: show the code on screen and in the server log
  console.log(`[dev] ${phone} tiklash kodi: ${code}`);
  return { ...generic, message: "Dev rejim: SMS ulanmagan, kod quyida koʻrsatildi.", devCode: code };
}

export async function confirmReset(rawPhone: string, code: string, password: string): Promise<ResetResult> {
  const phone = normPhone(String(rawPhone ?? ""));
  const pw = z.string().min(6, "Yangi parol kamida 6 belgi").max(72, "Parol 72 belgidan oshmasin").safeParse(password);
  if (!pw.success) return { ok: false, message: pw.error.issues[0].message };
  const wait = await rateLimit("reset-confirm", 10, 900, phone);
  if (wait) return { ok: false, message: waitText(wait) };
  const db = await getDb();
  const [o] = await db.select().from(s.otpCodes).where(eq(s.otpCodes.phone, phone));
  const bad: ResetResult = { ok: false, message: "Kod notoʻgʻri yoki muddati tugagan." };
  if (!o || o.expiresAt.getTime() < Date.now() || o.attempts >= 5) return bad;
  if (o.codeHash !== codeHash(phone, String(code ?? "").trim())) {
    await db.update(s.otpCodes).set({ attempts: o.attempts + 1 }).where(eq(s.otpCodes.phone, phone));
    return bad;
  }
  await db.update(s.users).set({ passwordHash: await bcrypt.hash(pw.data, 10) }).where(eq(s.users.phone, phone));
  await db.delete(s.otpCodes).where(eq(s.otpCodes.phone, phone));
  await rateReset("login", phone);
  return { ok: true, message: "Parol almashtirildi. Endi yangi parol bilan kiring." };
}
