import { z } from "zod";
import { BUDGET_BRACKETS, PRIORITY_OPTIONS, VENUE_TYPE_NAMES } from "../constants";

const budgetBracketIds = BUDGET_BRACKETS.map((b) => b.id) as [string, ...string[]];
const venueTypeValues = [...VENUE_TYPE_NAMES] as [string, ...string[]];
const priorityValues = [...PRIORITY_OPTIONS] as [string, ...string[]];

export const intakeSchema = z.object({
  wedding_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  guest_count: z.coerce.number().int().min(50, "Minimum 50 guests").max(5000, "Maximum 5000 guests"),
  city: z.string().trim().min(2, "City is required").max(100),
  venue_type: z.enum(venueTypeValues as [string, ...string[]]),
  budget_bracket: z.enum(budgetBracketIds as [string, ...string[]]),
  priorities: z
    .array(z.enum(priorityValues as [string, ...string[]]))
    .length(2, "Select exactly 2 priorities")
    .refine((p) => new Set(p).size === 2, "Priorities must be different"),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

export const vendorSuggestionSchema = z.object({
  vendor_name: z.string().min(2).max(120),
  quoted_price_inr: z.number().int().positive(),
  highlight: z.string().max(150).optional(),
});

export type VendorSuggestionItem = z.infer<typeof vendorSuggestionSchema>;

export const recommendationItemSchema = z.object({
  vendor_category: z.string().min(1),
  priority_rank: z.number().int().min(1).max(10),
  suggested_budget_inr: z.number().int().min(0),
  rationale: z.string().min(10).max(500),
  vendors: z.array(vendorSuggestionSchema).min(2).max(3),
});

export const selectVenueSchema = z.object({
  intake_id: z.string().uuid(),
  vendor_suggestion_id: z.string().uuid(),
});

export const recommendationsResponseSchema = z.object({
  recommendations: z.array(recommendationItemSchema).min(6).max(10),
});

export type RecommendationItem = z.infer<typeof recommendationItemSchema>;

export const paymentSchema = z.object({
  intake_id: z.string().uuid(),
  vendor_category: z.string().min(1),
  vendor_name: z.string().trim().min(1).max(200),
  amount_inr: z.coerce.number().int().positive("Amount must be positive"),
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export function validateWeddingDate(dateStr: string): string | null {
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return "Invalid date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return "Wedding date must be today or in the future";
  return null;
}
