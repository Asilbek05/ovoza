"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export function MobileMenu({ links, loggedIn }: { links: { href: string; label: string; soon: boolean }[]; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Menyu" className="flex size-10 items-center justify-center rounded-xl text-ink hover:bg-bg lg:hidden">
        <Menu className="size-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent side="right" className="max-w-sm gap-6">
          <DialogTitle className="sr-only">Menyu</DialogTitle>
          <Logo />
          <nav className="flex flex-col gap-1" aria-label="Mobil menyu">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex h-14 items-center justify-between rounded-2xl px-4 font-display text-xl font-bold hover:bg-primary-soft">
                {l.label}
                {l.soon ? <span className="rounded-full bg-accent px-2 py-0.5 font-sans text-xs font-bold">tez orada</span> : null}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            {loggedIn ? (
              <Button asChild size="lg" variant="plain" onClick={() => setOpen(false)}><Link href="/kabinet">Kabinet</Link></Button>
            ) : (
              <>
                <Button asChild size="lg" variant="plain" onClick={() => setOpen(false)}><Link href="/imtihon/attestatsiya">Bepul boshlash</Link></Button>
                <Button asChild size="lg" variant="outline" onClick={() => setOpen(false)}><Link href="/kirish">Kirish</Link></Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
