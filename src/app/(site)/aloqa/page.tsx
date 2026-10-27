import { MessageCircle, Phone, Mail } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { ProsePage } from "@/components/site/prose-page";

export const metadata = { title: "Aloqa" };

export default async function ContactPage() {
  const st = await getSettings();
  const items = [
    st.site_telegram && { icon: MessageCircle, label: "Telegram", value: st.site_telegram.replace(/^https?:\/\//, ""), href: st.site_telegram },
    st.site_phone && { icon: Phone, label: "Telefon", value: st.site_phone, href: `tel:${st.site_phone.replace(/[^+\d]/g, "")}` },
    st.site_email && { icon: Mail, label: "Email", value: st.site_email, href: `mailto:${st.site_email}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string }[];
  return (
    <ProsePage title="Aloqa">
      <p>Savol, taklif yoki toʻlov bilan bogʻliq muammo boʻlsa — yozing. Odatda bir ish kuni ichida javob beramiz.</p>
      {items.length ? (
        <ul className="!mt-6 grid gap-3 [&_li]:ml-0 [&_li]:list-none [&_li]:p-0">
          {items.map(({ icon: Icon, label, value, href }) => (
            <li key={label}>
              <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center gap-4 rounded-[22px] border border-line p-4 transition hover:border-primary-mid hover:bg-bg">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icon className="size-5" /></span>
                <span><span className="block text-[13px] font-semibold text-muted">{label}</span><span className="block text-[17px] font-bold text-ink">{value}</span></span>
              </a>
            </li>
          ))}
        </ul>
      ) : <p className="rounded-2xl bg-accent-soft p-4 font-semibold text-accent-ink">Aloqa maʼlumotlari tez orada qoʻshiladi.</p>}
    </ProsePage>
  );
}
