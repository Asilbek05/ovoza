import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { Pricing } from "@/components/site/pricing";

export const metadata = { title: "Tariflar" };

export default async function PlansPage() {
  const db = await getDb();
  const plans = await db.select().from(s.plans).where(eq(s.plans.isActive, true)).orderBy(s.plans.sort);
  return (
    <div className="container-page pt-8 pb-10">
      <h1 className="font-display text-[40px] leading-tight font-extrabold sm:text-6xl">Har bir xatoingiz <span className="text-primary">ovoz bilan</span> tushuntiriladi</h1>
      <p className="mt-4 mb-10 max-w-2xl text-lg text-muted">Bitta test bilan sinab koʻring yoki oylik tarif bilan barcha fanlarga tayyorlaning.</p>
      <Pricing plans={plans} />
    </div>
  );
}
