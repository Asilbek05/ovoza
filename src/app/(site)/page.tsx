import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, HelpCircle, Mic, Target, Layers } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { Button } from "@/components/ui/button";
import { Pricing } from "@/components/site/pricing";
import { DemoCard } from "@/components/site/demo-card";
import { EXAM_ICON, EXAM_TONE } from "@/components/site/icons";
import { cn, waveform } from "@/lib/utils";

const FAQ = [
  { q: "Test haqiqiy imtihon formatidami?", a: "Ha. Vaqt, savollar soni va baholash rasmiy imtihonga moslab tuzilgan. Bu oʻquv-mashq testi: u imtihon natijasiga kafolat bermaydi, lekin tayyorgarlikni aniq koʻrsatadi." },
  { q: "Tushuntirishlarni kim yozadi?", a: "Tajribali ustozlar. Har bir tushuntirishda muallif ismi koʻrsatiladi: ovozli xabar va yechim rasmlari audio bilan birga almashadi." },
  { q: "«Taxmin qildim» belgisi nima uchun?", a: "Javobni topolmay, omadga tanlagan boʻlsangiz, shuni belgilang. Taxmin bilan topilgan savol ham xato kabi tahlilga tushadi — shunda yashirin boʻshliq qolmaydi." },
  { q: "Bepul rejada nimalar bor?", a: "Bitta demo test va uning dastlabki 3 ta xatosining toʻliq ovozli tahlili. Roʻyxatdan oʻtish bir daqiqa oladi." },
  { q: "Qanday toʻlayman?", a: "Click va Payme orqali yoki kartaga oʻtkazib. Toʻlov tasdiqlanishi bilan obuna avtomatik ochiladi." },
  { q: "Telefonda ishlaydimi?", a: "Ha. Platforma avvalo telefon uchun yaratilgan: katta harflar, katta tugmalar, sekin internetda ham tez ochiladi." },
];

function Heading({ eyebrow, title, text, center }: { eyebrow?: string; title: React.ReactNode; text?: string; center?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3", center && "mx-auto max-w-2xl items-center text-center")}>
      {eyebrow ? <span className="t-eyebrow text-primary">{eyebrow}</span> : null}
      <h2 className="t-h2">{title}</h2>
      {text ? <p className="max-w-xl text-base text-muted">{text}</p> : null}
    </div>
  );
}

/** Small UI illustrations for the feature rows. */
function VoiceArt() {
  const bars = waveform(40, 7);
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-primary p-6 sm:p-8">
      <div className="bubble-in flex items-center gap-3 bg-white/10 p-3 pr-5 ring-1 ring-white/15">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink"><svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-current" aria-hidden><path d="M8 5v14l11-7z" /></svg></span>
        <span aria-hidden className="flex h-9 flex-1 items-center gap-[3px]">{bars.map((h, i) => <span key={i} className={cn("flex-1 rounded-full", i < 17 ? "bg-accent" : "bg-white/35")} style={{ height: `${Math.round(h * 100)}%` }} />)}</span>
        <span className="text-xs font-semibold tabular-nums text-white">1:09</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("relative flex aspect-[4/3] flex-col justify-center gap-1.5 rounded-xl p-3", n === 2 ? "bg-white ring-2 ring-accent" : "bg-white/10")}>
            <span className={cn("absolute top-2 left-3 text-xs font-bold", n === 2 ? "text-primary" : "text-white/60")}>{n}</span>
            <span className={cn("h-1 w-4/5 rounded-full", n === 2 ? "bg-primary-mid" : "bg-white/30")} /><span className={cn("h-1.5 w-2/3 rounded-full", n === 2 ? "bg-accent-deep" : "bg-white/50")} /><span className={cn("h-1 w-3/4 rounded-full", n === 2 ? "bg-primary-mid" : "bg-white/30")} />
          </span>
        ))}
      </div>
    </div>
  );
}

function GuessArt() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-accent-soft p-6 sm:p-8">
      <div className="rounded-2xl bg-surface p-4">
        <p className="text-sm font-semibold">24 ning 25 foizi nechaga teng?</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {["4", "6", "8", "12"].map((o, i) => (
            <span key={o} className={cn("flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold", i === 1 ? "border-primary bg-primary-soft" : "border-line")}>
              <span className={cn("flex size-6 items-center justify-center rounded-full text-xs font-bold", i === 1 ? "bg-primary text-white" : "bg-bg")}>{"ABCD"[i]}</span>{o}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 rounded-2xl bg-surface p-2">
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-muted">Aniq bilaman</span>
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-bold"><HelpCircle className="size-4" /> Taxmin qildim</span>
      </div>
      <p className="px-1 text-xs font-semibold text-accent-ink">Omadga topilgan javob ham tahlilga tushadi.</p>
    </div>
  );
}

function TopicsArt() {
  const rows = [["Kvadrat tenglamalar", 0.25, "0 / 4"], ["Foizlar", 0.5, "2 / 4"], ["Progressiyalar", 0.75, "3 / 4"], ["Logarifmlar", 1, "4 / 4"]] as const;
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-tone-sky-soft p-6 sm:p-8">
      {rows.map(([name, v, label]) => (
        <div key={name}>
          <div className="mb-1.5 flex justify-between text-sm font-semibold"><span>{name}</span><span className={v < 0.6 ? "text-danger-ink" : "text-primary"}>{label}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface"><div className={cn("h-full rounded-full", v < 0.6 ? "bg-danger" : "bg-primary")} style={{ width: `${v * 100}%` }} /></div>
        </div>
      ))}
      <p className="rounded-xl bg-surface px-4 py-3 text-sm"><b>Tavsiya:</b> avval «Kvadrat tenglamalar» ni takrorlang.</p>
    </div>
  );
}

