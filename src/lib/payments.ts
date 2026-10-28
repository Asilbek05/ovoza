import "server-only";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4010").replace(/\/$/, "");

export const paymeConfigured = () => Boolean(process.env.PAYME_MERCHANT_ID && process.env.PAYME_KEY);
export const clickConfigured = () => Boolean(process.env.CLICK_SERVICE_ID && process.env.CLICK_MERCHANT_ID && process.env.CLICK_SECRET_KEY);

/** Hosted checkout links for a pending order. Amounts: Payme wants tiyin, Click wants so'm. */
export function paymentLinks(order: { id: number; amountUzs: number }) {
  const back = `${siteUrl()}/kabinet`;
  const links: { payme?: string; click?: string } = {};
  if (paymeConfigured()) {
    const host = process.env.PAYME_TEST === "1" ? "https://checkout.test.paycom.uz" : "https://checkout.paycom.uz";
    const raw = `m=${process.env.PAYME_MERCHANT_ID};ac.order_id=${order.id};a=${order.amountUzs * 100};l=uz;c=${back}`;
    links.payme = `${host}/${Buffer.from(raw).toString("base64")}`;
  }
  if (clickConfigured()) {
    const q = new URLSearchParams({
      service_id: process.env.CLICK_SERVICE_ID!,
      merchant_id: process.env.CLICK_MERCHANT_ID!,
      amount: String(order.amountUzs),
      transaction_param: String(order.id),
      return_url: back,
    });
    links.click = `https://my.click.uz/services/pay?${q}`;
  }
  return links;
}
