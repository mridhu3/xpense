import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { storageGetSignedUrl, storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

const expenseSchema = {
  type: "object",
  properties: {
    merchant: { type: "string", description: "Merchant or place name" },
    amount: { type: "number", description: "Expense amount in Indian rupees" },
    category: { type: "string", enum: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"] },
    wallet: { type: "string", enum: ["UPI", "Cash", "Card"] },
    confidence: { type: "number", description: "Confidence from 0 to 1" },
    note: { type: "string", description: "Short explanation or extracted receipt note" },
  },
  required: ["merchant", "amount", "category", "wallet", "confidence", "note"],
  additionalProperties: false,
} as const;

async function parseExpenseText(text: string) {
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "You extract one expense from natural language. Infer missing wallet as UPI, use Indian rupees, and output JSON only." },
      { role: "user", content: text },
    ],
    response_format: { type: "json_schema", json_schema: { name: "voice_expense", strict: true, schema: expenseSchema } },
  });
  const content = response.choices[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The AI parser returned no result");
  return JSON.parse(content) as z.infer<typeof parsedExpenseZod>;
}

const parsedExpenseZod = z.object({
  merchant: z.string().min(1).max(160),
  amount: z.number().positive(),
  category: z.enum(["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"]),
  wallet: z.enum(["UPI", "Cash", "Card"]),
  confidence: z.number().min(0).max(1),
  note: z.string().max(500),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  receipt: router({
    analyze: publicProcedure
      .input(z.object({ imageDataUrl: z.string().startsWith("data:image/").max(12_000_000) }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          model: "gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a receipt OCR and expense categorization assistant for India. Read the receipt image carefully, extract the final paid total, merchant, and infer a category. If uncertain, use confidence below 0.7. Output JSON only." },
            { role: "user", content: [
              { type: "text", text: "Extract this receipt into a single expense. Use INR and choose one category: Food, Transport, Shopping, Bills, Entertainment, Other." },
              { type: "image_url", image_url: { url: input.imageDataUrl, detail: "high" } },
            ] },
          ],
          response_format: { type: "json_schema", json_schema: { name: "receipt_expense", strict: true, schema: expenseSchema } },
        });
        const content = response.choices[0]?.message?.content;
        if (typeof content !== "string") throw new Error("The receipt scanner returned no result");
        return parsedExpenseZod.parse(JSON.parse(content));
      }),
  }),

  voice: router({
    transcribeAndParse: publicProcedure
      .input(z.object({ audioBase64: z.string().min(100).max(18_000_000), mimeType: z.string().default("audio/m4a") }))
      .mutation(async ({ input }) => {
        const upload = await storagePut(`xpense/voice/${crypto.randomUUID()}.m4a`, Buffer.from(input.audioBase64, "base64"), input.mimeType);
        const signedUrl = await storageGetSignedUrl(upload.key);
        const transcription = await transcribeAudio({ audioUrl: signedUrl, language: "en", prompt: "Expense entry with Indian rupee amount, merchant, category, and wallet." });
        if ("error" in transcription) throw new Error(transcription.error);
        const parsed = await parseExpenseText(transcription.text);
        return { transcript: transcription.text, ...parsed };
      }),
    parseText: publicProcedure
      .input(z.object({ transcript: z.string().min(3).max(500) }))
      .mutation(async ({ input }) => ({ transcript: input.transcript, ...(await parseExpenseText(input.transcript)) })),
  }),

  coach: router({
    advice: publicProcedure
      .input(z.object({ spent: z.number().nonnegative(), budget: z.number().positive(), categories: z.record(z.string(), z.number().nonnegative()), goalCount: z.number().int().nonnegative() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            { role: "system", content: "You are XPense Coach, a warm and practical personal budgeting coach for Indian students. Give specific advice without shame, never recommend financial products, and use INR." },
            { role: "user", content: `This month the user spent ₹${input.spent} of a ₹${input.budget} budget. Category totals: ${JSON.stringify(input.categories)}. They have ${input.goalCount} savings goals. Give three short, actionable tips.` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "coach_advice", strict: true, schema: { type: "object", properties: { headline: { type: "string" }, tips: { type: "array", items: { type: "string" } }, action: { type: "string" } }, required: ["headline", "tips", "action"], additionalProperties: false } } },
        });
        const content = response.choices[0]?.message?.content;
        if (typeof content !== "string") throw new Error("The coach returned no advice");
        return JSON.parse(content) as { headline: string; tips: string[]; action: string };
      }),
  }),
});

export type AppRouter = typeof appRouter;
