import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4010").replace(/\/$/, "");
  const db = await getDb();
  const exams = await db.select().from(s.examTypes).where(eq(s.examTypes.isActive, true));
  const subjects = await db.select().from(s.subjects).where(eq(s.subjects.isActive, true));
  const tests = await db.select({ id: s.tests.id }).from(s.tests).where(eq(s.tests.isPublished, true));
  const slugOf = new Map(exams.map((e) => [e.id, e.slug]));
  return [
    { url: base, priority: 1 },
    { url: `${base}/tariflar`, priority: 0.8 },
    { url: `${base}/aloqa` },
    { url: `${base}/oferta` },
    { url: `${base}/maxfiylik` },
    ...exams.map((e) => ({ url: `${base}/imtihon/${e.slug}`, priority: 0.9 })),
    ...subjects.filter((x) => slugOf.has(x.examTypeId)).map((x) => ({ url: `${base}/imtihon/${slugOf.get(x.examTypeId)}/${x.slug}`, priority: 0.7 })),
    ...tests.map((t) => ({ url: `${base}/test/${t.id}`, priority: 0.6 })),
  ];
}
