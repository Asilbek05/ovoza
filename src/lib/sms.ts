import "server-only";

/** Eskiz.uz SMS gateway (https://documenter.getpostman.com/view/663428/RzfmES4z). */
export const smsConfigured = () => Boolean(process.env.ESKIZ_EMAIL && process.env.ESKIZ_PASSWORD);

let cached: { token: string; at: number } | null = null;

async function token(force = false) {
  if (!force && cached && Date.now() - cached.at < 20 * 86400_000) return cached.token;
  const res = await fetch("https://notify.eskiz.uz/api/auth/login", {
    method: "POST",
    body: new URLSearchParams({ email: process.env.ESKIZ_EMAIL!, password: process.env.ESKIZ_PASSWORD! }),
  });
  const json = (await res.json().catch(() => ({}))) as { data?: { token?: string } };
  if (!json.data?.token) throw new Error("Eskiz login xatosi");
  cached = { token: json.data.token, at: Date.now() };
  return cached.token;
}

export async function sendSms(phone: string, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!smsConfigured()) return { ok: false, error: "SMS sozlanmagan" };
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token(attempt === 1)}` },
        body: new URLSearchParams({ mobile_phone: phone, message: text, from: process.env.ESKIZ_FROM || "4546" }),
      });
      if (res.status === 401 && attempt === 0) continue; // token expired — log in again once
      if (!res.ok) return { ok: false, error: `SMS yuborilmadi (${res.status})` };
      return { ok: true };
    }
  } catch (e) {
    console.error("sms error", e);
  }
  return { ok: false, error: "SMS yuborilmadi" };
}
