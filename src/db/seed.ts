import { sql } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as s from "./schema";

type DB = PgliteDatabase<typeof s>;

const COLORS = ["blue", "yellow", "green", "violet", "teal", "coral"] as const;

const ATTESTATSIYA = [
  "Matematika", "Ona tili va adabiyot", "Ingliz tili", "Rus tili", "Tarix", "Fizika",
  "Kimyo", "Biologiya", "Geografiya", "Informatika", "Boshlangʻich taʼlim",
];
const MILLIY = [
  "Matematika", "Ona tili va adabiyot", "Tarix", "Fizika", "Kimyo", "Biologiya",
  "Geografiya", "Rus tili", "Informatika",
];

const SLUGS: Record<string, string> = {
  "Matematika": "matematika",
  "Ona tili va adabiyot": "ona-tili",
  "Ingliz tili": "ingliz-tili",
  "Rus tili": "rus-tili",
  "Tarix": "tarix",
  "Fizika": "fizika",
  "Kimyo": "kimyo",
  "Biologiya": "biologiya",
  "Geografiya": "geografiya",
  "Informatika": "informatika",
  "Boshlangʻich taʼlim": "boshlangich-talim",
};

export async function seed(db: DB) {
  const existing = await db.select({ n: sql<number>`count(*)::int` }).from(s.examTypes);
  if ((existing[0]?.n ?? 0) > 0) return;

  const [att, mil] = await db
    .insert(s.examTypes)
    .values([
      {
        slug: "attestatsiya", name: "Attestatsiya", short: "Oʻqituvchilar", audience: "teacher", sort: 1,
        description: "Toifa uchun attestatsiya testlarining toʻliq demo variantlari.",
      },
      {
        slug: "milliy-sertifikat", name: "Milliy sertifikat", short: "Oʻqituvchilar va abituriyentlar", audience: "both", sort: 2,
        description: "Fan boʻyicha milliy sertifikat imtihoni formatidagi demo testlar.",
      },
      {
        slug: "dtm", name: "DTM testlari", short: "Abituriyentlar", audience: "applicant", sort: 3, comingSoon: true,
        description: "Oliy taʼlimga kirish testlari formatidagi demo variantlar. Tez orada.",
      },
    ])
    .returning();

  const subjRows = [
    ...ATTESTATSIYA.map((name, i) => ({ examTypeId: att.id, name, slug: SLUGS[name], color: COLORS[i % COLORS.length], sort: i + 1 })),
    ...MILLIY.map((name, i) => ({ examTypeId: mil.id, name, slug: SLUGS[name], color: COLORS[i % COLORS.length], sort: i + 1 })),
  ];
  const insertedSubjects = await db.insert(s.subjects).values(subjRows).returning();
  const attMath = insertedSubjects.find((x) => x.examTypeId === att.id && x.slug === "matematika")!;
  const milMath = insertedSubjects.find((x) => x.examTypeId === mil.id && x.slug === "matematika")!;

  // Demo test 1 — free, with a full explanation
  const [t1] = await db
    .insert(s.tests)
    .values({
      subjectId: attMath.id, title: "Matematika · demo №1", isFree: true, isPublished: true, durationMin: 15, sort: 1,
      description: "Attestatsiya formatidagi qisqa demo test. Xatolaringizga ovozli tushuntirish beriladi.",
    })
    .returning();
  const q1 = await db
    .insert(s.questions)
    .values([
      { testId: t1.id, position: 1, text: "Tenglamaning ildizlarini toping: 2x² − 8x + 6 = 0", options: ["1 va 3", "2 va 3", "−1 va −3", "1 va 6"], correctIndex: 0, topic: "Kvadrat tenglamalar" },
      { testId: t1.id, position: 2, text: "Arifmetik progressiyada a₁ = 3, d = 4. a₁₀ ni toping.", options: ["43", "39", "36", "40"], correctIndex: 1, topic: "Progressiyalar" },
      { testId: t1.id, position: 3, text: "Toʻgʻri burchakli uchburchakning katetlari 6 va 8 ga teng. Gipotenuzani toping.", options: ["12", "14", "10", "9"], correctIndex: 2, topic: "Geometriya" },
      { testId: t1.id, position: 4, text: "240 ning 15 foizini toping.", options: ["24", "32", "40", "36"], correctIndex: 3, topic: "Foizlar" },
      { testId: t1.id, position: 5, text: "log₂ 32 ning qiymatini toping.", options: ["5", "4", "6", "16"], correctIndex: 0, topic: "Logarifmlar" },
    ])
    .returning();

  const [ex] = await db
    .insert(s.explanations)
    .values({
      questionId: q1[0].id,
      audioUrl: "/demo/izoh-kvadrat.wav",
      audioDurationSec: 69.1,
      authorName: "Kamola Rahimova",
      note: "Viyet teoremasida yigʻindi −b/a = −(−4) = +4 boʻladi. Siz ishorani almashtirmagansiz, shuning uchun −1 va −3 chiqqan.",
    })
    .returning();
  await db.insert(s.explanationImages).values([
    { explanationId: ex.id, url: "/demo/qadam-1.svg", startSec: 0, caption: "Soddalashtirish", position: 1 },
    { explanationId: ex.id, url: "/demo/qadam-2.svg", startSec: 22, caption: "Viyet teoremasi", position: 2 },
    { explanationId: ex.id, url: "/demo/qadam-3.svg", startSec: 51, caption: "Tekshiruv", position: 3 },
  ]);
  await db.insert(s.similarQuestions).values({
    questionId: q1[0].id, text: "x² − 6x + 8 = 0 tenglamaning ildizlarini toping.", options: ["2 va 4", "−2 va −4", "1 va 8", "3 va 5"], correctIndex: 0,
  });
  await db.insert(s.explanations).values({
    questionId: q1[2].id, audioUrl: "/demo/izoh-kvadrat.wav", audioDurationSec: 69.1, authorName: "Kamola Rahimova",
    note: "Pifagor teoremasi: c² = a² + b² = 36 + 64 = 100, demak c = 10. Tez yoʻl: 6–8–10 — bu 3–4–5 uchligining ikki barobari.",
  });

  // Demo test 2 — paid
  const [t2] = await db
    .insert(s.tests)
    .values({ subjectId: attMath.id, title: "Matematika · toʻliq variant №1", isPublished: true, durationMin: 90, sort: 2, description: "Toʻliq attestatsiya varianti." })
    .returning();
  await db.insert(s.questions).values([
    { testId: t2.id, position: 1, text: "3x − 7 = 11 tenglamani yeching.", options: ["4", "6", "5", "7"], correctIndex: 1, topic: "Chiziqli tenglamalar" },
    { testId: t2.id, position: 2, text: "√144 + √81 ni hisoblang.", options: ["21", "25", "19", "23"], correctIndex: 0, topic: "Ildizlar" },
    { testId: t2.id, position: 3, text: "Radiusi 5 ga teng doiraning yuzini toping.", options: ["10π", "25π", "5π", "50π"], correctIndex: 1, topic: "Geometriya" },
  ]);

  // Milliy sertifikat demo
  const [t3] = await db
    .insert(s.tests)
    .values({ subjectId: milMath.id, title: "Matematika · sertifikat demo", isFree: true, isPublished: true, durationMin: 10, sort: 1, description: "Milliy sertifikat formatidagi qisqa demo." })
    .returning();
  await db.insert(s.questions).values([
    { testId: t3.id, position: 1, text: "Agar 2ˣ = 16 boʻlsa, x ni toping.", options: ["3", "4", "8", "2"], correctIndex: 1, topic: "Koʻrsatkichli tenglamalar" },
    { testId: t3.id, position: 2, text: "sin 30° ning qiymati nechaga teng?", options: ["1/2", "√3/2", "1", "√2/2"], correctIndex: 0, topic: "Trigonometriya" },
    { testId: t3.id, position: 3, text: "Kubning qirrasi 3 ga teng. Hajmini toping.", options: ["9", "18", "27", "36"], correctIndex: 2, topic: "Stereometriya" },
  ]);

  await db.insert(s.plans).values([
    { code: "free", name: "Bepul", audience: "all", priceUzs: 0, features: ["1 ta demo test", "3 ta xato tushuntirishi"], sort: 0 },
    { code: "teacher-single", name: "Bitta test", audience: "teacher", priceUzs: 25000, testsLimit: 1, features: ["1 ta toʻliq test", "Barcha xatolar ovozli tahlili", "Oʻxshash savollar"], sort: 1 },
    { code: "teacher-month", name: "Oylik", audience: "teacher", priceUzs: 89000, periodDays: 30, isHighlighted: true, priceNote: "/ oy", features: ["Barcha fanlar va testlar", "Har bir xatoga audio + rasmlar", "Oʻxshash savollar", "Mavzular xaritasi"], sort: 2 },
    { code: "teacher-3m", name: "Imtihongacha · 3 oy", audience: "teacher", priceUzs: 219000, periodDays: 90, priceNote: "~18% arzon", features: ["Oylik tarifdagi hamma narsa", "3 oy uzluksiz tayyorgarlik"], sort: 3 },
    { code: "applicant-single", name: "Bitta test", audience: "applicant", priceUzs: 15000, testsLimit: 1, features: ["1 ta toʻliq test", "Barcha xatolar ovozli tahlili"], sort: 4 },
    { code: "applicant-month", name: "Oylik", audience: "applicant", priceUzs: 49000, periodDays: 30, isHighlighted: true, priceNote: "/ oy", features: ["Barcha milliy sertifikat testlari", "Har bir xatoga audio + rasmlar", "Oʻxshash savollar"], sort: 5 },
    { code: "applicant-3m", name: "3 oy", audience: "applicant", priceUzs: 119000, periodDays: 90, features: ["Oylik tarifdagi hamma narsa", "DTM testlari chiqqanda — ular ham"], sort: 6 },
    { code: "school", name: "Maktab", audience: "school", priceUzs: 59000, periodDays: 30, priceNote: "/ oʻqituvchi / oy", features: ["Kamida 10 ta oʻqituvchi", "Jamoa natijalari hisoboti", "Barcha fanlar"], sort: 7 },
  ]);
}

