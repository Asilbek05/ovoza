"use client";
import * as React from "react";
import * as A from "@radix-ui/react-alert-dialog";
import { Button } from "./button";

export function Confirm({
  trigger, title, description, confirmText = "Oʻchirish", onConfirm, danger = true,
}: { trigger: React.ReactNode; title: string; description?: string; confirmText?: string; onConfirm: () => void | Promise<void>; danger?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  return (
    <A.Root open={open} onOpenChange={setOpen}>
      <A.Trigger asChild>{trigger}</A.Trigger>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px]" />
        <A.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface p-7 shadow-float">
          <A.Title className="font-display text-xl font-bold">{title}</A.Title>
          {description ? <A.Description className="mt-2 text-sm leading-relaxed text-muted">{description}</A.Description> : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <A.Cancel asChild><Button variant="outline">Bekor qilish</Button></A.Cancel>
            <Button
              variant={danger ? "danger" : "plain"}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try { await onConfirm(); setOpen(false); } finally { setBusy(false); }
              }}
            >
              {busy ? "Kuting…" : confirmText}
            </Button>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
