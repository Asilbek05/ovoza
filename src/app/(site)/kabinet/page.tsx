import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, Clock, LogOut } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { getActiveSubscription } from "@/lib/access";
import { logout } from "../actions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Kabinet" };

export default async function Cabinet({ searchParams }: { searchParams: Promise<{ buyurtma?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish?next=/kabinet");
  const { buyurtma } = await searchParams;
  const db = await getDb();
  const sub = await getActiveSubscription(user.id);
  const attempts = await db
    .select({ a: s.attempts, title: s.tests.title, subject: s.subjects.name })
    .from(s.attempts)
    .innerJoin(s.tests, eq(s.tests.id, s.attempts.testId))
    .innerJoin(s.subjects, eq(s.subjects.id, s.tests.subjectId))
    .where(eq(s.attempts.userId, user.id))
    .orderBy(desc(s.attempts.startedAt))
    .limit(30);
  const orders = await db
    .select({ o: s.orders, plan: s.plans.name })
    .from(s.orders)
    .innerJoin(s.plans, eq(s.plans.id, s.orders.planId))
    .where(eq(s.orders.userId, user.id))
    .orderBy(desc(s.orders.createdAt))
    .limit(5);
  const pending = orders.find((x) => x.o.status === "pending");

  return (
    <div className="container-page pt-6 pb-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{user.audience === "applicant" ? "Abituriyent" : "Oʻqituvchi"} · +{user.phone}</p>
          <h1 className="font-display text-[36px] leading-tight font-extrabold sm:text-5xl">Salom, {user.name.split(" ")[0]}</h1>
        </div>
        <form action={logout}><Button variant="ghost"><LogOut /> Chiqish</Button></form>
      </div>

      {buyurtma && pending ? (
        <div className="mb-6 rounded-[28px] border-2 border-accent bg-accent-soft p-6">
          <p className="font-display text-xl font-bold">Buyurtma qabul qilindi: {pending.plan} · {formatPrice(pending.o.amountUzs)}</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">Click va Payme orqali toʻlov tez orada ulanadi. Hozircha toʻlovni administratorga yuboring — tasdiqlangach obuna avtomatik ochiladi. Buyurtma raqami: <b>#{pending.o.id}</b></p>
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[32px] border border-line bg-surface p-4 sm:p-6">
          <h2 className="px-2 pb-3 font-display text-2xl font-bold">Urinishlarim</h2>
          {attempts.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-muted">Hali test yechmagansiz.</p>
              <Button asChild variant="primary" className="mt-4"><Link href="/imtihon/attestatsiya">Birinchi testni yechish</Link></Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {attempts.map(({ a, title, subject }) => (
                <li key={a.id}>
                  <Link href={a.finishedAt ? `/natija/${a.id}` : `/urinish/${a.id}`} className="flex items-center gap-4 rounded-[20px] p-3 transition hover:bg-bg">
                    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-[18px] bg-primary-soft font-display text-primary-deep">
                      {a.finishedAt ? <><span className="text-lg leading-none font-extrabold">{a.correctCount}</span><span className="text-[11px] font-bold">/{a.total}</span></> : <Clock className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-bold">{title}</span>
                      <span className="block text-sm text-muted">{subject} · {a.startedAt.toLocaleDateString("uz-UZ")}{a.finishedAt ? "" : " · davom etmoqda"}</span>
                    </span>
                    <ArrowRight className="size-5 text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="space-y-4">
          <div className={sub ? "rounded-[28px] bg-primary p-6 text-white" : "rounded-[28px] border border-line bg-surface p-6"}>
            <p className={sub ? "text-sm font-semibold text-white/80" : "text-sm font-semibold text-muted"}>Obuna</p>
            {sub ? (
              <>
                <p className="mt-1 font-display text-2xl font-bold">{sub.plan.name}</p>
                <p className="mt-1 text-[15px] text-white/85">{sub.sub.endsAt ? `${sub.sub.endsAt.toLocaleDateString("uz-UZ")} gacha` : sub.sub.testsLeft !== null ? `${sub.sub.testsLeft} ta test qoldi` : "Cheksiz"}</p>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-2xl font-bold">Bepul</p>
                <p className="mt-1 text-[15px] text-muted">Bepul testlar va 3 ta tushuntirish.</p>
                <Button asChild variant="primary" className="mt-4 w-full"><Link href="/tariflar">Tarif tanlash</Link></Button>
              </>
            )}
          </div>
          {orders.length ? (
            <div className="rounded-[28px] border border-line bg-surface p-6">
              <p className="mb-3 font-display text-lg font-bold">Buyurtmalar</p>
              <ul className="space-y-2 text-[15px]">
                {orders.map(({ o, plan }) => (
                  <li key={o.id} className="flex justify-between gap-3"><span>#{o.id} {plan}</span><span className={o.status === "paid" ? "font-semibold text-success-ink" : o.status === "failed" ? "text-danger-ink" : "font-semibold text-accent-ink"}>{o.status === "paid" ? "toʻlangan" : o.status === "failed" ? "bekor" : "kutilmoqda"}</span></li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
