import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { AudioLines, FileStack, HelpCircle, Users, ArrowRight } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "./shell";
import { Badge, Card, Table, Td, Th } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function Dashboard() {
  const db = await getDb();
  const n = sql<number>`count(*)::int`;
  const [users, tests, questions] = await Promise.all([
    db.select({ n }).from(s.users).then((r) => r[0].n),
    db.select({ n }).from(s.tests).then((r) => r[0].n),
    db.select({ n }).from(s.questions).then((r) => r[0].n),
  ]);
  const [{ n: withAudio }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.explanations)
    .where(sql`${s.explanations.audioUrl} is not null`);
  const missing = Math.max(0, questions - withAudio);
  const coverage = questions ? Math.round((withAudio / questions) * 100) : 0;

  const needs = await db
    .select({ id: s.questions.id, text: s.questions.text, testId: s.tests.id, testTitle: s.tests.title, subject: s.subjects.name, exam: s.examTypes.name })
    .from(s.questions)
    .innerJoin(s.tests, eq(s.tests.id, s.questions.testId))
    .innerJoin(s.subjects, eq(s.subjects.id, s.tests.subjectId))
    .innerJoin(s.examTypes, eq(s.examTypes.id, s.subjects.examTypeId))
    .leftJoin(s.explanations, eq(s.explanations.questionId, s.questions.id))
    .where(sql`${s.explanations.audioUrl} is null`)
    .orderBy(s.tests.id, s.questions.position)
    .limit(6);

  const orders = await db
    .select({ id: s.orders.id, amount: s.orders.amountUzs, status: s.orders.status, at: s.orders.createdAt, user: s.users.name, plan: s.plans.name })
    .from(s.orders)
    .innerJoin(s.users, eq(s.users.id, s.orders.userId))
    .innerJoin(s.plans, eq(s.plans.id, s.orders.planId))
    .orderBy(desc(s.orders.createdAt))
    .limit(5);

  const stats = [
    { label: "Foydalanuvchilar", value: users, icon: Users, tone: "bg-primary-soft text-primary" },
    { label: "Testlar", value: tests, icon: FileStack, tone: "bg-accent-soft text-accent-ink" },
    { label: "Savollar", value: questions, icon: HelpCircle, tone: "bg-success-soft text-success-ink" },
    { label: "Audiosiz savollar", value: missing, icon: AudioLines, tone: "bg-danger-soft text-danger-ink" },
  ];

  return (
    <>
      <PageHeader title="Umumiy holat" description="Asosiy koʻrsatkich — tushuntirish yozilgan savollar ulushi. Platformaning qiymati shunda." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex flex-col gap-4 p-5">
            <span className={`flex size-11 items-center justify-center rounded-2xl ${tone}`}><Icon className="size-5" /></span>
            <span>
              <span className="block font-display text-[34px] leading-none font-extrabold">{value}</span>
              <span className="mt-1.5 block text-sm font-semibold text-muted">{label}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Tushuntirish qamrovi</h2>
              <p className="mt-1 text-sm text-muted">{withAudio} / {questions} savolda audio bor</p>
            </div>
            <span className="font-display text-4xl font-extrabold text-primary">{coverage}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary-soft">
            <div className="h-full rounded-full bg-primary" style={{ width: `${coverage}%` }} />
          </div>
          <h3 className="mt-7 mb-2 text-sm font-semibold text-muted">Navbatdagi audiosiz savollar</h3>
          {needs.length === 0 ? (
            <p className="rounded-2xl bg-success-soft px-4 py-3 text-[15px] font-semibold text-success-ink">Barcha savollarga audio yozilgan.</p>
          ) : (
            <ul className="divide-y divide-line-2">
              {needs.map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/savollar/${q.id}`} className="group flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{q.text}</span>
                      <span className="block truncate text-[13px] text-muted">{q.exam} · {q.testTitle}</span>
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary opacity-80 group-hover:opacity-100">Audio qoʻshish <ArrowRight className="size-4" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Oxirgi buyurtmalar</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/tolovlar">Barchasi</Link></Button>
          </div>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-[15px] text-muted">Hali buyurtma yoʻq.</p>
          ) : (
            <Table>
              <thead><tr><Th>Foydalanuvchi</Th><Th>Tarif</Th><Th className="text-right">Summa</Th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <Td className="font-semibold">{o.user}</Td>
                    <Td><span className="flex flex-col gap-1"><span>{o.plan}</span><Badge tone={o.status === "paid" ? "green" : o.status === "failed" ? "red" : "yellow"} className="self-start">{o.status === "paid" ? "toʻlangan" : o.status === "failed" ? "bekor" : "kutilmoqda"}</Badge></span></Td>
                    <Td className="text-right font-semibold whitespace-nowrap">{formatPrice(o.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
