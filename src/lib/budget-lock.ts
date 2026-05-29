import type { RecommendationRecord } from "./types";

export interface LockedAllocation {
  recommendations: Array<RecommendationRecord & { effective_budget_inr: number }>;
  venue_locked: boolean;
  venue_price_inr: number | null;
  remaining_after_venue_inr: number;
}

/** After venue is picked, fix venue allocation and scale other categories to remaining budget. */
export function applyVenueLock(
  totalBudgetInr: number,
  recommendations: RecommendationRecord[],
  selectedVenuePriceInr: number
): LockedAllocation {
  const others = recommendations.filter((r) => r.vendor_category !== "Venue");

  const remaining = Math.max(0, totalBudgetInr - selectedVenuePriceInr);
  const othersSuggested = others.reduce((s, r) => s + r.suggested_budget_inr, 0);
  const scale = othersSuggested > 0 ? remaining / othersSuggested : 1;

  const adjusted = recommendations.map((rec) => {
    if (rec.vendor_category === "Venue") {
      return { ...rec, effective_budget_inr: selectedVenuePriceInr };
    }
    return {
      ...rec,
      effective_budget_inr: Math.round(rec.suggested_budget_inr * scale),
    };
  });

  return {
    recommendations: adjusted,
    venue_locked: true,
    venue_price_inr: selectedVenuePriceInr,
    remaining_after_venue_inr: remaining,
  };
}

export function getCategoryPriceRange(
  vendors: { quoted_price_inr: number }[]
): { min: number; max: number } | null {
  if (vendors.length === 0) return null;
  const prices = vendors.map((v) => v.quoted_price_inr);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
