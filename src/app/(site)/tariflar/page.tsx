import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { Pricing } from "@/components/site/pricing";

export const metadata = { title: "Tariflar" };

export default async function PlansPage() {
  const db = await getDb();
  const plans = await db.select().from(s.plans).where(eq(s.plans.isActive, true)).orderBy(s.plans.sort);
  return (
    <div className="container-page pt-8 pb-10">
      <h1 className="font-serif text-[50px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[76px]">Har bir xatoingiz <em className="marker italic">ovoz bilan</em> tushuntiriladi</h1>
      <p className="mt-4 mb-10 max-w-2xl text-lg text-muted">Bitta test bilan sinab koʻring yoki oylik tarif bilan barcha fanlarga tayyorlaning.</p>
      <Pricing plans={plans} />
    </div>
  );
}
