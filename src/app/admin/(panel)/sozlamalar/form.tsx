"use client";
import { useState } from "react";
import { saveSettings } from "../../actions";
import { useRun } from "@/components/admin/use-run";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/input";
import { SETTING_DEFS } from "@/lib/settings-defs";

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [v, setV] = useState(initial);
  const { run, pending } = useRun();
  const dirty = SETTING_DEFS.some((d) => (v[d.key] ?? "") !== (initial[d.key] ?? ""));
  return (
    <form onSubmit={(e) => { e.preventDefault(); void run(() => saveSettings(v), "Sozlamalar saqlandi"); }} className="max-w-2xl">
      <Card className="space-y-5 p-6 sm:p-8">
        {SETTING_DEFS.map((d) => (
          <Field key={d.key} label={d.label} hint={d.hint} htmlFor={d.key}>
            <Input id={d.key} value={v[d.key] ?? ""} placeholder={d.placeholder} maxLength={300} onChange={(e) => setV({ ...v, [d.key]: e.target.value })} />
          </Field>
        ))}
        <Button type="submit" variant="primary" size="lg" disabled={pending || !dirty}>{pending ? "Saqlanmoqda…" : "Saqlash"}</Button>
      </Card>
    </form>
  );
}
