import { clickHandler } from "@/lib/click";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    return await clickHandler(req, "prepare");
  } catch (e) {
    console.error("click prepare error", e);
    return Response.json({ error: -7, error_note: "Failed to update user" });
  }
}
