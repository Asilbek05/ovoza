"use client";
import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ExamType } from "@/db/schema";
import { saveExamType } from "../../actions";
import { useRun } from "@/components/admin/use-run";
import { Badge, Card } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function ExamTypeCard({ et, subjects }: { et: ExamType; subjects: number }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: et.name, short: et.short, description: et.description, isActive: et.isActive, comingSoon: et.comingSoon });
  const { run, pending } = useRun();
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="t-h3">{et.name}</h2>
          <p className="text-sm font-semibold text-muted">{et.short}</p>
        </div>
        {!et.isActive ? <Badge tone="gray">Yashirin</Badge> : et.comingSoon ? <Badge tone="yellow">Tez orada</Badge> : <Badge tone="green">Faol</Badge>}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-ink-2">{et.description}</p>
      <div className="flex items-center justify-between gap-2 border-t border-line-2 pt-4">
        <Link href={`/admin/fanlar?tur=${et.slug}`} className="text-sm font-semibold text-primary hover:underline">{subjects} ta fan →</Link>
        <Button variant="soft" size="sm" onClick={() => setOpen(true)}><Pencil /> Tahrirlash</Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{et.name}</DialogTitle>
            <DialogDescription>Manzil: /imtihon/{et.slug}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nomi"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Kim uchun (qisqa)"><Input value={f.short} onChange={(e) => setF({ ...f, short: e.target.value })} /></Field>
            <Field label="Tavsif"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3 text-sm font-semibold">Saytda koʻrinadi <Switch checked={f.isActive} onCheckedChange={(v) => setF({ ...f, isActive: v })} /></label>
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3 text-sm font-semibold">«Tez orada» belgisi <Switch checked={f.comingSoon} onCheckedChange={(v) => setF({ ...f, comingSoon: v })} /></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button disabled={pending} onClick={async () => { const r = await run(() => saveExamType({ id: et.id, ...f }), "Saqlandi"); if (r.ok) setOpen(false); }}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
