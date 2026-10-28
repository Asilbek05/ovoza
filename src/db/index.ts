import "server-only";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { DDL } from "./ddl";
import { seed, seedExtra } from "./seed";

export type DB = PgliteDatabase<typeof schema>;

type Holder = { promise?: Promise<DB> };
const g = globalThis as unknown as { __ovozaDb?: Holder };
const holder: Holder = (g.__ovozaDb ??= {});

async function create(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  let db: DB;
  if (url) {
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 5, prepare: false });
    await client.unsafe(DDL);
    db = drizzlePg(client, { schema }) as unknown as DB;
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const client = new PGlite(process.env.PGLITE_DIR ?? "./.pglite");
    await client.exec(DDL);
    db = drizzlePglite(client, { schema });
  }
  await seed(db);
  await seedExtra(db);
  return db;
}

export function getDb(): Promise<DB> {
  holder.promise ??= create().catch((e) => {
    holder.promise = undefined;
    throw e;
  });
  return holder.promise;
}

export { schema };
