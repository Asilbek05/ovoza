import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { ArrowRight, ArrowUpRight, AudioLines, CalendarCheck, Check, HelpCircle, Map, MessageCircle, Mic, Play, Shuffle } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { Button } from "@/components/ui/button";
import { HeroChat } from "@/components/site/hero-chat";
import { Pricing } from "@/components/site/pricing";
import { EXAM_ICON, EXAM_TONE } from "@/components/site/icons";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: AudioLines, t: "Ovozli tushuntirish + rasmlar", d: "Har bir xatoga ustoz audiosi. Yechim rasmlari audio bilan birga almashadi.", tone: "bg-primary-soft text-primary" },
  { icon: Shuffle, t: "Oʻxshash savol", d: "Tushuntirishdan keyin darhol shunga oʻxshash savol — tushunganingiz tekshiriladi.", tone: "bg-accent-soft text-accent-ink" },
  { icon: HelpCircle, t: "«Taxmin qildim» belgisi", d: "Omadga topilgan javoblar ham tahlilga tushadi — yashirin boʻshliq qolmaydi.", tone: "bg-success-soft text-success-ink" },
  { icon: Map, t: "Zaif mavzular xaritasi", d: "Natijada qaysi mavzuni takrorlash kerakligi bir qarashda koʻrinadi.", tone: "bg-primary-soft text-primary" },
  { icon: CalendarCheck, t: "Haqiqiy imtihon formati", d: "Vaqt, savollar soni va baholash rasmiy imtihondagidek.", tone: "bg-accent-soft text-accent-ink" },
  { icon: MessageCircle, t: "Telefonda qulay", d: "Katta harflar, katta tugmalar. Darsdan keyin 15 daqiqada bitta testni koʻrib chiqasiz.", tone: "bg-success-soft text-success-ink" },
];

