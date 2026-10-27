import "server-only";
import { promises as fs } from "fs";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");

const AUDIO = ["mp3", "m4a", "ogg", "wav", "webm", "aac"];
const IMAGE = ["jpg", "jpeg", "png", "webp"];

export function validateUpload(file: File, kind: "audio" | "image") {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const allowed = kind === "audio" ? AUDIO : IMAGE;
  const max = kind === "audio" ? 20 : 5;
  if (!allowed.includes(ext)) return `Faqat ${allowed.join(", ")} fayllari qabul qilinadi`;
  if (file.size > max * 1024 * 1024) return `Fayl ${max} MB dan oshmasligi kerak`;
  return null;
}

export async function saveUpload(file: File, folder: "audio" | "images") {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const bucket = process.env.SUPABASE_BUCKET || "media";
    const { error } = await sb.storage.from(bucket).upload(name, bytes, { contentType: file.type || undefined, upsert: false });
    if (error) throw new Error(`Yuklashda xato: ${error.message}`);
    return sb.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  }

  const full = path.join(UPLOAD_DIR, name);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, bytes);
  return `/uploads/${name}`;
}
