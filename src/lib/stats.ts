import "server-only";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/db";

export async function getUserStats(userId: string) {
  const db = await getDb();
  const finished = await db
    .select({ id: s.attempts.id, at: s.attempts.finishedAt, correct: s.attempts.correctCount, total: s.attempts.total, title: s.tests.title })
    .from(s.attempts)
    .innerJoin(s.tests, eq(s.tests.id, s.attempts.testId))
    .where(and(eq(s.attempts.userId, userId), isNotNull(s.attempts.finishedAt)))
    .orderBy(desc(s.attempts.finishedAt))
    .limit(60);
  const pcts = finished.map((a) => (a.total ? Math.round((a.correct / a.total) * 100) : 0));
  const topics = await db
    .select({
      topic: sql<string>`coalesce(${s.questions.topic}, 'Boshqa')`,
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${s.attemptAnswers.isCorrect})::int`,
    })
    .from(s.attemptAnswers)
    .innerJoin(s.attempts, eq(s.attempts.id, s.attemptAnswers.attemptId))
    .innerJoin(s.questions, eq(s.questions.id, s.attemptAnswers.questionId))
    .where(and(eq(s.attempts.userId, userId), isNotNull(s.attempts.finishedAt)))
    .groupBy(sql`coalesce(${s.questions.topic}, 'Boshqa')`);
  const [{ answered }] = await db
    .select({ answered: sql<number>`count(*)::int` })
    .from(s.attemptAnswers)
    .innerJoin(s.attempts, eq(s.attempts.id, s.attemptAnswers.attemptId))
    .where(and(eq(s.attempts.userId, userId), isNotNull(s.attempts.finishedAt)));
  return {
    count: finished.length,
    avg: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0,
    best: pcts.length ? Math.max(...pcts) : 0,
    answered,
    trend: finished.slice(0, 10).reverse().map((a) => ({ id: a.id, pct: a.total ? Math.round((a.correct / a.total) * 100) : 0, title: a.title })),
    weak: topics.filter((t) => t.total >= 2).map((t) => ({ ...t, pct: Math.round((t.correct / t.total) * 100) })).sort((a, b) => a.pct - b.pct).slice(0, 5),
  };
}
