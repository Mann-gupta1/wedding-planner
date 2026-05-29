import { BUDGET_BRACKETS } from "./constants";

export function resolveBudgetInr(bracketId: string): number {
  const bracket = BUDGET_BRACKETS.find((b) => b.id === bracketId);
  if (!bracket) {
    throw new Error(`Invalid budget bracket: ${bracketId}`);
  }
  return bracket.budgetInr;
}

export interface RecommendationRow {
  vendor_category: string;
  suggested_budget_inr: number;
}

export interface PaymentRow {
  vendor_category: string;
  amount_inr: number;
}

export interface BudgetSummary {
  total_budget_inr: number;
  allocated_by_category: Record<string, number>;
  total_spent_inr: number;
  remaining_inr: number;
  category_balances: Record<string, { allocated: number; spent: number; balance: number }>;
}

export function computeBudgetSummary(
  totalBudgetInr: number,
  recommendations: RecommendationRow[],
  payments: PaymentRow[]
): BudgetSummary {
  const allocated_by_category: Record<string, number> = {};
  for (const rec of recommendations) {
    allocated_by_category[rec.vendor_category] =
      (allocated_by_category[rec.vendor_category] ?? 0) + rec.suggested_budget_inr;
  }

  const spent_by_category: Record<string, number> = {};
  for (const payment of payments) {
    spent_by_category[payment.vendor_category] =
      (spent_by_category[payment.vendor_category] ?? 0) + payment.amount_inr;
  }

  const total_spent_inr = payments.reduce((sum, p) => sum + p.amount_inr, 0);
  const remaining_inr = totalBudgetInr - total_spent_inr;

  const category_balances: BudgetSummary["category_balances"] = {};
  const categories = Array.from(
    new Set([
      ...Object.keys(allocated_by_category),
      ...Object.keys(spent_by_category),
    ])
  );

  for (const category of categories) {
    const allocated = allocated_by_category[category] ?? 0;
    const spent = spent_by_category[category] ?? 0;
    category_balances[category] = {
      allocated,
      spent,
      balance: allocated - spent,
    };
  }

  return {
    total_budget_inr: totalBudgetInr,
    allocated_by_category,
    total_spent_inr,
    remaining_inr,
    category_balances,
  };
}

export function scaleAllocations<T extends { suggested_budget_inr: number }>(
  recommendations: T[],
  budgetInr: number
): T[] {
  const total = recommendations.reduce((s, r) => s + r.suggested_budget_inr, 0);
  if (total <= budgetInr || total === 0) return recommendations;

  const scale = budgetInr / total;
  return recommendations.map((r) => ({
    ...r,
    suggested_budget_inr: Math.round(r.suggested_budget_inr * scale),
  }));
}
