import type { RecommendationItem } from "../validators/intake";
import { getSupabaseAdmin } from "../supabase/admin";
import type { IntakeInput } from "../validators/intake";
import { resolveBudgetInr } from "../budget";
import { isMissingVendorSuggestionsTable, MIGRATION_002_HINT } from "../vendor-table";

function ensureVendors(rec: RecommendationItem, city: string): RecommendationItem {
  if (rec.vendors && rec.vendors.length >= 2) return rec;

  const base = rec.suggested_budget_inr || 100000;
  const spreads = [0.82, 1.0, 1.18];
  const labels = ["Best value", "Popular pick", "Premium"];
  const names = [
    `${city} ${rec.vendor_category} Co.`,
    `Royal ${rec.vendor_category} ${city}`,
    `Elite ${rec.vendor_category} Studios`,
  ];

  return {
    ...rec,
    vendors: spreads.map((m, i) => ({
      vendor_name: names[i] ?? `${rec.vendor_category} Vendor ${i + 1}`,
      quoted_price_inr: Math.max(10000, Math.round(base * m)),
      highlight: labels[i],
    })),
  };
}

export async function persistIntakeAndRecommendations(
  intake: IntakeInput,
  recommendations: RecommendationItem[]
) {
  const budgetInr = resolveBudgetInr(intake.budget_bracket);
  const supabase = getSupabaseAdmin();

  const enriched = recommendations.map((r) => ensureVendors(r, intake.city));

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

  const recRows = enriched.map((r) => ({
    intake_id: intakeRow.id,
    vendor_category: r.vendor_category,
    priority_rank: r.priority_rank,
    suggested_budget_inr: r.suggested_budget_inr,
    rationale: r.rationale,
  }));

  const { data: insertedRecs, error: recError } = await supabase
    .from("recommendations")
    .insert(recRows)
    .select("id, vendor_category");

  if (recError || !insertedRecs) {
    await supabase.from("intakes").delete().eq("id", intakeRow.id);
    throw new Error(recError?.message ?? "Failed to save recommendations");
  }

  const vendorRows = insertedRecs.flatMap((rec) => {
    const source = enriched.find((r) => r.vendor_category === rec.vendor_category);
    if (!source?.vendors) return [];
    return source.vendors.map((v) => ({
      intake_id: intakeRow.id,
      recommendation_id: rec.id,
      vendor_category: rec.vendor_category,
      vendor_name: v.vendor_name,
      quoted_price_inr: v.quoted_price_inr,
      highlight: v.highlight ?? null,
    }));
  });

  if (vendorRows.length > 0) {
    const { error: vendorError } = await supabase.from("vendor_suggestions").insert(vendorRows);
    if (vendorError) {
      await supabase.from("intakes").delete().eq("id", intakeRow.id);
      if (isMissingVendorSuggestionsTable(vendorError)) {
        throw new Error(
          `Database migration required for vendor suggestions. ${MIGRATION_002_HINT}`
        );
      }
      throw new Error(vendorError.message);
    }
  }

  return { id: intakeRow.id, recommendations: enriched };
}
