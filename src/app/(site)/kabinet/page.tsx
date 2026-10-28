import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, Clock, LogOut, Settings, Target, Trophy, ListChecks } from "lucide-react";
import { getUserStats } from "@/lib/stats";
import { getSettings } from "@/lib/settings";
import { paymentLinks } from "@/lib/payments";
import { cn } from "@/lib/utils";
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
  await searchParams;
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
  const stats = await getUserStats(user.id);
  const settings = await getSettings();
  const links = pending ? paymentLinks({ id: pending.o.id, amountUzs: pending.o.amountUzs }) : {};
  const online = Boolean(links.click || links.payme);

  return (
    <div className="container-page pt-10 pb-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{user.audience === "applicant" ? "Abituriyent" : "Oʻqituvchi"} · +{user.phone}</p>
          <h1 className="t-h1">Salom, {user.name.split(" ")[0]}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/kabinet/profil"><Settings /> Profil</Link></Button>
          <form action={logout}><Button variant="ghost"><LogOut /> Chiqish</Button></form>
        </div>
      </div>

      {pending ? (
        <div className="mb-6 rounded-3xl border-2 border-accent bg-accent-soft p-6">
          <p className="font-display text-xl font-bold">Buyurtma qabul qilindi: {pending.plan} · {formatPrice(pending.o.amountUzs)}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{online ? "Quyidagi tugma orqali toʻlang — toʻlov tushishi bilan obuna avtomatik ochiladi." : "Click va Payme tez orada ulanadi. Hozircha quyidagi usulda toʻlang — tasdiqlangach obuna avtomatik ochiladi."}</p>
          {online ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.click ? <Button asChild variant="primary" size="lg"><a href={links.click}>Click orqali toʻlash</a></Button> : null}
              {links.payme ? <Button asChild variant="ink" size="lg"><a href={links.payme}>Payme orqali toʻlash</a></Button> : null}
            </div>
          ) : null}
          <dl className="mt-4 grid gap-2 rounded-2xl bg-surface p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-semibold text-muted">Buyurtma raqami</dt><dd className="font-display text-xl font-bold">#{pending.o.id}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Summa</dt><dd className="font-display text-xl font-bold">{formatPrice(pending.o.amountUzs)}</dd></div>
            {!online && settings.payment_card ? <div><dt className="text-xs font-semibold text-muted">Karta</dt><dd className="font-display text-xl font-bold tabular-nums">{settings.payment_card}</dd>{settings.payment_holder ? <dd className="text-xs text-muted">{settings.payment_holder}</dd> : null}</div> : null}
            <div><dt className="text-xs font-semibold text-muted">Izohga yozing</dt><dd className="font-semibold">Buyurtma #{pending.o.id} · +{user.phone}</dd></div>
          </dl>
          {settings.site_telegram ? <p className="mt-3 text-sm">Chekni yuboring: <a href={settings.site_telegram} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline underline-offset-2">Telegram</a></p> : settings.site_phone ? <p className="mt-3 text-sm">Savol boʻlsa: <b>{settings.site_phone}</b></p> : null}
        </div>
      ) : null}

      {stats.count > 0 ? (
        <section aria-label="Statistika" className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ListChecks, v: stats.count, l: "test yechildi", tone: "bg-primary-soft text-primary" },
                { icon: Target, v: `${stats.avg}%`, l: "oʻrtacha natija", tone: "bg-accent-soft text-accent-ink" },
                { icon: Trophy, v: `${stats.best}%`, l: "eng yaxshi", tone: "bg-success-soft text-success-ink" },
              ].map(({ icon: Icon, v, l, tone }) => (
                <div key={l} className="flex flex-col gap-2">
                  <span className={cn("flex size-10 items-center justify-center rounded-2xl", tone)}><Icon className="size-5" /></span>
                  <span className="font-display text-2xl leading-none font-bold sm:text-3xl">{v}</span>
                  <span className="text-xs font-semibold text-muted">{l}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 mb-2 text-sm font-semibold text-muted">Oxirgi natijalar</p>
            <div role="img" aria-label={`Oxirgi ${stats.trend.length} ta test natijasi: ${stats.trend.map((x) => x.pct + "%").join(", ")}`} className="flex h-28 items-end gap-1.5 sm:gap-2">
              {stats.trend.map((x) => (
                <Link key={x.id} href={`/natija/${x.id}`} title={`${x.title}: ${x.pct}%`} className="group flex h-full max-w-14 flex-1 flex-col justify-end gap-1">
                  <span className="text-center text-xs font-bold text-muted opacity-0 transition group-hover:opacity-100">{x.pct}</span>
                  <span className={cn("block min-h-1.5 rounded-t-lg transition group-hover:opacity-80", x.pct >= 70 ? "bg-success" : x.pct >= 50 ? "bg-primary" : "bg-danger")} style={{ height: `${Math.max(6, x.pct)}%` }} />
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
            <h2 className="t-h3">Takrorlash kerak</h2>
            {stats.weak.length === 0 ? <p className="mt-3 text-sm text-muted">Hali yetarli maʼlumot yoʻq — yana bir-ikki test yeching.</p> : (
              <ul className="mt-4 space-y-3.5">
                {stats.weak.map((w) => (
                  <li key={w.topic}>
                    <div className="mb-1.5 flex justify-between text-sm font-semibold"><span className="truncate pr-3">{w.topic}</span><span className={w.pct < 60 ? "text-danger-ink" : "text-primary-deep"}>{w.correct}/{w.total}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-line-2"><div className={cn("h-full rounded-full", w.pct < 60 ? "bg-danger" : "bg-primary")} style={{ width: `${Math.max(4, w.pct)}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-line bg-surface p-4 sm:p-6">
          <h2 className="px-2 pb-3 t-h3">Urinishlarim</h2>
          {attempts.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-muted">Hali test yechmagansiz.</p>
              <Button asChild variant="primary" className="mt-4"><Link href="/imtihon/attestatsiya">Birinchi testni yechish</Link></Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {attempts.map(({ a, title, subject }) => (
                <li key={a.id}>
                  <Link href={a.finishedAt ? `/natija/${a.id}` : `/urinish/${a.id}`} className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-bg">
                    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft font-display text-primary-deep">
                      {a.finishedAt ? <><span className="text-lg leading-none font-bold">{a.correctCount}</span><span className="text-xs font-bold">/{a.total}</span></> : <Clock className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold">{title}</span>
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
          <div className={sub ? "rounded-3xl bg-primary p-6 text-white" : "rounded-3xl border border-line bg-surface p-6"}>
            <p className={sub ? "text-sm font-semibold text-white/80" : "text-sm font-semibold text-muted"}>Obuna</p>
            {sub ? (
              <>
                <p className="mt-1 font-display text-2xl font-bold">{sub.plan.name}</p>
                <p className="mt-1 text-sm text-white/85">{sub.sub.endsAt ? `${sub.sub.endsAt.toLocaleDateString("uz-UZ")} gacha` : sub.sub.testsLeft !== null ? `${sub.sub.testsLeft} ta test qoldi` : "Cheksiz"}</p>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-2xl font-bold">Bepul</p>
                <p className="mt-1 text-sm text-muted">Bepul testlar va 3 ta tushuntirish.</p>
                <Button asChild variant="primary" className="mt-4 w-full"><Link href="/tariflar">Tarif tanlash</Link></Button>
              </>
            )}
          </div>
          {orders.length ? (
            <div className="rounded-3xl border border-line bg-surface p-6">
              <p className="mb-3 font-display text-lg font-bold">Buyurtmalar</p>
              <ul className="space-y-2 text-sm">
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
