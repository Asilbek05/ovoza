"use client";
import { setOrderStatus } from "../../actions";
import { useRun } from "@/components/admin/use-run";
import { Button } from "@/components/ui/button";

export function OrderActions({ id }: { id: number }) {
  const { run, pending } = useRun();
  return (
    <span className="inline-flex gap-1">
      <Button size="sm" variant="success" disabled={pending} onClick={() => run(() => setOrderStatus(id, "paid"), "Toʻlov tasdiqlandi, obuna ochildi")}>Toʻlandi</Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setOrderStatus(id, "failed"), "Buyurtma bekor qilindi")}>Bekor</Button>
    </span>
  );
}
