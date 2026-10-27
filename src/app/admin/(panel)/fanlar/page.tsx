import { eq, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "../shell";
import { SubjectsManager } from "./manager";

export const metadata = { title: "Fanlar" };

export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ tur?: string }> }) {
  const { tur } = await searchParams;
  const db = await getDb();
  const examTypes = await db.select().from(s.examTypes).orderBy(s.examTypes.sort);
  const subjects = await db
    .select({ subject: s.subjects, tests: sql<number>`count(${s.tests.id})::int` })
    .from(s.subjects)
    .leftJoin(s.tests, eq(s.tests.subjectId, s.subjects.id))
    .groupBy(s.subjects.id)
    .orderBy(s.subjects.sort, s.subjects.name);
  return (
    <>
      <PageHeader title="Fanlar" description="Har bir imtihon turining fanlari. Asosiy fanlar oldindan yaratilgan — kerakligini qoʻshing, keraksizini oʻchirib qoʻying." />
      <SubjectsManager
        examTypes={examTypes}
        rows={subjects.map((r) => ({ ...r.subject, tests: r.tests }))}
        initialTab={examTypes.find((e) => e.slug === tur)?.slug ?? examTypes[0]?.slug}
      />
    </>
  );
}
