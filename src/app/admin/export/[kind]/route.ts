import { desc, eq } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { isAdmin } from "@/lib/session";

const esc = (v: unknown) => {
  let t = v instanceof Date ? v.toISOString() : String(v ?? "");
  // neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
};
const csv = (head: string[], rows: unknown[][]) => "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const { kind } = await params;
  const db = await getDb();
  let body: string;
  if (kind === "users") {
    const rows = await db.select().from(s.users).orderBy(desc(s.users.createdAt));
    body = csv(["ID", "Ism", "Telefon", "Kim", "Roʻyxatdan oʻtgan"], rows.map((u) => [u.id, u.name, `+${u.phone}`, u.audience, u.createdAt]));
  } else if (kind === "orders") {
    const rows = await db
      .select({ o: s.orders, user: s.users.name, phone: s.users.phone, plan: s.plans.name })
      .from(s.orders)
      .innerJoin(s.users, eq(s.users.id, s.orders.userId))
      .innerJoin(s.plans, eq(s.plans.id, s.orders.planId))
      .orderBy(desc(s.orders.createdAt));
    body = csv(["#", "Foydalanuvchi", "Telefon", "Tarif", "Summa", "Usul", "Holat", "Yaratilgan", "Toʻlangan"], rows.map((r) => [r.o.id, r.user, `+${r.phone}`, r.plan, r.o.amountUzs, r.o.provider, r.o.status, r.o.createdAt, r.o.paidAt]));
  } else return new Response("Not found", { status: 404 });
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ovoza-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
