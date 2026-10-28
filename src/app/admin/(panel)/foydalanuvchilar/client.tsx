"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gift, KeyRound, Search } from "lucide-react";
import { toast } from "sonner";
import type { Plan } from "@/db/schema";
import { cancelSubscriptions, grantSubscription, resetUserPassword } from "../../actions";
import { useRun } from "@/components/admin/use-run";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Field } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Confirm } from "@/components/ui/confirm";
import { formatPrice } from "@/lib/utils";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  return (
    <form className="relative mb-5 max-w-md" onSubmit={(e) => { e.preventDefault(); router.push(`/admin/foydalanuvchilar${v ? `?q=${encodeURIComponent(v)}` : ""}`); }}>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
      <Input className="pl-11" value={v} onChange={(e) => setV(e.target.value)} placeholder="Ism yoki telefon raqami" aria-label="Qidiruv" />
    </form>
  );
}

export function UserActions({ userId, name, hasSub, plans }: { userId: string; name: string; hasSub: boolean; plans: Plan[] }) {
  const [open, setOpen] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [planId, setPlanId] = useState(plans.find((p) => p.isHighlighted)?.id ?? plans[0]?.id);
  const { run, pending } = useRun();
  return (
    <span className="inline-flex gap-1">
      <Button variant="soft" size="sm" onClick={() => setOpen(true)}><Gift /> Obuna berish</Button>
      <Confirm
        title="Yangi parol berilsinmi?"
        description={`${name} uchun vaqtinchalik parol yaratiladi va eskisi ishlamay qoladi. Parolni foydalanuvchiga oʻzingiz yetkazasiz.`}
        confirmText="Parol yaratish"
        danger={false}
        onConfirm={async () => {
          const r = await resetUserPassword(userId);
          if (r.ok && r.data) setTempPw(r.data.password);
          else toast.error(r.ok ? "Xato" : r.error);
        }}
        trigger={<Button variant="ghost" size="sm"><KeyRound /> Parol</Button>}
      />
      <Dialog open={!!tempPw} onOpenChange={(o) => !o && setTempPw(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vaqtinchalik parol</DialogTitle><DialogDescription>{name} shu parol bilan kirib, kabinetdan oʻzgartirishi mumkin. Bu oyna yopilgach parol qayta koʻrsatilmaydi.</DialogDescription></DialogHeader>
          <p className="rounded-2xl bg-bg px-5 py-4 text-center font-mono text-3xl font-bold tracking-widest select-all">{tempPw}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(tempPw ?? ""); toast.success("Nusxalandi"); }}>Nusxalash</Button>
            <Button onClick={() => setTempPw(null)}>Tayyor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {hasSub ? <Confirm title="Obunani bekor qilasizmi?" description={`${name} ning faol obunasi toʻxtatiladi.`} confirmText="Bekor qilish" onConfirm={async () => { await run(() => cancelSubscriptions(userId), "Obuna bekor qilindi"); }} trigger={<Button variant="ghost" size="sm" className="text-danger-ink">Toʻxtatish</Button>} /> : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Obuna berish</DialogTitle><DialogDescription>{name}</DialogDescription></DialogHeader>
          <Field label="Tarif"><NativeSelect value={planId} onChange={(e) => setPlanId(Number(e.target.value))}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.audience === "teacher" ? "oʻqituvchi" : p.audience === "applicant" ? "abituriyent" : p.audience} · {formatPrice(p.priceUzs)}</option>)}</NativeSelect></Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button disabled={pending || !planId} onClick={async () => { const r = await run(() => grantSubscription(userId, planId!), "Obuna faollashtirildi"); if (r.ok) setOpen(false); }}>Faollashtirish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </span>
  );
}
