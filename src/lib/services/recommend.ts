import { buildRecommendMessages } from "../prompts/recommend";
import { scaleAllocations } from "../budget";
import {
  intakeSchema,
  recommendationsResponseSchema,
  type IntakeInput,
  type RecommendationItem,
} from "../validators/intake";
import { resolveBudgetInr } from "../budget";
import { persistIntakeAndRecommendations } from "./persist-plan";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY (or GOOGLE_API_KEY)");
  return apiKey;
}

function extractTextFromGeminiResponse(payload: unknown): string {
  const data = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
}

function extractJsonString(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

async function callGeminiGenerate(system: string, user: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: user }] }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini request failed: ${response.status} ${errText}`);
  }

  const payload = (await response.json()) as unknown;
  const text = extractTextFromGeminiResponse(payload);
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

function normalizeCategory(category: string): string {
  const map: Record<string, string> = {
    photography: "Photography",
    catering: "Catering",
    decor: "Décor",
    décor: "Décor",
    venue: "Venue",
    entertainment: "Entertainment",
    outfits: "Outfits",
    mehendi: "Mehendi",
    invitations: "Invitations",
    videography: "Videography",
    transportation: "Transportation",
    miscellaneous: "Miscellaneous",
    "makeup & styling": "Makeup & styling",
    "makeup and styling": "Makeup & styling",
  };
  const key = category.trim().toLowerCase();
  return map[key] ?? category.trim();
}

export async function callLLMForRecommendations(
  intake: IntakeInput,
  retryError?: string
): Promise<RecommendationItem[]> {
  const { system, user, budgetInr } = buildRecommendMessages(intake, retryError);
  const content = await callGeminiGenerate(system, user);

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonString(content));
  } catch {
    throw new Error("LLM returned invalid JSON");
  }

  const result = recommendationsResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.message);
  }

  const normalized = result.data.recommendations.map((r) => ({
    ...r,
    vendor_category: normalizeCategory(r.vendor_category),
    vendors: (r.vendors ?? []).map((v) => ({
      ...v,
      vendor_name: v.vendor_name.trim(),
    })),
  }));

  return scaleAllocations(normalized, budgetInr) as RecommendationItem[];
}

export async function generateAndPersistRecommendations(
  rawBody: unknown
): Promise<{ id: string; recommendations: RecommendationItem[] }> {
  const parsed = intakeSchema.safeParse(rawBody);
  if (!parsed.success) {
    const err = new Error(parsed.error.message) as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const intake = parsed.data;

  let recommendations: RecommendationItem[];
  try {
    recommendations = await callLLMForRecommendations(intake);
  } catch (firstError) {
    const msg = firstError instanceof Error ? firstError.message : "Unknown error";
    recommendations = await callLLMForRecommendations(intake, msg);
  }

  return persistIntakeAndRecommendations(intake, recommendations);
}

export async function streamLLMAndPersist(
  rawBody: unknown,
  onToken: (chunk: string) => void
): Promise<{ id: string }> {
  const parsed = intakeSchema.safeParse(rawBody);
  if (!parsed.success) {
    const err = new Error(parsed.error.message) as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const intake = parsed.data;
  const budgetInr = resolveBudgetInr(intake.budget_bracket);
  const { system, user } = buildRecommendMessages(intake);

  // Gemini free-tier endpoint doesn't support token streaming in this implementation,
  // so we simulate incremental UI updates by chunking the final JSON text.
  const fullContent = await callGeminiGenerate(system, user);
  const chunks = fullContent.match(/.{1,40}/g) ?? [fullContent];
  for (const chunk of chunks) {
    if (chunk) onToken(chunk);
  }

  let recommendations: RecommendationItem[];
  try {
    const json = JSON.parse(extractJsonString(fullContent));
    const result = recommendationsResponseSchema.safeParse(json);
    if (!result.success) {
      recommendations = await callLLMForRecommendations(intake, result.error.message);
    } else {
      recommendations = scaleAllocations(
        result.data.recommendations.map((r) => ({
          ...r,
          vendor_category: normalizeCategory(r.vendor_category),
          vendors: r.vendors ?? [],
        })),
        budgetInr
      );
    }
  } catch {
    recommendations = await callLLMForRecommendations(intake, "Stream parse failed");
  }

  const result = await persistIntakeAndRecommendations(intake, recommendations);
  return { id: result.id };
}
