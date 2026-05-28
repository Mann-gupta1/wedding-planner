import OpenAI from "openai";
import { buildRecommendMessages } from "../prompts/recommend";
import { scaleAllocations } from "../budget";
import {
  intakeSchema,
  recommendationsResponseSchema,
  type IntakeInput,
  type RecommendationItem,
} from "../validators/intake";
import { getSupabaseAdmin } from "../supabase/admin";
import { resolveBudgetInr } from "../budget";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey });
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
  const openai = getOpenAI();
  const { system, user, budgetInr } = buildRecommendMessages(intake, retryError);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
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
  }));

  return scaleAllocations(normalized, budgetInr);
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
  const budgetInr = resolveBudgetInr(intake.budget_bracket);
  const supabase = getSupabaseAdmin();

  let recommendations: RecommendationItem[];
  try {
    recommendations = await callLLMForRecommendations(intake);
  } catch (firstError) {
    const msg = firstError instanceof Error ? firstError.message : "Unknown error";
    recommendations = await callLLMForRecommendations(intake, msg);
  }

  const { data: intakeRow, error: intakeError } = await supabase
    .from("intakes")
    .insert({
      wedding_date: intake.wedding_date,
      guest_count: intake.guest_count,
      city: intake.city,
      venue_type: intake.venue_type,
      budget_bracket: intake.budget_bracket,
      budget_inr: budgetInr,
      priorities: intake.priorities,
    })
    .select("id")
    .single();

  if (intakeError || !intakeRow) {
    throw new Error(intakeError?.message ?? "Failed to save intake");
  }

  const recRows = recommendations.map((r) => ({
    intake_id: intakeRow.id,
    vendor_category: r.vendor_category,
    priority_rank: r.priority_rank,
    suggested_budget_inr: r.suggested_budget_inr,
    rationale: r.rationale,
  }));

  const { error: recError } = await supabase.from("recommendations").insert(recRows);
  if (recError) {
    await supabase.from("intakes").delete().eq("id", intakeRow.id);
    throw new Error(recError.message);
  }

  return { id: intakeRow.id, recommendations };
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
  const openai = getOpenAI();
  const { system, user } = buildRecommendMessages(intake);

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
  });

  let fullContent = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullContent += delta;
      onToken(delta);
    }
  }

  let recommendations: RecommendationItem[];
  try {
    const json = JSON.parse(fullContent);
    const result = recommendationsResponseSchema.safeParse(json);
    if (!result.success) {
      recommendations = await callLLMForRecommendations(intake, result.error.message);
    } else {
      recommendations = scaleAllocations(
        result.data.recommendations.map((r) => ({
          ...r,
          vendor_category: r.vendor_category.trim(),
        })),
        budgetInr
      );
    }
  } catch {
    recommendations = await callLLMForRecommendations(intake, "Stream parse failed");
  }

  const supabase = getSupabaseAdmin();
  const { data: intakeRow, error: intakeError } = await supabase
    .from("intakes")
    .insert({
      wedding_date: intake.wedding_date,
      guest_count: intake.guest_count,
      city: intake.city,
      venue_type: intake.venue_type,
      budget_bracket: intake.budget_bracket,
      budget_inr: budgetInr,
      priorities: intake.priorities,
    })
    .select("id")
    .single();

  if (intakeError || !intakeRow) {
    throw new Error(intakeError?.message ?? "Failed to save intake");
  }

  const recRows = recommendations.map((r) => ({
    intake_id: intakeRow.id,
    vendor_category: r.vendor_category,
    priority_rank: r.priority_rank,
    suggested_budget_inr: r.suggested_budget_inr,
    rationale: r.rationale,
  }));

  const { error: recError } = await supabase.from("recommendations").insert(recRows);
  if (recError) {
    await supabase.from("intakes").delete().eq("id", intakeRow.id);
    throw new Error(recError.message);
  }

  return { id: intakeRow.id };
}
