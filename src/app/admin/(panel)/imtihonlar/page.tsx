import { sql, eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "../shell";
import { ExamTypeCard } from "./card";

export const metadata = { title: "Imtihon turlari" };

export default async function ExamTypesPage() {
  const db = await getDb();
  const rows = await db
    .select({ et: s.examTypes, subjects: sql<number>`count(${s.subjects.id})::int` })
    .from(s.examTypes)
    .leftJoin(s.subjects, eq(s.subjects.examTypeId, s.examTypes.id))
    .groupBy(s.examTypes.id)
    .orderBy(s.examTypes.sort);
  return (
    <>
      <PageHeader title="Imtihon turlari" description="Saytdagi asosiy boʻlimlar. Har birining ichida fanlar boʻladi. «Tez orada» belgisi boʻlimni koʻrsatadi, lekin testlarni yopib turadi." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ et, subjects }) => <ExamTypeCard key={et.id} et={et} subjects={subjects} />)}
      </div>
    </>
  );
}
