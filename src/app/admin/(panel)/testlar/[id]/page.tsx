import { notFound } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "../../shell";
import { TestEditor } from "./editor";

export const metadata = { title: "Test" };

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();
  const db = await getDb();
  const [test] = await db.select().from(s.tests).where(eq(s.tests.id, id));
  if (!test) notFound();
  const examTypes = await db.select().from(s.examTypes).orderBy(s.examTypes.sort);
  const subjects = await db.select().from(s.subjects).orderBy(s.subjects.sort, s.subjects.name);
  const qs = await db.select().from(s.questions).where(eq(s.questions.testId, id)).orderBy(s.questions.position, s.questions.id);
  const ids = qs.map((q) => q.id);
  const exps = ids.length ? await db.select().from(s.explanations).where(inArray(s.explanations.questionId, ids)) : [];
  const imgs = exps.length ? await db.select().from(s.explanationImages).where(inArray(s.explanationImages.explanationId, exps.map((e) => e.id))) : [];
  const sims = ids.length ? await db.select({ q: s.similarQuestions.questionId }).from(s.similarQuestions).where(inArray(s.similarQuestions.questionId, ids)) : [];
  const status = Object.fromEntries(
    qs.map((q) => {
      const e = exps.find((x) => x.questionId === q.id);
      return [q.id, { audio: !!e?.audioUrl, images: e ? imgs.filter((i) => i.explanationId === e.id).length : 0, similar: sims.some((x) => x.q === q.id) }];
    }),
  );
  const subject = subjects.find((x) => x.id === test.subjectId);
  return (
    <>
      <PageHeader title={test.title} description={`${subject?.name ?? ""} · ${qs.length} ta savol`} back={{ href: "/admin/testlar", label: "Testlar" }} />
      <TestEditor test={test} examTypes={examTypes} subjects={subjects} questions={qs} status={status} />
    </>
  );
}
