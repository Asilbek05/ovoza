import "server-only";
import { z } from "zod";

export const importedQuestion = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correct_index: z.number().int().min(0).nullable(),
  topic: z.string().nullable().optional(),
});
export type ImportedQuestion = z.infer<typeof importedQuestion>;

/** Pull plain text out of an uploaded file. */
export async function extractText(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: buf });
    return r.value;
  }
  if (ext === "pdf") {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await pdfText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  return buf.toString("utf8");
}

/** JSON import: [{text, options, correct_index, topic}] or {questions:[...]} */
export function parseJson(text: string): ImportedQuestion[] | null {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data?.questions;
    if (!Array.isArray(arr)) return null;
    return arr.map((q: Record<string, unknown>) =>
      importedQuestion.parse({
        text: q.text ?? q.question,
        options: q.options,
        correct_index: q.correct_index ?? q.correctIndex ?? q.answer_index ?? null,
        topic: q.topic ?? null,
      }),
    );
  } catch {
    return null;
  }
}

const LETTERS = "ABCDEF";

/**
 * Heuristic parser for the usual test layout:
 *   1. Savol matni
 *   A) variant  B) variant ...
 *   Javob: B
 * Works without AI; AI is used when it finds nothing or when asked.
 */
export function parsePlain(raw: string): ImportedQuestion[] {
  const text = raw.replace(/\r/g, "").replace(/ /g, " ");
  const blocks = text.split(/\n(?=\s*\d{1,3}\s*[.)]\s+)/).map((b) => b.trim()).filter(Boolean);
  const out: ImportedQuestion[] = [];
  for (const block of blocks) {
    const m = block.match(/^\s*\d{1,3}\s*[.)]\s+([\s\S]*)$/);
    if (!m) continue;
    let body = m[1];
    let correct: number | null = null;
    const ans = body.match(/\n?\s*(?:javob|to[ʻ'’`]?g[ʻ'’`]?ri javob|answer)\s*[:\-–]\s*([A-F])\b.*$/im);
    if (ans) {
      correct = LETTERS.indexOf(ans[1].toUpperCase());
      body = body.slice(0, ans.index).trim();
    }
    // "*C) 29" marks the right answer before the label — move the star behind it
    body = body.replace(/(^|\s)\*\s*([A-F])\s*([).])/g, "$1$2$3 *");
    const parts = body.split(/(?:^|\s|\n)([A-F])\s*[).]\s+/);
    if (parts.length < 5) continue;
    const qText = parts[0].trim();
    const options: string[] = [];
    for (let i = 1; i < parts.length - 1; i += 2) {
      let opt = parts[i + 1].trim();
      if (opt.startsWith("*")) {
        correct = options.length;
        opt = opt.slice(1).trim();
      }
      options.push(opt.replace(/\s+/g, " "));
    }
    if (qText && options.length >= 2) out.push({ text: qText.replace(/\s+\n/g, "\n"), options: options.slice(0, 6), correct_index: correct, topic: null });
  }
  return out;
}

export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function parseWithAI(raw: string): Promise<ImportedQuestion[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  const res = await client.messages.create({
    model,
    max_tokens: 16000,
    tools: [
      {
        name: "save_questions",
        description: "Save the multiple-choice questions found in the document.",
        input_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string", description: "Savol matni, raqamsiz, asl tilida" },
                  options: { type: "array", items: { type: "string" }, description: "Variantlar, harf belgilarisiz (A) yo'q)" },
                  correct_index: { type: ["integer", "null"], description: "To'g'ri variant indeksi (0 dan). Hujjatda ko'rsatilmagan bo'lsa null" },
                  topic: { type: ["string", "null"], description: "Qisqa mavzu nomi, masalan 'Kvadrat tenglamalar'" },
                },
                required: ["text", "options", "correct_index", "topic"],
              },
            },
          },
          required: ["questions"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "save_questions" },
    messages: [
      {
        role: "user",
        content:
          "Quyidagi hujjatdan barcha test savollarini ajratib ol. Matnni o'zgartirma, faqat tozalab ol. " +
          "Formulalarni Unicode belgilar bilan yoz (x², √, π, ≤). To'g'ri javob ko'rsatilgan bo'lsa (javoblar kaliti, * belgisi, 'Javob: B'), uni correct_index ga qo'y; bo'lmasa null. " +
          "Har bir savolga qisqa mavzu nomini o'zbek tilida ber.\n\n<document>\n" +
          raw.slice(0, 120_000) +
          "\n</document>",
      },
    ],
  });
  const block = res.content.find((c) => c.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("AI javob qaytarmadi");
  const parsed = z.object({ questions: z.array(importedQuestion) }).parse(block.input);
  return parsed.questions;
}