export default async function Home() {
  const db = await getDb();
  const exams = await db
    .select({ e: s.examTypes, subjects: sql<number>`count(${s.subjects.id}) filter (where ${s.subjects.isActive})::int` })
    .from(s.examTypes)
    .leftJoin(s.subjects, eq(s.subjects.examTypeId, s.examTypes.id))
    .where(eq(s.examTypes.isActive, true))
    .groupBy(s.examTypes.id)
    .orderBy(s.examTypes.sort);
  const subjectNames = await db.selectDistinct({ name: s.subjects.name }).from(s.subjects).where(eq(s.subjects.isActive, true));
  const plans = await db.select().from(s.plans).where(eq(s.plans.isActive, true)).orderBy(s.plans.sort);

  const rows = [
    { icon: Mic, eyebrow: "Ovozli tushuntirish", title: <>Ustoz yoningizda turgandek <span className="marker">tushuntiradi</span></>, text: "Har bir xatoga ustozning audiosi. Yechim rasmlari audioning aynan kerakli soniyasida almashadi — doskada yozilayotgandek. Tezlikni 1.5× gacha oshirish mumkin.", points: ["Audio + 2–4 ta yechim rasmi", "Rasmni bossangiz audio shu joyga oʻtadi", "Tushunmasangiz — «Tushunmadim» bosing"], art: <VoiceArt />, flip: false },
    { icon: Target, eyebrow: "Halol natija", title: <>«Taxmin qildim» — yashirin boʻshliq <span className="marker">qolmaydi</span></>, text: "Javobni topolmay, omadga tanlagan boʻlsangiz, shuni belgilang. Tasodifan topilgan savol ham xato kabi tahlilga tushadi.", points: ["Taxmin bilan topilganlar alohida koʻrsatiladi", "Belgilab qoʻyib, keyin qaytish mumkin", "Imtihondagidek vaqt va baholash"], art: <GuessArt />, flip: true },
    { icon: Layers, eyebrow: "Mavzular xaritasi", title: <>Qaysi mavzu <span className="marker">zaifligi</span> bir qarashda koʻrinadi</>, text: "Natijada mavzular boʻyicha tahlil va keyingi qadam tavsiyasi. Kabinetda barcha urinishlar boʻyicha umumiy statistika yigʻiladi.", points: ["Mavzu boʻyicha toʻgʻri/xato nisbati", "Oʻxshash savol bilan darhol tekshiruv", "Oxirgi natijalar grafigi"], art: <TopicsArt />, flip: false },
  ];

  return (
    <>
      {/* Hero */}
      <section className="container-page flex flex-col items-center gap-8 pt-12 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-4 pl-1.5 text-sm font-semibold text-ink-2">
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">Yangi</span> Attestatsiya · Milliy sertifikat
        </span>
        <h1 className="t-display max-w-4xl">Xatoingizni ustoz <span className="marker">ovozi</span> bilan tushuning</h1>
        <p className="max-w-2xl text-lg text-muted">Testni yeching. Har bir xato savolingizga ustozning audio tushuntirishi va yechim rasmlari keladi — Telegramdagi ovozli xabardek, lekin doskadagi yechim bilan.</p>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild variant="primary" size="lg" className="w-full sm:w-auto"><Link href="/imtihon/attestatsiya">Birinchi testni bepul yechish <ArrowRight /></Link></Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto"><Link href="#narx">Tariflarni koʻrish</Link></Button>
        </div>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-ink-2">
          {["Birinchi test bepul", "Haqiqiy imtihon formati", "Roʻyxatdan oʻtish — 1 daqiqa"].map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="size-4 text-primary" strokeWidth={3} /> {x}</li>)}
        </ul>
      </section>

      <section aria-label="Demo" className="container-page pt-12 sm:pt-16">
        <div className="mx-auto max-w-5xl text-left"><DemoCard /></div>
      </section>

      {/* Subjects */}
      <section aria-label="Fanlar" className="container-page pt-14">
        <p className="mb-4 text-center text-sm font-semibold text-muted">Tayyorlanadigan fanlar</p>
        <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
          {subjectNames.map((x) => <li key={x.name} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-2">{x.name}</li>)}
        </ul>
      </section>

      {/* Exams */}
      <section className="container-page section-y">
        <Heading center eyebrow="Yoʻnalishlar" title="Qaysi imtihonga tayyorlanyapsiz?" text="Yoʻnalishni tanlang — fanlar va demo testlar tayyor." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {exams.map(({ e, subjects }) => {
            const Icon = EXAM_ICON[e.slug] ?? HelpCircle;
            const tone = EXAM_TONE[e.slug] ?? EXAM_TONE.attestatsiya;
            return (
              <Link key={e.id} href={`/imtihon/${e.slug}`} className={cn("group flex min-h-72 flex-col justify-between gap-8 rounded-3xl p-6 transition duration-200 hover:-translate-y-1 hover:shadow-card", tone.card)}>
                <span className="flex items-start justify-between">
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl", tone.icon)}><Icon className="size-6" /></span>
                  <span className="rounded-full bg-surface/80 px-3 py-1 text-xs font-bold">{e.short}</span>
                </span>
                <span className="flex flex-col gap-2">
                  <span className="text-3xl font-bold tracking-tight">{e.name}</span>
                  <span className="text-base text-ink-2">{e.description}</span>
                </span>
                <span className="flex items-center justify-between text-sm font-bold">
                  {e.comingSoon ? <span className="rounded-full bg-accent px-3 py-1 text-ink">Tez orada</span> : <span className={tone.link}>{subjects} ta fan</span>}
                  <span className="flex size-10 items-center justify-center rounded-full bg-ink text-white transition group-hover:bg-primary"><ArrowUpRight className="size-5" /></span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features: alternating rows */}
      <section id="qanday" className="scroll-mt-24 bg-surface section-y">
        <div className="container-page flex flex-col gap-20 lg:gap-28">
          {rows.map((r) => (
            <div key={r.eyebrow} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={cn("flex flex-col gap-5", r.flip && "lg:order-2")}>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><r.icon className="size-6" /></span>
                <span className="t-eyebrow text-primary">{r.eyebrow}</span>
                <h2 className="t-h2">{r.title}</h2>
                <p className="text-base text-muted">{r.text}</p>
                <ul className="flex flex-col gap-2.5">
                  {r.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-base"><span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Check className="size-3" strokeWidth={3.5} /></span>{p}</li>)}
                </ul>
              </div>
              <div className={r.flip ? "lg:order-1" : ""}>{r.art}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="container-page section-y">
        <Heading center eyebrow="Qanday ishlaydi" title="Xatodan tushunchagacha — uch qadam" />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { t: "Testni yeching", d: "Haqiqiy imtihon formati: vaqt, savollar soni va baholash bir xil." },
            { t: "Ovozli xabarni oling", d: "Har bir xatoga ustozning audio tushuntirishi va yechim rasmlari keladi." },
            { t: "Oʻxshash savol bilan tekshiring", d: "Tushunganingizni shu yerning oʻzida oʻxshash savolda sinab koʻrasiz." },
          ].map((x, i) => (
            <li key={x.t} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-ink text-base font-bold text-white">{i + 1}</span>
              <h3 className="t-h3">{x.t}</h3>
              <p className="text-base text-muted">{x.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section id="narx" className="container-page scroll-mt-24 pb-24 lg:pb-32">
        <Heading center eyebrow="Tariflar" title="Oddiy va ochiq narxlar" text="Bitta test bilan sinab koʻring yoki oylik tarif bilan barcha fanlarga tayyorlaning." />
        <div className="mt-12"><Pricing plans={plans} /></div>
      </section>

      {/* FAQ */}
      <section id="savollar" className="scroll-mt-24 bg-surface section-y">
        <div className="container-page max-w-3xl">
          <Heading center eyebrow="Savol-javob" title="Koʻp beriladigan savollar" />
          <div className="mt-10 flex flex-col gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-bg px-5 transition open:bg-surface open:shadow-card">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-base font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="size-5 shrink-0 text-muted transition group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-base text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-base text-muted">Javob topolmadingizmi? <Link href="/aloqa" className="font-bold text-primary underline underline-offset-4">Bizga yozing</Link></p>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page section-y">
        <div className="grain flex flex-col items-center gap-6 rounded-3xl bg-primary-deep px-6 py-14 text-center text-white sm:py-20">
          <h2 className="t-h1 max-w-2xl">Keyingi imtihonga xatolaringizni tushunib kiring</h2>
          <p className="max-w-lg text-base text-white/70">Birinchi test bepul. Roʻyxatdan oʻtish bir daqiqa oladi.</p>
          <Button asChild variant="accent" size="lg"><Link href="/imtihon/attestatsiya">Bepul boshlash <ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
