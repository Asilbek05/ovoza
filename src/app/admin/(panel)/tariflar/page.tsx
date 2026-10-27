import { getDb, schema as s } from "@/db";
import { PageHeader } from "../shell";
import { PlansManager } from "./manager";

export const metadata = { title: "Tariflar" };

export default async function PlansPage() {
  const db = await getDb();
  const plans = await db.select().from(s.plans).orderBy(s.plans.sort, s.plans.id);
  return (
    <>
      <PageHeader title="Tariflar" description="Narxlar bozor tahlili asosida qoʻyilgan: sinov.uz da attestatsiya testi 10–50 ming soʻm (tushuntirishsiz). Istalgan vaqt oʻzgartiring." />
      <PlansManager plans={plans} />
    </>
  );
}
