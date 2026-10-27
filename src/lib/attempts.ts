import "server-only";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { getCurrentUser, readGuestId } from "./session";
import { FREE_EXPLANATIONS, hasFullAccess } from "./access";

/** Loads an attempt only if the current visitor (user or guest cookie) owns it. */
export async function getOwnedAttempt(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const [a] = await db.select().from(s.attempts).where(eq(s.attempts.id, id));
  if (!a) return null;
  const user = await getCurrentUser();
  const guest = await readGuestId();
  const mine = (user && a.userId === user.id) || (!a.userId && guest && a.guestId === guest);
  return mine ? { attempt: a, user } : null;
}

const GRACE_MS = 8_000;

export const attemptDeadline = (startedAt: Date, durationMin: number) => startedAt.getTime() + durationMin * 60_000;

/** Idempotent: stamps finish time and the final score once. */
export async function finalizeAttempt(attemptId: string) {
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.attemptAnswers)
    .where(and(eq(s.attemptAnswers.attemptId, attemptId), eq(s.attemptAnswers.isCorrect, true)));
  await db
    .update(s.attempts)
    .set({ finishedAt: new Date(), correctCount: n })
    .where(and(eq(s.attempts.id, attemptId), isNull(s.attempts.finishedAt)));
}

/** True (and finalizes) when the time limit has passed; answers after the deadline are refused. */
export async function expireIfOverdue(attempt: { id: string; testId: number; startedAt: Date; finishedAt: Date | null }, graceMs = GRACE_MS) {
  if (attempt.finishedAt) return true;
  const db = await getDb();
  const [t] = await db.select({ d: s.tests.durationMin }).from(s.tests).where(eq(s.tests.id, attempt.testId));
  if (!t) return false;
  if (Date.now() <= attemptDeadline(attempt.startedAt, t.d) + graceMs) return false;
  await finalizeAttempt(attempt.id);
  return true;
}

export type ReviewItem = {
  questionId: number;
  number: number;
  text: string;
  topic: string | null;
  kind: "wrong" | "guess" | "skipped";
  selectedIndex: number | null;
  durationSec: number | null;
  images: number;
  hasAudio: boolean;
  unlocked: boolean;
};

/** Everything the result + analysis pages need. */
export async function getAttemptReview(attemptId: string, userId: string | null) {
  const db = await getDb();
  const [a] = await db.select().from(s.attempts).where(eq(s.attempts.id, attemptId));
  const [test] = await db.select().from(s.tests).where(eq(s.tests.id, a.testId));
  const [subject] = await db.select().from(s.subjects).where(eq(s.subjects.id, test.subjectId));
  const [exam] = await db.select().from(s.examTypes).where(eq(s.examTypes.id, subject.examTypeId));
  const qs = await db.select().from(s.questions).where(eq(s.questions.testId, test.id)).orderBy(asc(s.questions.position), asc(s.questions.id));
  const answers = await db.select().from(s.attemptAnswers).where(eq(s.attemptAnswers.attemptId, a.id));
  const ids = qs.map((q) => q.id);
  const exps = ids.length ? await db.select().from(s.explanations).where(inArray(s.explanations.questionId, ids)) : [];
  const imgs = exps.length ? await db.select().from(s.explanationImages).where(inArray(s.explanationImages.explanationId, exps.map((e) => e.id))) : [];
  const full = userId ? await hasFullAccess(userId) : false;
  const openAll = !!userId && (full || !test.isFree);

  const topics = new Map<string, { correct: number; total: number }>();
  const items: ReviewItem[] = [];
  let guesses = 0;
  qs.forEach((q, i) => {
    const ans = answers.find((x) => x.questionId === q.id);
    const correct = !!ans?.isCorrect;
    const t = q.topic || "Boshqa";
    const cur = topics.get(t) ?? { correct: 0, total: 0 };
    cur.total++;
    if (correct) cur.correct++;
    topics.set(t, cur);
    if (correct && ans?.isGuess) guesses++;
    const kind: ReviewItem["kind"] | null = !ans || ans.selectedIndex === null ? "skipped" : !correct ? "wrong" : ans.isGuess ? "guess" : null;
    if (!kind) return;
    const e = exps.find((x) => x.questionId === q.id);
    items.push({
      questionId: q.id, number: i + 1, text: q.text, topic: q.topic, kind, selectedIndex: ans?.selectedIndex ?? null,
      durationSec: e?.audioDurationSec ?? null, images: e ? imgs.filter((im) => im.explanationId === e.id).length : 0, hasAudio: !!e?.audioUrl, unlocked: false,
    });
  });
  // wrong first, then skipped, then lucky guesses — in question order inside each group
  const order = { wrong: 0, skipped: 1, guess: 2 } as const;
  items.sort((x, y) => order[x.kind] - order[y.kind] || x.number - y.number);
  items.forEach((it, i) => { it.unlocked = !!userId && (openAll || i < FREE_EXPLANATIONS); });

  return {
    attempt: a, test, subject, exam, questions: qs, answers, items, guesses, openAll, loggedIn: !!userId,
    topics: [...topics.entries()].map(([name, v]) => ({ name, ...v })).sort((x, y) => x.correct / x.total - y.correct / y.total),
  };
}

export async function claimGuestAttempts(userId: string, guestId: string | null) {
  if (!guestId) return;
  const db = await getDb();
  await db.update(s.attempts).set({ userId, guestId: null }).where(and(eq(s.attempts.guestId, guestId)));
}
