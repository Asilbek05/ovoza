import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { aiAvailable } from "@/lib/ai-import";
import { PageHeader } from "../../../shell";
import { Importer } from "./importer";

export const metadata = { title: "Import" };

export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const db = await getDb();
  const [test] = await db.select().from(s.tests).where(eq(s.tests.id, id));
  if (!test) notFound();
  return (
    <>
      <PageHeader
        title="Savollarni import qilish"
        description={`«${test.title}» testiga. Word, PDF, matn yoki JSON — AI savol, variant va toʻgʻri javobni ajratib beradi, siz tekshirib saqlaysiz.`}
        back={{ href: `/admin/testlar/${id}`, label: test.title }}
      />
      <Importer testId={id} ai={aiAvailable()} />
    </>
  );
}
