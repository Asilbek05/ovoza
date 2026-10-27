import { ProsePage } from "@/components/site/prose-page";

export const metadata = { title: "Maxfiylik siyosati" };

export default function PrivacyPage() {
  return (
    <ProsePage title="Maxfiylik siyosati" updated="2026-yil">
      <h2>Qanday maʼlumot yigʻamiz</h2>
      <ul>
        <li>Ism, telefon raqami va parol (parol faqat shifrlangan koʻrinishda saqlanadi).</li>
        <li>Test natijalari, javoblar va ularga sarflangan vaqt.</li>
        <li>Buyurtmalar va toʻlov holati.</li>
      </ul>
      <h2>Nimaga ishlatamiz</h2>
      <p>Maʼlumotlar faqat xizmatni koʻrsatish, natijalaringizni saqlash, toʻlovni tasdiqlash va aloqa uchun ishlatiladi. Ularni uchinchi shaxslarga sotmaymiz.</p>
      <h2>Cookie</h2>
      <p>Faqat tizimga kirish va test urinishini saqlash uchun zarur cookie fayllaridan foydalanamiz. Reklama va kuzatuv cookie-lari yoʻq.</p>
      <h2>Maʼlumotlarni oʻchirish</h2>
      <p>Hisobingiz va unga bogʻliq maʼlumotlarni oʻchirishni xohlasangiz, «Aloqa» sahifasi orqali yozing.</p>
    </ProsePage>
  );
}
