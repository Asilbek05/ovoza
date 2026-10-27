import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { ArrowRight, ArrowUpRight, AudioLines, CalendarCheck, Check, ChevronDown, HelpCircle, Map, MessageCircle, Mic, Minus, Play, Shuffle } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { Button } from "@/components/ui/button";
import { HeroChat } from "@/components/site/hero-chat";
import { Pricing } from "@/components/site/pricing";
import { EXAM_ICON, EXAM_TONE } from "@/components/site/icons";
import { cn } from "@/lib/utils";

const FAQ = [
  { q: "Test haqiqiy imtihon formatidami?", a: "Ha. Vaqt, savollar soni va baholash rasmiy imtihonga moslab tuzilgan. Bu oʻquv-mashq testi: u imtihon natijasiga kafolat bermaydi, lekin tayyorgarlikni aniq koʻrsatadi." },
  { q: "Tushuntirishlarni kim yozadi?", a: "Tajribali ustozlar. Har bir tushuntirishda muallif ismi koʻrsatiladi: ovozli xabar va yechim rasmlari audio bilan birga almashadi." },
  { q: "«Taxmin qildim» belgisi nima uchun?", a: "Javobni topolmay, omadga tanlagan boʻlsangiz, shuni belgilang. Taxmin bilan topilgan savol ham xato kabi tahlilga tushadi — shunda yashirin boʻshliq qolmaydi." },
  { q: "Bepul rejada nimalar bor?", a: "Bitta demo test va uning dastlabki 3 ta xatosining toʻliq ovozli tahlili. Roʻyxatdan oʻtish bir daqiqa oladi." },
  { q: "Qanday toʻlayman?", a: "Click va Payme tez orada ulanadi. Hozircha tarifni tanlaysiz, karta orqali toʻlaysiz va toʻlov tasdiqlangach obuna avtomatik ochiladi." },
  { q: "Telefonda ishlaydimi?", a: "Ha. Platforma avvalo telefon uchun yaratilgan: katta harflar, katta tugmalar, sekin internetda ham tez ochiladi." },
];

const COMPARE = [
  { row: "Natija va ball", a: true, b: true },
  { row: "Har bir xatoga tushuntirish", a: false, b: true },
  { row: "Ustozning ovozli izohi", a: false, b: true },
  { row: "Audio bilan sinxron yechim rasmlari", a: false, b: true },
  { row: "Oʻxshash savol bilan tekshiruv", a: false, b: true },
  { row: "Taxmin bilan topilganlar tahlili", a: false, b: true },
];

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
  const [{ tests, questions, voiced }] = await db.select({
    tests: sql<number>`(select count(*) from tests where is_published)::int`,
    questions: sql<number>`(select count(*) from questions q join tests t on t.id = q.test_id where t.is_published)::int`,
    voiced: sql<number>`(select count(*) from explanations where audio_url is not null)::int`,
  }).from(s.examTypes).limit(1).then((r) => (r.length ? r : [{ tests: 0, questions: 0, voiced: 0 }]));
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

      {/* Numbers */}
      <section aria-label="Raqamlarda" className="container-page -mt-8 pb-20 lg:-mt-14 lg:pb-28">
        <div className="grid grid-cols-3 divide-x divide-line rounded-[28px] border border-line bg-surface py-6 text-center">
          {[{ v: tests, l: "ta test" }, { v: questions, l: "ta savol" }, { v: voiced, l: "ta ovozli tushuntirish" }].map((x) => (
            <div key={x.l} className="px-2"><span className="block font-display text-[30px] leading-none font-extrabold text-primary sm:text-[44px]">{x.v}</span><span className="mt-1.5 block text-[13px] font-semibold text-muted sm:text-[15px]">{x.l}</span></div>
          ))}
        </div>
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

      {/* Compare */}
      <section className="container-page pb-24 lg:pb-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <span className="text-sm font-bold tracking-widest text-primary uppercase">Farq nimada</span>
            <h2 className="mt-2 font-display text-[34px] leading-tight font-extrabold sm:text-5xl">Ball bilan toʻxtamaymiz. <span className="marker">Nega</span> xato qilganingizni koʻrsatamiz.</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">Oddiy test saytlari «3 ta xato» deydi va tamom. Bu yerda esa har bir xato — kichik dars.</p>
          </div>
          <div className="overflow-hidden rounded-[32px] border border-line bg-surface">
            <div className="grid grid-cols-[1fr_96px_96px] items-center border-b border-line bg-bg px-5 py-4 text-[13px] font-bold text-muted sm:grid-cols-[1fr_130px_130px]"><span />
              <span className="text-center">Oddiy test saytlari</span><span className="text-center text-primary">tushun.</span></div>
            {COMPARE.map((c) => (
              <div key={c.row} className="grid grid-cols-[1fr_96px_96px] items-center border-b border-line-2 px-5 py-4 last:border-0 sm:grid-cols-[1fr_130px_130px]">
                <span className="pr-3 text-[15px] font-semibold">{c.row}</span>
                <span className="flex justify-center">{c.a ? <Check className="size-5 text-muted" /> : <Minus className="size-5 text-line" />}</span>
                <span className="flex justify-center"><span className="flex size-7 items-center justify-center rounded-full bg-success-soft"><Check className="size-4 text-success" strokeWidth={3} /></span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tariflar" className="container-page scroll-mt-24 pb-24 lg:pb-32">
        <h2 className="mb-8 font-display text-[34px] font-extrabold sm:text-5xl">Tariflar</h2>
        <Pricing plans={plans} />
      </section>

      {/* FAQ */}
      <section id="savollar" className="container-page scroll-mt-24 pb-24 lg:pb-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <span className="text-sm font-bold tracking-widest text-primary uppercase">Savol-javob</span>
            <h2 className="mt-2 font-display text-[34px] leading-tight font-extrabold sm:text-5xl">Koʻp beriladigan savollar</h2>
            <p className="mt-4 text-lg text-muted">Javob topolmadingizmi? <Link href="/aloqa" className="font-bold text-primary underline underline-offset-4">Bizga yozing</Link>.</p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-[24px] border border-line bg-surface px-6 py-1 open:border-primary-mid">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition group-open:rotate-180"><ChevronDown className="size-5" /></span>
                </summary>
                <p className="pb-5 text-[16px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
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
