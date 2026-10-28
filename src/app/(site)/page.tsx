import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { ArrowRight, ArrowUpRight, AudioLines, CalendarCheck, Check, ChevronDown, HelpCircle, Map, Minus, Play, Shuffle, Smartphone } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { Button } from "@/components/ui/button";
import { HeroChat } from "@/components/site/hero-chat";
import { Pricing } from "@/components/site/pricing";
import { EXAM_ICON, EXAM_TONE } from "@/components/site/icons";
import { LogoMark } from "@/components/brand/logo";
import { cn, waveform } from "@/lib/utils";

const FAQ = [
  { q: "Test haqiqiy imtihon formatidami?", a: "Ha. Vaqt, savollar soni va baholash rasmiy imtihonga moslab tuzilgan. Bu oʻquv-mashq testi: u imtihon natijasiga kafolat bermaydi, lekin tayyorgarlikni aniq koʻrsatadi." },
  { q: "Tushuntirishlarni kim yozadi?", a: "Tajribali ustozlar. Har bir tushuntirishda muallif ismi koʻrsatiladi: ovozli xabar va yechim rasmlari audio bilan birga almashadi." },
  { q: "«Taxmin qildim» belgisi nima uchun?", a: "Javobni topolmay, omadga tanlagan boʻlsangiz, shuni belgilang. Taxmin bilan topilgan savol ham xato kabi tahlilga tushadi — shunda yashirin boʻshliq qolmaydi." },
  { q: "Bepul rejada nimalar bor?", a: "Bitta demo test va uning dastlabki 3 ta xatosining toʻliq ovozli tahlili. Roʻyxatdan oʻtish bir daqiqa oladi." },
  { q: "Qanday toʻlayman?", a: "Click va Payme tez orada ulanadi. Hozircha tarifni tanlaysiz, karta orqali toʻlaysiz va toʻlov tasdiqlangach obuna avtomatik ochiladi." },
  { q: "Telefonda ishlaydimi?", a: "Ha. Platforma avvalo telefon uchun yaratilgan: katta harflar, katta tugmalar, sekin internetda ham tez ochiladi." },
];

const COMPARE = [
  { row: "Natija va ball", a: true },
  { row: "Har bir xatoga tushuntirish", a: false },
  { row: "Ustozning ovozli izohi", a: false },
  { row: "Audio bilan sinxron yechim rasmlari", a: false },
  { row: "Oʻxshash savol bilan tekshiruv", a: false },
  { row: "Taxmin bilan topilganlar tahlili", a: false },
];

