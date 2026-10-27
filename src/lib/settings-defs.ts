export const SETTING_DEFS = [
  { key: "site_phone", label: "Aloqa telefoni", hint: "Footer va «Aloqa» sahifasida chiqadi", placeholder: "+998 90 123 45 67" },
  { key: "site_telegram", label: "Telegram manzili", hint: "Masalan: https://t.me/tushun_uz", placeholder: "https://t.me/…" },
  { key: "site_email", label: "Email", hint: "", placeholder: "salom@tushun.uz" },
  { key: "payment_card", label: "Toʻlov uchun karta raqami", hint: "Click/Payme ulanmaguncha buyurtma sahifasida koʻrsatiladi", placeholder: "8600 •••• •••• ••••" },
  { key: "payment_holder", label: "Karta egasi", hint: "", placeholder: "F.I.SH" },
  { key: "announcement", label: "Eʼlon (yuqori chiziq)", hint: "Boʻsh qoldirilsa chiqmaydi. Masalan: «Yangi: Fizika testlari qoʻshildi»", placeholder: "" },
] as const;
export type SettingKey = (typeof SETTING_DEFS)[number]["key"];

