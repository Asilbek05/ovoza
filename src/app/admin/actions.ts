"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/db";
import { assertAdmin } from "@/lib/admin-guard";
import { clearAdminSession, setAdminSession } from "@/lib/session";
import { saveUpload, validateUpload } from "@/lib/storage";
import { aiAvailable, extractText, parseJson, parsePlain, parseWithAI, importedQuestion, type ImportedQuestion } from "@/lib/ai-import";
import { slugify } from "@/lib/utils";
import { rateLimit, rateReset, waitText } from "@/lib/rate-limit";
import { createHash, timingSafeEqual } from "crypto";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Maʼlumot notoʻgʻri" };
  const msg = e instanceof Error ? e.message : "Kutilmagan xato";
  if (/unique|duplicate/i.test(msg)) return { ok: false, error: "Bunday nom (slug) allaqachon mavjud" };
  return { ok: false, error: msg };
}

/* ───────── Auth ───────── */

export async function adminLogin(_: unknown, form: FormData): Promise<ActionResult> {
  const pwd = String(form.get("password") ?? "").slice(0, 200);
  const expected = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin12345");
  if (!expected) return { ok: false, error: "Server sozlanmagan: ADMIN_PASSWORD kiritilmagan" };
  const wait = await rateLimit("admin-login", 6, 900);
  if (wait) return { ok: false, error: waitText(wait) };
  await new Promise((r) => setTimeout(r, 300));
  const h = (v: string) => createHash("sha256").update(v).digest();
  if (!timingSafeEqual(h(pwd), h(expected))) return { ok: false, error: "Parol notoʻgʻri" };
  await rateReset("admin-login");
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

/* ───────── Exam types ───────── */

const examTypeSchema = z.object({
  id: z.number().int(),
  name: z.string().trim().min(2, "Nom kamida 2 harf"),
  short: z.string().trim().max(60),
  description: z.string().trim().max(300),
  isActive: z.boolean(),
  comingSoon: z.boolean(),
});

export async function saveExamType(input: z.infer<typeof examTypeSchema>): Promise<ActionResult> {
  try {
    await assertAdmin();
    const d = examTypeSchema.parse(input);
    const db = await getDb();
    await db.update(s.examTypes).set({ name: d.name, short: d.short, description: d.description, isActive: d.isActive, comingSoon: d.comingSoon }).where(eq(s.examTypes.id, d.id));
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────── Subjects ───────── */

const subjectSchema = z.object({
  id: z.number().int().optional(),
  examTypeId: z.number().int(),
  name: z.string().trim().min(2, "Fan nomi kamida 2 harf").max(60),
  slug: z.string().trim().max(60).optional(),
  color: z.enum(["blue", "yellow", "green", "coral", "violet", "teal"]),
  isActive: z.boolean(),
  sort: z.number().int().min(0).max(999),
});

export async function saveSubject(input: z.infer<typeof subjectSchema>): Promise<ActionResult> {
  try {
    await assertAdmin();
    const d = subjectSchema.parse(input);
    const slug = slugify(d.slug || d.name) || `fan-${Date.now()}`;
    const db = await getDb();
    const values = { examTypeId: d.examTypeId, name: d.name, slug, color: d.color, isActive: d.isActive, sort: d.sort };
    if (d.id) await db.update(s.subjects).set(values).where(eq(s.subjects.id, d.id));
    else await db.insert(s.subjects).values(values);
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleSubject(id: number, isActive: boolean): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.update(s.subjects).set({ isActive }).where(eq(s.subjects.id, id));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSubject(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.attempts)
      .innerJoin(s.tests, eq(s.tests.id, s.attempts.testId))
      .where(eq(s.tests.subjectId, id));
    if (n > 0) return { ok: false, error: `Bu fan testlari ${n} marta yechilgan. Oʻchirish oʻrniga oʻchirib qoʻying (faol emas).` };
    await db.delete(s.subjects).where(eq(s.subjects.id, id));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────── Tests ───────── */

const testSchema = z.object({
  id: z.number().int().optional(),
  subjectId: z.number().int({ message: "Fanni tanlang" }),
  title: z.string().trim().min(2, "Test nomini kiriting").max(120),
  description: z.string().trim().max(500),
  durationMin: z.number().int().min(1, "Vaqt kamida 1 daqiqa").max(600),
  isFree: z.boolean(),
  isPublished: z.boolean(),
});

export async function saveTest(input: z.infer<typeof testSchema>): Promise<ActionResult<{ id: number }>> {
  try {
    await assertAdmin();
    const d = testSchema.parse(input);
    const db = await getDb();
    let id = d.id;
    if (d.isPublished && id) {
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.questions).where(eq(s.questions.testId, id));
      if (n === 0) return { ok: false, error: "Savolsiz testni nashr qilib boʻlmaydi. Avval savollar qoʻshing." };
    }
    const values = { subjectId: d.subjectId, title: d.title, description: d.description, durationMin: d.durationMin, isFree: d.isFree, isPublished: d.isPublished };
    if (id) await db.update(s.tests).set(values).where(eq(s.tests.id, id));
    else id = (await db.insert(s.tests).values(values).returning({ id: s.tests.id }))[0].id;
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTest(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.attempts).where(eq(s.attempts.testId, id));
    if (n > 0) return { ok: false, error: `Bu test ${n} marta yechilgan. Oʻchirish oʻrniga nashrdan olib qoʻying.` };
    await db.delete(s.tests).where(eq(s.tests.id, id));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────── Questions ───────── */

const questionSchema = z.object({
  id: z.number().int().optional(),
  testId: z.number().int(),
  text: z.string().trim().min(2, "Savol matnini kiriting"),
  options: z.array(z.string().trim().min(1, "Boʻsh variant qoldirmang")).min(2, "Kamida 2 ta variant").max(6),
  correctIndex: z.number().int().min(0),
  topic: z.string().trim().max(80).nullable(),
});

export async function saveQuestion(input: z.infer<typeof questionSchema>): Promise<ActionResult<{ id: number }>> {
  try {
    await assertAdmin();
    const d = questionSchema.parse(input);
    if (d.correctIndex >= d.options.length) return { ok: false, error: "Toʻgʻri javobni tanlang" };
    const db = await getDb();
    let id = d.id;
    const values = { text: d.text, options: d.options, correctIndex: d.correctIndex, topic: d.topic || null };
    if (id) await db.update(s.questions).set(values).where(eq(s.questions.id, id));
    else {
      const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${s.questions.position}), 0)::int` }).from(s.questions).where(eq(s.questions.testId, d.testId));
      id = (await db.insert(s.questions).values({ ...values, testId: d.testId, position: max + 1 }).returning({ id: s.questions.id }))[0].id;
    }
    revalidatePath("/admin", "layout");
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteQuestion(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.delete(s.questions).where(eq(s.questions.id, id));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function moveQuestion(id: number, dir: -1 | 1): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const [q] = await db.select().from(s.questions).where(eq(s.questions.id, id));
    if (!q) return { ok: false, error: "Savol topilmadi" };
    const list = await db.select().from(s.questions).where(eq(s.questions.testId, q.testId)).orderBy(s.questions.position, s.questions.id);
    const i = list.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return { ok: true };
    [list[i], list[j]] = [list[j], list[i]];
    for (let k = 0; k < list.length; k++) await db.update(s.questions).set({ position: k + 1 }).where(eq(s.questions.id, list[k].id));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────── Import ───────── */

export async function parseImport(form: FormData): Promise<ActionResult<{ questions: ImportedQuestion[]; source: "json" | "plain" | "ai" }>> {
  try {
    await assertAdmin();
    const mode = String(form.get("mode") ?? "auto");
    const file = form.get("file");
    let raw = String(form.get("text") ?? "");
    if (file instanceof File && file.size > 0) {
      if (file.size > 15 * 1024 * 1024) return { ok: false, error: "Fayl 15 MB dan oshmasin" };
      raw = await extractText(file);
    }
    raw = raw.trim();
    if (!raw) return { ok: false, error: "Matn joylang yoki fayl tanlang" };

    const json = parseJson(raw);
    if (json?.length) return { ok: true, data: { questions: json, source: "json" } };

    if (mode !== "ai") {
      const plain = parsePlain(raw);
      if (plain.length) return { ok: true, data: { questions: plain, source: "plain" } };
    }
    if (!aiAvailable()) return { ok: false, error: "Savollar topilmadi. AI bilan ajratish uchun .env da ANTHROPIC_API_KEY kerak." };
    const ai = await parseWithAI(raw);
    if (!ai.length) return { ok: false, error: "Hujjatda savol topilmadi" };
    return { ok: true, data: { questions: ai, source: "ai" } };
  } catch (e) {
    return fail(e);
  }
}

export async function importQuestions(testId: number, items: ImportedQuestion[]): Promise<ActionResult<{ count: number }>> {
  try {
    await assertAdmin();
    const list = z.array(importedQuestion).min(1, "Saqlash uchun savol yoʻq").max(500, "Bir martada 500 tagacha savol").parse(items);
    if (list.some((q) => q.correct_index === null || q.correct_index >= q.options.length)) return { ok: false, error: "Har bir savol uchun toʻgʻri javobni belgilang" };
    const db = await getDb();
    const [test] = await db.select({ id: s.tests.id }).from(s.tests).where(eq(s.tests.id, testId));
    if (!test) return { ok: false, error: "Test topilmadi" };
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${s.questions.position}), 0)::int` }).from(s.questions).where(eq(s.questions.testId, testId));
    await db.insert(s.questions).values(
      list.map((q, i) => ({ testId, position: max + i + 1, text: q.text, options: q.options, correctIndex: q.correct_index ?? 0, topic: q.topic || null })),
    );
    revalidatePath("/admin", "layout");
    return { ok: true, data: { count: list.length } };
  } catch (e) {
    return fail(e);
  }
}

/* ───────── Media + explanations ───────── */

export async function uploadMedia(form: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await assertAdmin();
    const kind = form.get("kind") === "audio" ? "audio" : "image";
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Fayl tanlanmadi" };
    const err = validateUpload(file, kind);
    if (err) return { ok: false, error: err };
    const url = await saveUpload(file, kind === "audio" ? "audio" : "images");
    return { ok: true, data: { url } };
  } catch (e) {
    return fail(e);
  }
}

const explanationSchema = z.object({
  questionId: z.number().int(),
  audioUrl: z.string().nullable(),
  audioDurationSec: z.number().nullable(),
  note: z.string().trim().max(2000),
  authorName: z.string().trim().max(80),
  images: z.array(z.object({ url: z.string().min(1), startSec: z.number().min(0), caption: z.string().trim().max(80) })).max(8),
  similar: z
    .object({ text: z.string().trim().min(2, "Oʻxshash savol matnini kiriting"), options: z.array(z.string().trim().min(1, "Oʻxshash savolda boʻsh variant bor")).min(2).max(6), correctIndex: z.number().int().min(0) })
    .nullable(),
});

export async function saveExplanation(input: z.infer<typeof explanationSchema>): Promise<ActionResult> {
  try {
    await assertAdmin();
    const d = explanationSchema.parse(input);
    const db = await getDb();
    await db.transaction(async (tx) => {
      const values = { audioUrl: d.audioUrl, audioDurationSec: d.audioDurationSec, note: d.note, authorName: d.authorName, updatedAt: new Date() };
      const [existing] = await tx.select().from(s.explanations).where(eq(s.explanations.questionId, d.questionId));
      let exId: number;
      if (existing) {
        exId = existing.id;
        await tx.update(s.explanations).set(values).where(eq(s.explanations.id, exId));
      } else {
        exId = (await tx.insert(s.explanations).values({ ...values, questionId: d.questionId }).returning({ id: s.explanations.id }))[0].id;
      }
      await tx.delete(s.explanationImages).where(eq(s.explanationImages.explanationId, exId));
      const imgs = [...d.images].sort((a, b) => a.startSec - b.startSec);
      if (imgs.length) await tx.insert(s.explanationImages).values(imgs.map((im, i) => ({ explanationId: exId, url: im.url, startSec: im.startSec, caption: im.caption, position: i + 1 })));
      await tx.delete(s.similarQuestions).where(eq(s.similarQuestions.questionId, d.questionId));
      if (d.similar) {
        if (d.similar.correctIndex >= d.similar.options.length) throw new Error("Oʻxshash savolning toʻgʻri javobini tanlang");
        await tx.insert(s.similarQuestions).values({ questionId: d.questionId, ...d.similar });
      }
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────── Plans ───────── */

const planSchema = z.object({
  id: z.number().int().optional(),
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2, "Tarif nomini kiriting").max(60),
  audience: z.enum(["all", "teacher", "applicant", "school"]),
  priceUzs: z.number().int().min(0, "Narx manfiy boʻlmaydi"),
  priceNote: z.string().trim().max(40),
  periodDays: z.number().int().min(1).nullable(),
  testsLimit: z.number().int().min(1).nullable(),
  features: z.array(z.string().trim().min(1)).max(10),
  isHighlighted: z.boolean(),
  isActive: z.boolean(),
  sort: z.number().int().min(0),
});

export async function savePlan(input: z.infer<typeof planSchema>): Promise<ActionResult> {
  try {
    await assertAdmin();
    const d = planSchema.parse(input);
    const db = await getDb();
    const { id, ...values } = d;
    if (id) await db.update(s.plans).set(values).where(eq(s.plans.id, id));
    else await db.insert(s.plans).values(values);
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePlan(id: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.subscriptions).where(eq(s.subscriptions.planId, id));
    if (n > 0) return { ok: false, error: "Bu tarifga obunalar bor. Oʻchirish oʻrniga nofaol qiling." };
    await db.delete(s.orders).where(eq(s.orders.planId, id));
    await db.delete(s.plans).where(eq(s.plans.id, id));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────── Users & orders ───────── */

async function activate(userId: string, planId: number) {
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

export async function grantSubscription(userId: string, planId: number): Promise<ActionResult> {
  try {
    await assertAdmin();
    await activate(userId, planId);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelSubscriptions(userId: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    await db.update(s.subscriptions).set({ status: "cancelled" }).where(and(eq(s.subscriptions.userId, userId), eq(s.subscriptions.status, "active")));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setOrderStatus(orderId: number, status: "paid" | "failed"): Promise<ActionResult> {
  try {
    await assertAdmin();
    const db = await getDb();
    const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
    if (!o) return { ok: false, error: "Buyurtma topilmadi" };
    if (o.status === "paid") return { ok: false, error: "Bu buyurtma allaqachon toʻlangan" };
    await db.update(s.orders).set({ status }).where(eq(s.orders.id, orderId));
    if (status === "paid") await activate(o.userId, o.planId);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkPublish(testIds: number[], isPublished: boolean): Promise<ActionResult> {
  try {
    await assertAdmin();
    if (!testIds.length) return { ok: true };
    const db = await getDb();
    if (isPublished) {
      const empty = await db
        .select({ id: s.tests.id })
        .from(s.tests)
        .where(and(inArray(s.tests.id, testIds), sql`not exists (select 1 from questions q where q.test_id = "tests"."id")`));
      if (empty.length) return { ok: false, error: `${empty.length} ta testda savol yoʻq — ularni nashr qilib boʻlmaydi.` };
    }
    await db.update(s.tests).set({ isPublished }).where(inArray(s.tests.id, testIds));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
