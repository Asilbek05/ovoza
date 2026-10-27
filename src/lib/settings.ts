import "server-only";
import { getDb, schema as s } from "@/db";

import { SETTING_DEFS, type SettingKey } from "./settings-defs";

export { SETTING_DEFS };
export type { SettingKey };

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const db = await getDb();
  const rows = await db.select().from(s.settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(SETTING_DEFS.map((d) => [d.key, map.get(d.key) ?? ""])) as Record<SettingKey, string>;
}
