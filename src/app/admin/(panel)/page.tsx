import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { AudioLines, FileStack, HelpCircle, Users, ArrowRight, Wallet, ClipboardCheck } from "lucide-react";
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

  const days = await db.execute(sql`
    select to_char(d, 'DD.MM') as label,
      (select count(*)::int from attempts a where a.finished_at::date = d) as attempts,
      (select count(*)::int from users u where u.created_at::date = d) as signups
    from generate_series(current_date - 13, current_date, interval '1 day') d
    order by d`);
  const activity = (days as unknown as { rows?: { label: string; attempts: number; signups: number }[] }).rows ?? (days as unknown as { label: string; attempts: number; signups: number }[]);
  const maxA = Math.max(1, ...activity.map((x) => Number(x.attempts)));
  const [revenue, pendingN, attemptsAll] = await Promise.all([
    db.select({ v: sql<number>`coalesce(sum(${s.orders.amountUzs}), 0)::int` }).from(s.orders).where(eq(s.orders.status, "paid")).then((r) => r[0].v),
    db.select({ n }).from(s.orders).where(eq(s.orders.status, "pending")).then((r) => r[0].n),
    db.select({ n }).from(s.attempts).where(sql`${s.attempts.finishedAt} is not null`).then((r) => r[0].n),
  ]);

  const stats = [
    { label: "Foydalanuvchilar", value: users, icon: Users, tone: "bg-primary-soft text-primary" },
    { label: "Testlar", value: tests, icon: FileStack, tone: "bg-accent-soft text-accent-ink" },
    { label: "Savollar", value: questions, icon: HelpCircle, tone: "bg-success-soft text-success-ink" },
    { label: "Audiosiz savollar", value: missing, icon: AudioLines, tone: "bg-danger-soft text-danger-ink" },
  ];
  const stats2 = [
    { label: "Yechilgan testlar", value: attemptsAll, icon: ClipboardCheck, tone: "bg-primary-soft text-primary" },
    { label: "Tushum", value: revenue ? formatPrice(revenue) : "0 soʻm", icon: Wallet, tone: "bg-success-soft text-success-ink" },
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

      <div className="mt-3 grid grid-cols-2 gap-3">
        {stats2.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}><Icon className="size-5" /></span>
            <span><span className="block font-display text-2xl leading-none font-extrabold sm:text-[28px]">{value}</span><span className="mt-1 block text-sm font-semibold text-muted">{label}</span></span>
          </Card>
        ))}
      </div>
      {pendingN > 0 ? (
        <Link href="/admin/tolovlar" className="mt-3 flex items-center justify-between gap-3 rounded-[18px] border-2 border-accent bg-accent-soft px-5 py-4 font-semibold transition hover:bg-accent-soft/70">
          <span>{pendingN} ta buyurtma toʻlovni kutmoqda</span><span className="flex items-center gap-1 text-primary">Koʻrish <ArrowRight className="size-4" /></span>
        </Link>
      ) : null}

      <Card className="mt-5 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold">Oxirgi 14 kun</h2>
          <span className="flex gap-4 text-[13px] font-semibold text-muted"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> yakunlangan testlar</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent" /> yangi foydalanuvchilar</span></span>
        </div>
        <div role="img" aria-label="Oxirgi 14 kundagi faollik grafigi" className="mt-5 flex h-36 items-end gap-1.5 sm:gap-2.5">
          {activity.map((d) => (
            <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.attempts} test, ${d.signups} yangi`}>
              <div className="flex items-end justify-center gap-0.5" style={{ height: "100%" }}>
                <span className="w-full max-w-4 rounded-t-md bg-primary" style={{ height: `${Math.max(Number(d.attempts) ? 8 : 3, (Number(d.attempts) / maxA) * 100)}%`, opacity: Number(d.attempts) ? 1 : 0.25 }} />
                <span className="w-full max-w-4 rounded-t-md bg-accent" style={{ height: `${Math.max(Number(d.signups) ? 8 : 3, (Number(d.signups) / maxA) * 100)}%`, opacity: Number(d.signups) ? 1 : 0.25 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 sm:gap-2.5">{activity.map((d, i) => <span key={d.label} className={`flex-1 text-center text-[10px] font-semibold text-muted sm:text-[11px] ${i % 2 ? "hidden sm:block" : ""}`}>{d.label}</span>)}</div>
      </Card>

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
