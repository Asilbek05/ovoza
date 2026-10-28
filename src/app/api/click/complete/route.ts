import { clickHandler } from "@/lib/click";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    return await clickHandler(req, "complete");
  } catch (e) {
    console.error("click complete error", e);
    return Response.json({ error: -7, error_note: "Failed to update user" });
  }
}
