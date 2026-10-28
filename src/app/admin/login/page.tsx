import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./form";

export const metadata = { title: "Admin" };

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo suffix="admin" /></div>
        <div className="rounded-[24px] border border-line bg-surface p-7 shadow-float">
          <h1 className="font-display text-2xl font-bold">Boshqaruv paneli</h1>
          <p className="mt-1.5 mb-6 text-[15px] text-muted">Davom etish uchun admin parolini kiriting.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
