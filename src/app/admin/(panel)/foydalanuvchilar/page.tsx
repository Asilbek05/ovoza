import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "../shell";
import { Card, EmptyState, Table, Td, Th, Badge } from "@/components/ui/misc";
import { UserActions, SearchBox } from "./client";

const like = (v: string) => v.replace(/[\\%_]/g, "\\$&");

export const metadata = { title: "Foydalanuvchilar" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const db = await getDb();
  const users = await db
    .select({
      u: s.users,
      attempts: sql<number>`(select count(*)::int from attempts a where a.user_id = "users"."id")`,
      sub: sql<string | null>`(select p.name from subscriptions x join plans p on p.id = x.plan_id where x.user_id = "users"."id" and x.status = 'active' and (x.ends_at is null or x.ends_at > now()) order by x.starts_at desc limit 1)`,
      subEnds: sql<string | null>`(select x.ends_at::text from subscriptions x where x.user_id = "users"."id" and x.status = 'active' and (x.ends_at is null or x.ends_at > now()) order by x.starts_at desc limit 1)`,
    })
    .from(s.users)
    .where(q ? or(ilike(s.users.name, `%${like(q)}%`), ilike(s.users.phone, `%${like(q.replace(/\D/g, "") || q)}%`)) : undefined)
    .orderBy(desc(s.users.createdAt))
    .limit(200);
  const plans = await db.select().from(s.plans).where(eq(s.plans.isActive, true)).orderBy(s.plans.sort);
  return (
    <>
      <PageHeader title="Foydalanuvchilar" description="Obunani qoʻlda berish — masalan, naqd yoki bank orqali toʻlaganlarga." actions={<Button asChild variant="outline"><a href="/admin/export/users" download><Download /> CSV</a></Button>} />
      <SearchBox initial={q ?? ""} />
      {users.length === 0 ? (
        <EmptyState icon={<Users className="size-6" />} title={q ? "Hech kim topilmadi" : "Hali foydalanuvchi yoʻq"} text={q ? "Boshqa ism yoki raqam bilan qidiring." : "Saytda roʻyxatdan oʻtganlar shu yerda chiqadi."} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead><tr><Th>Ism</Th><Th>Telefon</Th><Th>Kim</Th><Th className="text-center">Urinishlar</Th><Th>Obuna</Th><Th className="text-right">Amal</Th></tr></thead>
            <tbody>
              {users.map(({ u, attempts, sub, subEnds }) => (
                <tr key={u.id}>
                  <Td className="font-semibold">{u.name}</Td>
                  <Td className="whitespace-nowrap tabular-nums">+{u.phone}</Td>
                  <Td>{u.audience === "applicant" ? "Abituriyent" : "Oʻqituvchi"}</Td>
                  <Td className="text-center">{attempts}</Td>
                  <Td>{sub ? <span className="flex flex-col gap-1"><Badge tone="green" className="self-start">{sub}</Badge>{subEnds ? <span className="text-[12px] text-muted">{new Date(subEnds).toLocaleDateString("uz-UZ")} gacha</span> : null}</span> : <span className="text-muted">—</span>}</Td>
                  <Td className="text-right"><UserActions userId={u.id} name={u.name} hasSub={!!sub} plans={plans.filter((p) => p.priceUzs > 0)} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
