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
  budget_locked: boolean;
  selected_venue_vendor_id: string | null;
  selected_venue_price_inr: number | null;
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
  effective_budget_inr?: number;
  vendors?: VendorSuggestionRecord[];
  price_range?: { min_inr: number; max_inr: number };
}

export interface VendorSuggestionRecord {
  id: string;
  intake_id: string;
  recommendation_id: string | null;
  vendor_category: string;
  vendor_name: string;
  quoted_price_inr: number;
  highlight: string | null;
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
  venue_locked: boolean;
  remaining_after_venue_inr: number | null;
  vendors_table_ready?: boolean;
}
