import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { attemptDeadline, expireIfOverdue, getOwnedAttempt } from "@/lib/attempts";
import { Runner } from "./runner";

export const metadata = { title: "Test" };

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await getOwnedAttempt(id);
  if (!owned) notFound();
  const a = owned.attempt;
  if (await expireIfOverdue(a, 0)) redirect(`/natija/${id}`);
  const db = await getDb();
  const [row] = await db
    .select({ t: s.tests, sub: s.subjects.name, exam: s.examTypes.name })
    .from(s.tests)
    .innerJoin(s.subjects, eq(s.subjects.id, s.tests.subjectId))
    .innerJoin(s.examTypes, eq(s.examTypes.id, s.subjects.examTypeId))
    .where(eq(s.tests.id, a.testId));
  const qs = await db.select().from(s.questions).where(eq(s.questions.testId, a.testId)).orderBy(asc(s.questions.position), asc(s.questions.id));
  const answers = await db.select().from(s.attemptAnswers).where(eq(s.attemptAnswers.attemptId, id));
  const deadline = attemptDeadline(a.startedAt, row.t.durationMin);
  return (
    <Runner
      attemptId={id}
      title={row.t.title}
      subtitle={`${row.sub} · ${row.exam}`}
      secondsLeft={Math.max(0, Math.floor((deadline - Date.now()) / 1000))}
      questions={qs.map((q) => ({ id: q.id, text: q.text, options: q.options, topic: q.topic }))}
      initial={Object.fromEntries(answers.map((x) => [x.questionId, { selected: x.selectedIndex, guess: x.isGuess, flagged: x.flagged }]))}
    />
  );
}
