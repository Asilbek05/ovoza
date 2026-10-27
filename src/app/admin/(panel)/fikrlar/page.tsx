import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { MessageSquareWarning } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "../shell";
import { Badge, Card, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Fikrlar" };

export default async function FeedbackPage() {
  const db = await getDb();
  const bad = sql<number>`count(*) filter (where ${s.feedback.value} = 'not_understood')::int`;
  const good = sql<number>`count(*) filter (where ${s.feedback.value} = 'understood')::int`;
  const rows = await db
    .select({ qid: s.questions.id, text: s.questions.text, test: s.tests.title, subject: s.subjects.name, bad, good })
    .from(s.feedback)
    .innerJoin(s.questions, eq(s.questions.id, s.feedback.questionId))
    .innerJoin(s.tests, eq(s.tests.id, s.questions.testId))
    .innerJoin(s.subjects, eq(s.subjects.id, s.tests.subjectId))
    .groupBy(s.questions.id, s.tests.title, s.subjects.name)
    .orderBy(desc(bad), desc(good))
    .limit(100);
  return (
    <>
      <PageHeader title="Tushunmadim" description="Foydalanuvchilar qaysi tushuntirishni tushunmagan — shularni birinchi navbatda qayta yozing." />
      {rows.length === 0 ? (
        <EmptyState icon={<MessageSquareWarning className="size-6" />} title="Hali fikr yoʻq" text="Foydalanuvchilar «Tushundim» yoki «Tushunmadim» ni bosganda shu yerda hisob yuritiladi." />
      ) : (
        <Card className="divide-y divide-line-2 overflow-hidden">
          {rows.map((r) => (
            <Link key={r.qid} href={`/admin/savollar/${r.qid}`} className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-bg">
              <span className="min-w-0 flex-1 basis-60">
                <span className="block truncate text-[15px] font-semibold">{r.text}</span>
                <span className="block truncate text-[13px] text-muted">{r.subject} · {r.test}</span>
              </span>
              <Badge tone={r.bad > 0 ? "red" : "gray"}>{r.bad} tushunmadi</Badge>
              <Badge tone="green">{r.good} tushundi</Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
