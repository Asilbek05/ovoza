import Link from "next/link";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { FileStack } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "../shell";
import { Badge, Card, EmptyState, Table, Td, Th } from "@/components/ui/misc";
import { TestFilters, NewTestButton } from "./client";

export const metadata = { title: "Testlar" };

export default async function TestsPage({ searchParams }: { searchParams: Promise<{ tur?: string; fan?: string }> }) {
  const sp = await searchParams;
  const db = await getDb();
  const examTypes = await db.select().from(s.examTypes).orderBy(s.examTypes.sort);
  const subjects = await db.select().from(s.subjects).orderBy(s.subjects.sort, s.subjects.name);
  const subjectId = sp.fan ? Number(sp.fan) : undefined;
  const et = examTypes.find((e) => e.slug === sp.tur);

  const where: SQL[] = [];
  if (subjectId) where.push(eq(s.tests.subjectId, subjectId));
  else if (et) where.push(eq(s.subjects.examTypeId, et.id));

  const rows = await db
    .select({
      test: s.tests,
      subject: s.subjects.name,
      exam: s.examTypes.name,
      questions: sql<number>`(select count(*)::int from questions q where q.test_id = "tests"."id")`,
      withAudio: sql<number>`(select count(*)::int from questions q join explanations e on e.question_id = q.id where q.test_id = "tests"."id" and e.audio_url is not null)`,
    })
    .from(s.tests)
    .innerJoin(s.subjects, eq(s.subjects.id, s.tests.subjectId))
    .innerJoin(s.examTypes, eq(s.examTypes.id, s.subjects.examTypeId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(s.examTypes.sort, s.subjects.sort, s.tests.sort, s.tests.id);

  return (
    <>
      <PageHeader
        title="Testlar va savollar"
        description="Test yarating, savollarni AI orqali import qiling, keyin har bir savolga ustozlar bergan audio va rasmlarni yuklang."
        actions={<NewTestButton subjects={subjects} examTypes={examTypes} defaultSubjectId={subjectId} />}
      />
      <TestFilters examTypes={examTypes} subjects={subjects} tur={sp.tur} fan={sp.fan} />
      {rows.length === 0 ? (
        <EmptyState icon={<FileStack className="size-6" />} title="Test topilmadi" text="Bu filtr boʻyicha test yoʻq. Yangi test yarating." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr><Th>Test</Th><Th>Fan</Th><Th className="text-center">Savollar</Th><Th>Audio qamrovi</Th><Th>Holat</Th></tr>
            </thead>
            <tbody>
              {rows.map(({ test, subject, exam, questions, withAudio }) => {
                const pct = questions ? Math.round((withAudio / questions) * 100) : 0;
                return (
                  <tr key={test.id} className="hover:bg-bg/60">
                    <Td>
                      <Link href={`/admin/testlar/${test.id}`} className="font-semibold text-ink hover:text-primary hover:underline">{test.title}</Link>
                      <span className="block text-xs text-muted">{test.durationMin} daqiqa</span>
                    </Td>
                    <Td><span className="block font-semibold">{subject}</span><span className="block text-xs text-muted">{exam}</span></Td>
                    <Td className="text-center font-display text-lg font-bold">{questions}</Td>
                    <Td className="min-w-40">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-soft"><div className={`h-full rounded-full ${pct === 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} /></div>
                        <span className="w-16 text-right text-xs font-semibold text-muted">{withAudio}/{questions}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1.5">
                        {test.isPublished ? <Badge tone="green">Chop etilgan</Badge> : <Badge tone="gray">Qoralama</Badge>}
                        {test.isFree ? <Badge tone="yellow">Bepul</Badge> : null}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
