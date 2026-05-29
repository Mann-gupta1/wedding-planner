import { getSupabaseAdmin } from "./supabase/admin";
import { computeBudgetSummary } from "./budget";
import { applyVenueLock, getCategoryPriceRange } from "./budget-lock";
import type { PlanResponse, RecommendationRecord, VendorSuggestionRecord } from "./types";

export async function loadPlanById(intakeId: string): Promise<PlanResponse | null> {
  const supabase = getSupabaseAdmin();

  const { data: intake, error: intakeError } = await supabase
    .from("intakes")
    .select("*")
    .eq("id", intakeId)
    .single();

  if (intakeError || !intake) return null;

  const { data: recommendations, error: recError } = await supabase
    .from("recommendations")
    .select("*")
    .eq("intake_id", intakeId)
    .order("priority_rank", { ascending: true });

  if (recError) throw new Error(recError.message);

  const { data: vendors, error: vendorError } = await supabase
    .from("vendor_suggestions")
    .select("*")
    .eq("intake_id", intakeId)
    .order("quoted_price_inr", { ascending: true });

  if (vendorError) throw new Error(vendorError.message);

  const { data: payments, error: payError } = await supabase
    .from("payments")
    .select("*")
    .eq("intake_id", intakeId)
    .order("paid_on", { ascending: false });

  if (payError) throw new Error(payError.message);

  const vendorsByCategory = (vendors ?? []).reduce<Record<string, VendorSuggestionRecord[]>>(
    (acc, v) => {
      if (!acc[v.vendor_category]) acc[v.vendor_category] = [];
      acc[v.vendor_category].push(v);
      return acc;
    },
    {}
  );

  let enrichedRecs: RecommendationRecord[] = (recommendations ?? []).map((rec) => {
    const categoryVendors = vendorsByCategory[rec.vendor_category] ?? [];
    const range = getCategoryPriceRange(categoryVendors);
    return {
      ...rec,
      vendors: categoryVendors,
      price_range: range ? { min_inr: range.min, max_inr: range.max } : undefined,
    };
  });

  let remaining_after_venue_inr: number | null = null;
  const venue_locked = Boolean(intake.budget_locked && intake.selected_venue_price_inr);

  if (venue_locked && intake.selected_venue_price_inr) {
    const locked = applyVenueLock(
      intake.budget_inr,
      enrichedRecs,
      intake.selected_venue_price_inr
    );
    enrichedRecs = locked.recommendations;
    remaining_after_venue_inr = locked.remaining_after_venue_inr;
  }

  const allocationRows = enrichedRecs.map((r) => ({
    vendor_category: r.vendor_category,
    suggested_budget_inr: r.effective_budget_inr ?? r.suggested_budget_inr,
  }));

  const budget_summary = computeBudgetSummary(
    intake.budget_inr,
    allocationRows,
    payments ?? []
  );

  return {
    intake: {
      id: intake.id,
      wedding_date: intake.wedding_date,
      guest_count: intake.guest_count,
      city: intake.city,
      venue_type: intake.venue_type,
      budget_bracket: intake.budget_bracket,
      budget_inr: intake.budget_inr,
      priorities: intake.priorities,
      budget_locked: intake.budget_locked ?? false,
      selected_venue_vendor_id: intake.selected_venue_vendor_id ?? null,
      selected_venue_price_inr: intake.selected_venue_price_inr ?? null,
      created_at: intake.created_at,
    },
    recommendations: enrichedRecs,
    payments: payments ?? [],
    budget_summary,
    venue_locked,
    remaining_after_venue_inr,
  };
}
