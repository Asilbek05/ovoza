import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { ProfileForms } from "./form";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish?next=/kabinet/profil");
  return (
    <div className="container-page pt-6 pb-10">
      <Link href="/kabinet" className="mb-5 inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[15px] font-semibold hover:border-primary-mid"><ArrowLeft className="size-4" /> Kabinet</Link>
      <h1 className="mb-8 font-serif text-[48px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[68px]">Profil</h1>
      <ProfileForms name={user.name} phone={user.phone} audience={user.audience === "applicant" ? "applicant" : "teacher"} />
    </div>
  );
}
