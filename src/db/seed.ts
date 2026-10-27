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
      audioDurationSec: 134,
      authorName: "Kamola Rahimova",
      note: "Viyet teoremasida yigʻindi −b/a = −(−4) = +4 boʻladi. Siz ishorani almashtirmagansiz, shuning uchun −1 va −3 chiqqan.",
    })
    .returning();
  await db.insert(s.explanationImages).values([
    { explanationId: ex.id, url: "/demo/qadam-1.svg", startSec: 0, caption: "Soddalashtirish", position: 1 },
    { explanationId: ex.id, url: "/demo/qadam-2.svg", startSec: 40, caption: "Viyet teoremasi", position: 2 },
    { explanationId: ex.id, url: "/demo/qadam-3.svg", startSec: 90, caption: "Tekshiruv", position: 3 },
  ]);
  await db.insert(s.similarQuestions).values({
    questionId: q1[0].id, text: "x² − 6x + 8 = 0 tenglamaning ildizlarini toping.", options: ["2 va 4", "−2 va −4", "1 va 8", "3 va 5"], correctIndex: 0,
  });
  await db.insert(s.explanations).values({
    questionId: q1[2].id, audioUrl: "/demo/izoh-kvadrat.wav", audioDurationSec: 134, authorName: "Kamola Rahimova",
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
