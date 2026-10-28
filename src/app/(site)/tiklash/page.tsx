import Link from "next/link";
import { ResetForm } from "./form";

export const metadata = { title: "Parolni tiklash" };

export default function ResetPage() {
  return (
    <div className="container-page flex justify-center pt-10 pb-20 sm:pt-12">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-7 shadow-float sm:p-9">
        <h1 className="t-h1">Parolni tiklash</h1>
        <p className="mt-3 mb-7 text-base text-muted">Telefon raqamingizga 6 xonali kod yuboramiz.</p>
        <ResetForm />
        <p className="mt-6 text-center text-sm text-muted"><Link href="/kirish" className="font-bold text-primary hover:underline">Kirish sahifasiga qaytish</Link></p>
      </div>
    </div>
  );
}
