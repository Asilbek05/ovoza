import { desc, eq } from "drizzle-orm";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "../shell";
import { Badge, Card, EmptyState, Table, Td, Th } from "@/components/ui/misc";
import { formatPrice } from "@/lib/utils";
import { OrderActions } from "./client";

export const metadata = { title: "Toʻlovlar" };

export default async function OrdersPage() {
  const db = await getDb();
  const rows = await db
    .select({ o: s.orders, user: s.users.name, phone: s.users.phone, plan: s.plans.name })
    .from(s.orders)
    .innerJoin(s.users, eq(s.users.id, s.orders.userId))
    .innerJoin(s.plans, eq(s.plans.id, s.orders.planId))
    .orderBy(desc(s.orders.createdAt))
    .limit(300);
  const paid = rows.filter((r) => r.o.status === "paid");
  const revenue = paid.reduce((n, r) => n + r.o.amountUzs, 0);
  const pending = rows.filter((r) => r.o.status === "pending");
  return (
    <>
      <PageHeader
        title="Toʻlovlar"
        description="Click va Payme ulanmaguncha buyurtmalar «kutilmoqda» holatida tushadi. Pul kelganini tekshirib, «Toʻlandi» ni bosing — obuna avtomatik ochiladi."
        actions={<Button asChild variant="outline"><a href="/admin/export/orders" download><Download /> CSV</a></Button>}
      />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card className="p-5"><span className="block text-sm font-semibold text-muted">Tushum</span><span className="mt-1 block font-display text-2xl font-bold sm:text-3xl">{formatPrice(revenue)}</span></Card>
        <Card className="p-5"><span className="block text-sm font-semibold text-muted">Toʻlangan</span><span className="mt-1 block font-display text-2xl font-bold sm:text-3xl">{paid.length}</span></Card>
        <Card className={`p-5 ${pending.length ? "border-accent bg-accent-soft" : ""}`}><span className="block text-sm font-semibold text-muted">Kutilmoqda</span><span className="mt-1 block font-display text-2xl font-bold sm:text-3xl">{pending.length}</span></Card>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<CreditCard className="size-6" />} title="Hali buyurtma yoʻq" text="Foydalanuvchi tarif tanlaganda shu yerda paydo boʻladi." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead><tr><Th>#</Th><Th>Foydalanuvchi</Th><Th>Tarif</Th><Th className="text-right">Summa</Th><Th>Usul</Th><Th>Holat</Th><Th>Sana</Th><Th className="text-right">Amal</Th></tr></thead>
            <tbody>
              {rows.map(({ o, user, phone, plan }) => (
                <tr key={o.id}>
                  <Td className="text-muted tabular-nums">{o.id}</Td>
                  <Td><span className="block font-semibold">{user}</span><span className="block text-xs text-muted tabular-nums">+{phone}</span></Td>
                  <Td>{plan}</Td>
                  <Td className="text-right font-semibold whitespace-nowrap">{formatPrice(o.amountUzs)}</Td>
                  <Td className="capitalize">{o.provider}</Td>
                  <Td><Badge tone={o.status === "paid" ? "green" : o.status === "failed" ? "red" : "yellow"}>{o.status === "paid" ? "toʻlangan" : o.status === "failed" ? "bekor" : "kutilmoqda"}</Badge></Td>
                  <Td className="whitespace-nowrap text-sm text-muted">{o.createdAt.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</Td>
                  <Td className="text-right">{o.status === "pending" ? <OrderActions id={o.id} /> : null}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