const BENTO = [
  { icon: AudioLines, t: "Ovozli tushuntirish + rasmlar", d: "Har bir xatoga ustozning audiosi. Yechim rasmlari audioning aynan kerakli soniyasida almashadi — xuddi ustoz yoningizda turib, doskada yozayotgandek.", span: "lg:col-span-2 lg:row-span-2", dark: true },
  { icon: Shuffle, t: "Oʻxshash savol", d: "Tushuntirishdan keyin darhol shunga oʻxshash savol — tushunganingiz tekshiriladi." },
  { icon: HelpCircle, t: "«Taxmin qildim»", d: "Omadga topilgan javoblar ham tahlilga tushadi." },
  { icon: Map, t: "Zaif mavzular xaritasi", d: "Qaysi mavzuni takrorlash kerakligi bir qarashda koʻrinadi." },
  { icon: CalendarCheck, t: "Haqiqiy imtihon formati", d: "Vaqt, savollar soni va baholash rasmiy imtihondagidek." },
  { icon: Smartphone, t: "Telefon birinchi", d: "Katta harflar, katta tugmalar. Darsdan keyin 15 daqiqada bitta testni koʻrib chiqasiz.", span: "lg:col-span-2" },
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
  const [{ tests, questions, voiced }] = await db
    .select({
      tests: sql<number>`(select count(*) from tests where is_published)::int`,
      questions: sql<number>`(select count(*) from questions q join tests t on t.id = q.test_id where t.is_published)::int`,
      voiced: sql<number>`(select count(*) from explanations where audio_url is not null)::int`,
    })
    .from(s.examTypes)
    .limit(1)
    .then((r) => (r.length ? r : [{ tests: 0, questions: 0, voiced: 0 }]));
  const subjectNames = await db.selectDistinct({ name: s.subjects.name }).from(s.subjects).where(eq(s.subjects.isActive, true));
  const plans = await db.select().from(s.plans).where(eq(s.plans.isActive, true)).orderBy(s.plans.sort);
  const ticker = subjectNames.map((x) => x.name);
  const wave = waveform(46, 5);

  return (
    <>
      {/* Hero */}
      <section className="container-page grid items-center gap-14 overflow-x-clip pt-10 pb-16 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:pt-20 lg:pb-24">
        <div className="flex flex-col gap-8">
          <span className="inline-flex items-center gap-2.5 self-start rounded-full border border-line bg-surface py-1.5 pr-4 pl-1.5 text-sm font-semibold text-ink-2">
            <span className="rounded-full bg-primary px-2.5 py-1 text-[12px] font-bold text-accent">YANGI</span> Attestatsiya va milliy sertifikat uchun
          </span>
          <h1 className="font-serif text-[56px] leading-[0.98] font-normal tracking-[-0.025em] sm:text-[80px] lg:text-[88px]">
            Xatoingizni ustoz <em className="marker pr-1 italic">ovozi</em> bilan tushuning.
          </h1>
          <p className="max-w-[520px] text-[18px] leading-relaxed text-muted sm:text-[19px]">
            Testni yeching. Har bir xato savolingizga ustozning audio tushuntirishi va yechim rasmlari keladi — xuddi Telegramdagi ovozli xabardek, lekin doskadagi yechim bilan.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg"><Link href="/imtihon/attestatsiya">Birinchi testni bepul yechish <ArrowRight /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="#qanday"><Play className="fill-current" /> Qanday ishlaydi</Link></Button>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold text-ink-2">
            {["Birinchi test bepul", "Haqiqiy imtihon formati", "Roʻyxatdan oʻtish — 1 daqiqa"].map((x) => (
              <li key={x} className="flex items-center gap-1.5"><Check className="size-4 text-primary" strokeWidth={3} /> {x}</li>
            ))}
          </ul>
        </div>
        <HeroChat />
      </section>

      {/* Subject ticker */}
      <section aria-label="Fanlar" className="overflow-hidden border-y border-line bg-primary-deep py-4 text-white">
        <div className="flex w-max animate-[marquee_48s_linear_infinite] gap-10 whitespace-nowrap hover:[animation-play-state:paused]">
          {[...ticker, ...ticker, ...ticker, ...ticker].map((n, i) => (
            <span key={i} className="flex items-center gap-10 font-serif text-[26px] italic">{n}<span aria-hidden className="size-2 rounded-full bg-accent" /></span>
          ))}
        </div>
      </section>

      {/* Numbers */}
      <section aria-label="Raqamlarda" className="container-page py-14 lg:py-20">
        <dl className="grid grid-cols-3 gap-4 text-center">
          {[{ v: tests, l: "ta test" }, { v: questions, l: "ta savol" }, { v: voiced, l: "ta ovozli tushuntirish" }].map((x) => (
            <div key={x.l}><dd className="font-serif text-[52px] leading-none sm:text-[88px]">{x.v}</dd><dt className="mt-2 text-[13px] font-semibold text-muted sm:text-[16px]">{x.l}</dt></div>
          ))}
        </dl>
      </section>

      {/* Exams */}
      <section className="container-page pb-24 lg:pb-32">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-2xl font-serif text-[42px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[60px]">Qaysi imtihonga <em className="italic">tayyorlanyapsiz?</em></h2>
          <p className="max-w-xs text-[16px] text-muted">Yoʻnalishni tanlang — fanlar va demo testlar tayyor.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {exams.map(({ e, subjects }, idx) => {
            const Icon = EXAM_ICON[e.slug] ?? HelpCircle;
            const tone = EXAM_TONE[e.slug] ?? EXAM_TONE.attestatsiya;
            return (
              <Link key={e.id} href={`/imtihon/${e.slug}`} className={cn("group relative flex min-h-[320px] flex-col justify-between gap-8 overflow-hidden rounded-[24px] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-float", tone.card)}>
                <span className="flex items-start justify-between">
                  <span className={cn("flex size-14 items-center justify-center rounded-[16px]", tone.icon)}><Icon className="size-6" /></span>
                  <span className="font-serif text-[56px] leading-none text-ink/15">0{idx + 1}</span>
                </span>
                <span className="flex flex-col gap-3">
                  <span className="self-start rounded-full bg-surface/80 px-3 py-1 text-[13px] font-bold">{e.short}</span>
                  <span className="font-serif text-[44px] leading-none">{e.name}</span>
                  <span className="text-[16px] leading-relaxed text-ink-2">{e.description}</span>
                </span>
                <span className={cn("flex items-center justify-between text-[15px] font-bold", tone.link)}>
                  {e.comingSoon ? <span className="rounded-full bg-accent px-3 py-1 text-ink">Tez orada</span> : <span>{subjects} ta fan</span>}
                  <span className="flex size-11 items-center justify-center rounded-full bg-ink text-white transition group-hover:rotate-45 group-hover:bg-primary"><ArrowUpRight className="size-5" /></span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How */}
      <section id="qanday" className="grain scroll-mt-20 bg-primary-deep py-20 text-white lg:py-28">
        <div className="container-page">
          <h2 className="max-w-3xl font-serif text-[44px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[68px]">Xatodan <em className="text-accent italic">tushunchagacha</em> — uch qadam.</h2>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { t: "Testni yeching", d: "Haqiqiy imtihon formati: vaqt, savollar soni va baholash bir xil. Ishonchsiz javobga «Taxmin qildim» belgisini qoʻying." },
              { t: "Ovozli xabarni oling", d: "Har bir xatoga ustozning audio tushuntirishi va yechim rasmlari keladi. Rasmlar audio bilan birga almashadi." },
              { t: "Oʻxshash savol bilan tekshiring", d: "Tushunganingizni shu yerning oʻzida oʻxshash savolda sinab koʻrasiz. Toʻgʻri javob — mavzu yopildi." },
            ].map((x, i) => (
              <li key={x.t} className="relative flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-7">
                <span className="font-serif text-[96px] leading-[0.8] text-accent">{i + 1}</span>
                <h3 className="text-[22px] leading-tight font-bold">{x.t}</h3>
                <p className="text-[16px] leading-relaxed text-white/70">{x.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Bento features */}
      <section className="container-page py-24 lg:py-32">
        <h2 className="mb-10 max-w-3xl font-serif text-[42px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[60px]">Oddiy test sayti <em className="italic">emas.</em></h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {BENTO.map(({ icon: Icon, t, d, span, dark }) => (
            <div key={t} className={cn("relative flex flex-col justify-between gap-6 overflow-hidden rounded-[24px] border p-7", dark ? "border-transparent bg-primary text-white" : "border-line bg-surface", span)}>
              <span className={cn("flex size-12 items-center justify-center rounded-[14px]", dark ? "bg-accent text-ink" : "bg-primary-soft text-primary")}><Icon className="size-6" /></span>
              {dark ? (
                <div aria-hidden className="flex h-16 items-center gap-[3px]">
                  {wave.map((h, i) => <span key={i} className="flex-1 origin-center animate-wave rounded-full bg-accent/80" style={{ height: `${Math.round(h * 100)}%`, animationDelay: `${(i % 12) * 0.09}s` }} />)}
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                <h3 className={cn("font-bold", dark ? "text-[28px] leading-tight" : "text-[20px]")}>{t}</h3>
                <p className={cn("leading-relaxed", dark ? "max-w-md text-[17px] text-white/75" : "text-[15px] text-muted")}>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compare */}
      <section className="container-page pb-24 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-serif text-[42px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[60px]">Ball bilan toʻxtamaymiz. <em className="marker italic">Nega</em> xato qilganingizni koʻrsatamiz.</h2>
            <p className="mt-6 max-w-md text-[18px] leading-relaxed text-muted">Oddiy test saytlari «3 ta xato» deydi va tamom. Bu yerda esa har bir xato — kichik dars.</p>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-line bg-surface">
            <div className="grid grid-cols-[1fr_92px_92px] items-center border-b border-line bg-bg px-5 py-4 text-[13px] font-bold text-muted sm:grid-cols-[1fr_130px_130px]">
              <span />
              <span className="text-center">Oddiy saytlar</span>
              <span className="flex items-center justify-center gap-1.5 text-ink"><LogoMark className="size-5" /> ovoza</span>
            </div>
            {COMPARE.map((c) => (
              <div key={c.row} className="grid grid-cols-[1fr_92px_92px] items-center border-b border-line-2 px-5 py-4 last:border-0 sm:grid-cols-[1fr_130px_130px]">
                <span className="pr-3 text-[15px] font-semibold">{c.row}</span>
                <span className="flex justify-center">{c.a ? <Check className="size-5 text-muted" /> : <Minus className="size-5 text-line" />}</span>
                <span className="flex justify-center"><span className="flex size-7 items-center justify-center rounded-full bg-accent"><Check className="size-4 text-ink" strokeWidth={3} /></span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tariflar" className="container-page scroll-mt-24 pb-24 lg:pb-32">
        <h2 className="mb-10 font-serif text-[42px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[60px]">Tariflar</h2>
        <Pricing plans={plans} />
      </section>

      {/* FAQ */}
      <section id="savollar" className="container-page scroll-mt-24 pb-24 lg:pb-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <h2 className="font-serif text-[42px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[60px]">Koʻp beriladigan <em className="italic">savollar</em></h2>
            <p className="mt-5 text-[18px] text-muted">Javob topolmadingizmi? <Link href="/aloqa" className="font-bold text-primary underline underline-offset-4">Bizga yozing</Link>.</p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-[18px] border border-line bg-surface px-6 py-1 transition open:border-ink/30">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg text-ink transition group-open:rotate-180 group-open:bg-accent"><ChevronDown className="size-5" /></span>
                </summary>
                <p className="pb-5 text-[16px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page">
        <div className="grain relative flex flex-col items-start gap-8 overflow-hidden rounded-[28px] bg-primary-deep p-8 text-white sm:p-14 lg:flex-row lg:items-center lg:justify-between lg:p-[72px]">
          <span aria-hidden className="absolute -right-24 -bottom-24 size-[380px] rounded-full border border-white/10" />
          <span aria-hidden className="absolute -right-8 -bottom-8 size-[220px] rounded-full border border-white/15" />
          <span aria-hidden className="absolute right-12 bottom-12 size-[80px] rounded-full bg-accent" />
          <h2 className="relative max-w-2xl font-serif text-[44px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[68px]">Keyingi imtihonga xatolaringizni <em className="text-accent italic">tushunib</em> kiring.</h2>
          <Button asChild variant="accent" size="lg" className="relative"><Link href="/imtihon/attestatsiya">Bepul boshlash <ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
