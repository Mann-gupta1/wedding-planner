import type { BudgetSummary } from "./budget";

export interface IntakeRecord {
  id: string;
  wedding_date: string;
  guest_count: number;
  city: string;
  venue_type: string;
  budget_bracket: string;
  budget_inr: number;
  priorities: string[];
  created_at: string;
}

export interface RecommendationRecord {
  id: string;
  intake_id: string;
  vendor_category: string;
  priority_rank: number;
  suggested_budget_inr: number;
  rationale: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  intake_id: string;
  vendor_category: string;
  vendor_name: string;
  amount_inr: number;
  paid_on: string;
  created_at: string;
}

export interface PlanResponse {
  intake: IntakeRecord;
  recommendations: RecommendationRecord[];
  payments: PaymentRecord[];
  budget_summary: BudgetSummary;
}
