import { and, eq, gte, lte } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { payOrder, revokeOrder } from "@/lib/billing";
import { paymeConfigured } from "@/lib/payments";

/**
 * Payme Merchant API (JSON-RPC). Docs: https://developer.help.paycom.uz
 * Set the endpoint in the Payme cabinet to  https://<your-domain>/api/payme
 */
export const dynamic = "force-dynamic";

const TIMEOUT = 12 * 3600 * 1000; // a created transaction may wait 12 h for performing

class RpcError extends Error {
  constructor(public code: number, public ru: string, public uz: string, public en: string, public data?: string) { super(en); }
}
const E = {
  auth: () => new RpcError(-32504, "Недостаточно привилегий", "Ruxsat yoʻq", "Insufficient privilege"),
  method: () => new RpcError(-32601, "Метод не найден", "Metod topilmadi", "Method not found"),
  amount: () => new RpcError(-31001, "Неверная сумма", "Notoʻgʻri summa", "Wrong amount"),
  noTrans: () => new RpcError(-31003, "Транзакция не найдена", "Tranzaksiya topilmadi", "Transaction not found"),
  cantPerform: () => new RpcError(-31008, "Невозможно выполнить операцию", "Amalni bajarib boʻlmaydi", "Unable to perform operation"),
  noOrder: () => new RpcError(-31050, "Заказ не найден", "Buyurtma topilmadi", "Order not found", "order_id"),
  busy: () => new RpcError(-31051, "Заказ уже оплачивается или оплачен", "Buyurtma allaqachon toʻlanmoqda yoki toʻlangan", "Order is busy or already paid", "order_id"),
  cantCancel: () => new RpcError(-31007, "Заказ выполнен, отмена невозможна", "Buyurtma bajarilgan, bekor qilib boʻlmaydi", "Order completed, cannot cancel"),
};

type Params = Record<string, unknown> & { id?: string; time?: number; amount?: number; reason?: number; from?: number; to?: number; account?: { order_id?: string | number } };

async function checkOrder(p: Params) {
  const db = await getDb();
  const id = Number(p.account?.order_id);
  if (!Number.isInteger(id) || id <= 0) throw E.noOrder();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) throw E.noOrder();
  if (o.status !== "pending") throw E.busy();
  if (typeof p.amount !== "number" || p.amount !== o.amountUzs * 100) throw E.amount();
  return o;
}

const view = (t: typeof s.paymentTransactions.$inferSelect) => ({
  create_time: t.createTime, perform_time: t.performTime, cancel_time: t.cancelTime, transaction: String(t.id), state: t.state, reason: t.reason,
});

async function handle(method: string, p: Params) {
  const db = await getDb();
  const find = async () => {
    const [t] = await db.select().from(s.paymentTransactions).where(and(eq(s.paymentTransactions.provider, "payme"), eq(s.paymentTransactions.providerTransId, String(p.id ?? ""))));
    return t;
  };
  switch (method) {
    case "CheckPerformTransaction": {
      await checkOrder(p);
      return { allow: true };
    }
    case "CreateTransaction": {
      let t = await find();
      if (t) {
        if (t.state !== 1) throw E.cantPerform();
        if (Date.now() - t.createTime > TIMEOUT) {
          await db.update(s.paymentTransactions).set({ state: -1, reason: 4, cancelTime: Date.now() }).where(eq(s.paymentTransactions.id, t.id));
          throw E.cantPerform();
        }
        return { create_time: t.createTime, transaction: String(t.id), state: t.state };
      }
      const o = await checkOrder(p);
      // one live transaction per order
      const [other] = await db.select().from(s.paymentTransactions).where(and(eq(s.paymentTransactions.orderId, o.id), eq(s.paymentTransactions.state, 1)));
      if (other) throw E.busy();
      const now = Date.now();
      [t] = await db.insert(s.paymentTransactions).values({ provider: "payme", providerTransId: String(p.id), orderId: o.id, amountUzs: o.amountUzs, state: 1, createTime: now }).returning();
      return { create_time: t.createTime, transaction: String(t.id), state: 1 };
    }
    case "PerformTransaction": {
      const t = await find();
      if (!t) throw E.noTrans();
      if (t.state === 2) return { transaction: String(t.id), perform_time: t.performTime, state: 2 };
      if (t.state !== 1) throw E.cantPerform();
      if (Date.now() - t.createTime > TIMEOUT) {
        await db.update(s.paymentTransactions).set({ state: -1, reason: 4, cancelTime: Date.now() }).where(eq(s.paymentTransactions.id, t.id));
        throw E.cantPerform();
      }
      const r = await payOrder(t.orderId, "payme");
      if (!r.ok) throw E.cantPerform();
      const now = Date.now();
      await db.update(s.paymentTransactions).set({ state: 2, performTime: now }).where(eq(s.paymentTransactions.id, t.id));
      return { transaction: String(t.id), perform_time: now, state: 2 };
    }
    case "CancelTransaction": {
      const t = await find();
      if (!t) throw E.noTrans();
      if (t.state === -1 || t.state === -2) return { transaction: String(t.id), cancel_time: t.cancelTime, state: t.state };
      const now = Date.now();
      const reason = typeof p.reason === "number" ? p.reason : null;
      if (t.state === 2) {
        await revokeOrder(t.orderId);
        await db.update(s.paymentTransactions).set({ state: -2, reason, cancelTime: now }).where(eq(s.paymentTransactions.id, t.id));
        return { transaction: String(t.id), cancel_time: now, state: -2 };
      }
      await db.update(s.paymentTransactions).set({ state: -1, reason, cancelTime: now }).where(eq(s.paymentTransactions.id, t.id));
      return { transaction: String(t.id), cancel_time: now, state: -1 };
    }
    case "CheckTransaction": {
      const t = await find();
      if (!t) throw E.noTrans();
      return view(t);
    }
    case "GetStatement": {
      const rows = await db
        .select()
        .from(s.paymentTransactions)
        .where(and(eq(s.paymentTransactions.provider, "payme"), gte(s.paymentTransactions.createTime, Number(p.from ?? 0)), lte(s.paymentTransactions.createTime, Number(p.to ?? Date.now()))));
      return { transactions: rows.map((t) => ({ id: t.providerTransId, time: t.createTime, amount: t.amountUzs * 100, account: { order_id: String(t.orderId) }, ...view(t) })) };
    }
    default:
      throw E.method();
  }
}

export async function POST(req: Request) {
  let id: unknown = null;
  try {
    if (!paymeConfigured()) throw E.auth();
    const auth = req.headers.get("authorization") ?? "";
    const expected = "Basic " + Buffer.from(`Paycom:${process.env.PAYME_KEY}`).toString("base64");
    if (auth !== expected) throw E.auth();
    const body = (await req.json()) as { id?: unknown; method?: string; params?: Params };
    id = body.id ?? null;
    const result = await handle(String(body.method ?? ""), body.params ?? {});
    return Response.json({ result, id });
  } catch (e) {
    if (e instanceof RpcError) return Response.json({ error: { code: e.code, message: { ru: e.ru, uz: e.uz, en: e.en }, data: e.data }, id });
    console.error("payme error", e);
    return Response.json({ error: { code: -32400, message: { ru: "Системная ошибка", uz: "Tizim xatosi", en: "Internal error" } }, id });
  }
}
