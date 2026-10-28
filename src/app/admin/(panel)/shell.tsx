"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, CreditCard, FileStack, GraduationCap, LayoutDashboard, LogOut, Menu, Tags, Users, ExternalLink, MessageSquareWarning, Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { adminLogout } from "../actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Umumiy", icon: LayoutDashboard },
  { href: "/admin/imtihonlar", label: "Imtihon turlari", icon: GraduationCap },
  { href: "/admin/fanlar", label: "Fanlar", icon: BookOpen },
  { href: "/admin/testlar", label: "Testlar va savollar", icon: FileStack },
  { href: "/admin/tariflar", label: "Tariflar", icon: Tags },
  { href: "/admin/foydalanuvchilar", label: "Foydalanuvchilar", icon: Users },
  { href: "/admin/tolovlar", label: "Toʻlovlar", icon: CreditCard },
  { href: "/admin/fikrlar", label: "Tushunmadim", icon: MessageSquareWarning },
  { href: "/admin/sozlamalar", label: "Sozlamalar", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin menyusi" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href) || (href === "/admin/testlar" && path.startsWith("/admin/savollar"));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition",
              active ? "bg-primary text-white" : "text-ink-2 hover:bg-primary-soft hover:text-primary-deep",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
        <Link href="/" target="_blank" className="flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-ink-2 hover:bg-primary-soft">
          <ExternalLink className="size-5" /> Saytni ochish
        </Link>
        <form action={adminLogout}>
          <button className="flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-danger-ink hover:bg-danger-soft">
            <LogOut className="size-5" /> Chiqish
          </button>
        </form>
      </div>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="px-2"><Logo href="/admin" suffix="admin" /></div>
        <NavList />
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo href="/admin" suffix="admin" />
        <button onClick={() => setOpen(true)} aria-label="Menyuni ochish" className="flex size-11 items-center justify-center rounded-full border border-line">
          <Menu className="size-5" />
        </button>
      </header>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent side="right" className="max-w-xs gap-6">
          <DialogTitle className="sr-only">Menyu</DialogTitle>
          <Logo href="/admin" suffix="admin" />
          <NavList onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">← {back.label}</Link>
        ) : null}
        <h1 className="t-h1">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