/** Extra demo tests. Runs once per database (guarded by a settings flag), also on databases created before it existed. */
export async function seedExtra(db: DB) {
  const [done] = await db.select().from(s.settings).where(sql`${s.settings.key} = 'seed_v2'`);
  if (done) return;
  const find = async (exam: string, subject: string) => {
    const rows = await db
      .select({ id: s.subjects.id })
      .from(s.subjects)
      .innerJoin(s.examTypes, sql`${s.examTypes.id} = ${s.subjects.examTypeId}`)
      .where(sql`${s.examTypes.slug} = ${exam} and ${s.subjects.slug} = ${subject}`);
    return rows[0]?.id;
  };
  type Q = [string, string[], number, string];
  const make = async (subjectId: number | undefined, title: string, description: string, durationMin: number, qs: Q[]) => {
    if (!subjectId) return;
    const [t] = await db.insert(s.tests).values({ subjectId, title, description, durationMin, isFree: true, isPublished: true, sort: 1 }).returning();
    await db.insert(s.questions).values(qs.map(([text, options, correctIndex, topic], i) => ({ testId: t.id, position: i + 1, text, options, correctIndex, topic })));
  };

  await make(await find("attestatsiya", "fizika"), "Fizika · demo №1", "Mexanika, elektr va optikadan qisqa demo test.", 10, [
    ["Jism 10 m/s tezlik bilan 5 s davomida tekis harakatlandi. U qancha yoʻl bosdi?", ["2 m", "15 m", "50 m", "5 m"], 2, "Kinematika"],
    ["Nyutonning ikkinchi qonuni formulasi qaysi?", ["F = m / a", "F = m · a", "F = m + a", "F = a / m"], 1, "Dinamika"],
    ["Suv normal atmosfera bosimida necha °C da qaynaydi?", ["100 °C", "90 °C", "120 °C", "0 °C"], 0, "Issiqlik hodisalari"],
    ["Zanjir uchastkasida kuchlanish 12 V, qarshilik 4 Ω. Tok kuchini toping.", ["48 A", "8 A", "3 A", "0,33 A"], 2, "Elektr toki"],
    ["Yorugʻlikning vakuumdagi tezligi taxminan qancha?", ["3·10⁶ m/s", "3·10⁸ m/s", "3·10⁵ m/s", "3·10¹⁰ m/s"], 1, "Optika"],
    ["Massasi 2 kg boʻlgan jism 3 m/s tezlik bilan harakatlanmoqda. Uning kinetik energiyasi qancha?", ["6 J", "9 J", "18 J", "3 J"], 1, "Energiya"],
  ]);
  await make(await find("attestatsiya", "ingliz-tili"), "Ingliz tili · demo №1", "Grammatika: zamonlar, sifat darajalari, shart gaplar.", 10, [
    ["She ___ to school every day.", ["go", "goes", "going", "gone"], 1, "Present Simple"],
    ["I have lived here ___ 2015.", ["since", "for", "from", "during"], 0, "Present Perfect"],
    ["Choose the past form of “write”.", ["wrote", "writed", "written", "writes"], 0, "Irregular verbs"],
    ["If it rains tomorrow, we ___ at home.", ["will stay", "would stay", "stayed", "stay"], 0, "Conditionals"],
    ["He is ___ than his brother.", ["tall", "taller", "tallest", "more tall"], 1, "Comparatives"],
  ]);
  await make(await find("milliy-sertifikat", "informatika"), "Informatika · demo №1", "Axborot oʻlchov birliklari, sanoq sistemalari va asosiy tushunchalar.", 8, [
    ["1 bayt necha bitga teng?", ["4", "8", "16", "10"], 1, "Axborot birliklari"],
    ["Ikkilik sanoq sistemasidagi 101 sonining oʻnlik koʻrinishi qaysi?", ["3", "4", "5", "6"], 2, "Sanoq sistemalari"],
    ["Kompyuterdagi CPU qisqartmasi nimani anglatadi?", ["Operativ xotira", "Markaziy protsessor", "Videokarta", "Qattiq disk"], 1, "Kompyuter qurilmalari"],
    ["1 kilobayt necha baytga teng?", ["1000", "1024", "512", "2048"], 1, "Axborot birliklari"],
    ["HTML nima?", ["Veb-sahifalarni belgilash tili", "Maʼlumotlar bazasi", "Operatsion tizim", "Brauzer"], 0, "Internet"],
  ]);
  await db.insert(s.settings).values({ key: "seed_v2", value: "1" });
}

/** The demo audio used to be silence; this aligns older databases with the spoken version (runs once). */
export async function seedDemoAudio(db: DB) {
  const [done] = await db.select().from(s.settings).where(sql`${s.settings.key} = 'seed_v3'`);
  if (done) return;
  await db.update(s.explanations).set({ audioDurationSec: 69.1 }).where(sql`${s.explanations.audioUrl} = '/demo/izoh-kvadrat.wav'`);
  await db.update(s.explanationImages).set({ startSec: 22 }).where(sql`${s.explanationImages.url} = '/demo/qadam-2.svg' and ${s.explanationImages.startSec} = 40`);
  await db.update(s.explanationImages).set({ startSec: 51 }).where(sql`${s.explanationImages.url} = '/demo/qadam-3.svg' and ${s.explanationImages.startSec} = 90`);
  await db.insert(s.settings).values({ key: "seed_v3", value: "1" });
}
