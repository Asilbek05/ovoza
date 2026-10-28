import Link from "next/link";
import { ResetForm } from "./form";

export const metadata = { title: "Parolni tiklash" };

export default function ResetPage() {
  return (
    <div className="container-page flex justify-center pt-6 pb-10 sm:pt-12">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-surface p-7 shadow-float sm:p-9">
        <h1 className="font-serif text-[42px] leading-[1.02] font-normal tracking-[-0.02em]">Parolni tiklash</h1>
        <p className="mt-3 mb-7 text-[16px] text-muted">Telefon raqamingizga 6 xonali kod yuboramiz.</p>
        <ResetForm />
        <p className="mt-6 text-center text-[15px] text-muted"><Link href="/kirish" className="font-bold text-primary hover:underline">Kirish sahifasiga qaytish</Link></p>
      </div>
    </div>
  );
}