export default async function Home() {
  const db = await getDb();
  const exams = await db
    .select({ e: s.examTypes, subjects: sql<number>`count(${s.subjects.id}) filter (where ${s.subjects.isActive})::int` })
    .from(s.examTypes)
    .leftJoin(s.subjects, eq(s.subjects.examTypeId, s.examTypes.id))
    .where(eq(s.examTypes.isActive, true))
    .groupBy(s.examTypes.id)
    .orderBy(s.examTypes.sort);
  const plans = await db.select().from(s.plans).where(eq(s.plans.isActive, true)).orderBy(s.plans.sort);

  return (
    <>
      {/* Hero */}
      <section className="container-page grid items-center gap-12 pt-8 pb-24 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-14 lg:pb-32">
        <div className="flex flex-col gap-7">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-primary-soft px-3.5 py-2 text-sm font-bold text-primary-deep"><Mic className="size-4" /> Oʻqituvchilar va abituriyentlar uchun</span>
          <h1 className="font-display text-[44px] leading-[1.02] font-extrabold sm:text-6xl lg:text-[60px] xl:text-[66px]">
            Xato qildingizmi? Ustoz <span className="marker">ovozli xabar</span> bilan tushuntiradi.
          </h1>
          <p className="max-w-[540px] text-lg leading-relaxed text-muted sm:text-[19px]">
            Attestatsiya va milliy sertifikat demo testlarini yeching. Har bir xato savolingizga ustozning audio tushuntirishi va yechim rasmlari keladi — xuddi Telegramdagidek.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg"><Link href="/imtihon/attestatsiya">Birinchi testni bepul yechish <ArrowRight /></Link></Button>
            <Button asChild variant="outline" size="lg" className="pl-2"><Link href="#qanday"><span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary"><Play className="size-4 fill-current" /></span>Qanday ishlaydi</Link></Button>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold text-muted">
            {["Birinchi test bepul", "Haqiqiy imtihon formati", "Roʻyxatdan oʻtish — 1 daqiqa"].map((x) => (
              <li key={x} className="flex items-center gap-1.5"><Check className="size-4 text-success" strokeWidth={2.8} /> {x}</li>
            ))}
          </ul>
        </div>
        <HeroChat />
      </section>

      {/* Exams */}
      <section className="container-page pb-24 lg:pb-32">
        <div className="mb-9 flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-bold tracking-widest text-primary uppercase">Yoʻnalishlar</span>
          <h2 className="font-display text-[34px] font-extrabold sm:text-5xl">Qaysi imtihonga tayyorlanyapsiz?</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {exams.map(({ e, subjects }) => {
            const Icon = EXAM_ICON[e.slug] ?? HelpCircle;
            const tone = EXAM_TONE[e.slug] ?? EXAM_TONE.attestatsiya;
            return (
              <Link key={e.id} href={`/imtihon/${e.slug}`} className={cn("group relative flex min-h-[290px] flex-col justify-between gap-6 rounded-[32px] p-7 transition hover:-translate-y-1", tone.card)}>
                <span className="flex items-start justify-between">
                  <span className={cn("flex size-[60px] items-center justify-center rounded-[20px]", tone.icon)}><Icon className="size-7" /></span>
                  <span className="rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold">{e.short}</span>
                </span>
                <span className="flex flex-col gap-2">
                  <span className="font-display text-[34px] leading-none font-extrabold">{e.name}</span>
                  <span className="text-base leading-relaxed text-ink-2">{e.description}</span>
                </span>
                <span className={cn("flex items-center justify-between text-[15px] font-bold", tone.link)}>
                  {e.comingSoon ? <span className="rounded-full bg-accent px-3 py-1 text-ink">Tez orada</span> : <span>{subjects} ta fan</span>}
                  <span className="flex size-11 items-center justify-center rounded-full bg-surface transition group-hover:rotate-45"><ArrowUpRight className="size-5" /></span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How */}
      <section id="qanday" className="container-page scroll-mt-24 pb-24 lg:pb-32">
        <div className="rounded-[40px] border border-line bg-surface p-7 sm:p-12 lg:p-16">
          <h2 className="max-w-2xl font-display text-[34px] leading-tight font-extrabold sm:text-5xl">Xatodan tushunchagacha — <span className="text-primary">3 qadam</span></h2>
          <div className="mt-11 grid gap-10 md:grid-cols-3">
            {[
              { n: 1, t: "Testni yeching", d: "Haqiqiy imtihon formati: vaqt, savollar soni va baholash bir xil.", c: "bg-primary text-white" },
              { n: 2, t: "Ovozli xabarni oling", d: "Har bir xatoga ustozning audio tushuntirishi va yechim rasmlari keladi.", c: "bg-accent text-ink" },
              { n: 3, t: "Oʻxshash savol bilan tekshiring", d: "Tushunganingizni shu yerning oʻzida oʻxshash savolda sinab koʻrasiz.", c: "bg-success text-white" },
            ].map((x) => (
              <div key={x.n} className="flex flex-col gap-3.5">
                <span className={cn("flex size-14 items-center justify-center rounded-full font-display text-2xl font-extrabold", x.c)}>{x.n}</span>
                <h3 className="font-display text-2xl font-bold">{x.t}</h3>
                <p className="text-base leading-relaxed text-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page pb-24 lg:pb-32">
        <span className="text-sm font-bold tracking-widest text-primary uppercase">Imkoniyatlar</span>
        <h2 className="mt-2 mb-9 font-display text-[34px] font-extrabold sm:text-5xl">Oddiy test sayti emas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, t, d, tone }) => (
            <div key={t} className="flex gap-4 rounded-[28px] border border-line bg-surface p-6">
              <span className={cn("flex size-13 shrink-0 items-center justify-center rounded-2xl", tone)}><Icon className="size-6" /></span>
              <span className="flex flex-col gap-1.5"><span className="font-display text-xl font-bold">{t}</span><span className="text-[15px] leading-relaxed text-muted">{d}</span></span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="tariflar" className="container-page scroll-mt-24 pb-24 lg:pb-32">
        <h2 className="mb-8 font-display text-[34px] font-extrabold sm:text-5xl">Tariflar</h2>
        <Pricing plans={plans} />
      </section>

      {/* CTA */}
      <section className="container-page">
        <div className="relative flex flex-col items-start gap-8 overflow-hidden rounded-[40px] bg-primary-deep p-8 text-white sm:p-14 lg:flex-row lg:items-center lg:justify-between lg:p-[72px]">
          <span aria-hidden className="absolute -top-16 -right-16 size-64 rounded-full bg-primary" />
          <h2 className="relative max-w-2xl font-display text-[34px] leading-[1.05] font-extrabold sm:text-[56px]">Keyingi imtihonga xatolaringizni tushunib kiring.</h2>
          <Button asChild variant="accent" size="lg" className="relative"><Link href="/imtihon/attestatsiya">Bepul boshlash <ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
