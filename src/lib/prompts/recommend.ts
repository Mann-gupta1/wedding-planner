import type { IntakeInput } from "../validators/intake";
import { resolveBudgetInr } from "../budget";

export function buildRecommendMessages(intake: IntakeInput, retryError?: string) {
  const budgetInr = resolveBudgetInr(intake.budget_bracket);

  const system = `You are an expert Indian wedding planner helping couples allocate their wedding budget across vendor categories.

Output ONLY valid JSON with this exact shape:
{
  "recommendations": [
    {
      "vendor_category": "string",
      "priority_rank": number,
      "suggested_budget_inr": number,
      "rationale": "string",
      "vendors": [
        {
          "vendor_name": "string",
          "quoted_price_inr": number,
          "highlight": "string (optional short tag e.g. Best value, Premium)"
        }
      ]
    }
  ]
}

Rules:
- Include 6 to 8 vendor categories from: Venue, Catering, Photography, Videography, Décor, Entertainment, Outfits, Mehendi, Invitations, Makeup & styling, Transportation, Miscellaneous
- For EACH category include exactly 2 or 3 realistic Indian vendor options in "vendors"
- vendor quoted_price_inr must be integers in INR, spread across a sensible range for that category (e.g. Venue for ${intake.guest_count} guests in ${intake.city}: three options like 8L, 10L, 12L if category allocation is ~10L)
- suggested_budget_inr for a category should be near the middle of its vendor price range
- Sum of all suggested_budget_inr must be <= ${budgetInr} (2-5% buffer unallocated is fine)
- Boost allocations for top 2 priorities: ${intake.priorities.join(", ")}
- Scale Catering with guest count (${intake.guest_count} guests)
- Venue type: "${intake.venue_type}" — venue vendors must match this style
- City: ${intake.city}, India — use plausible local-sounding vendor names
- Rationale: 1-2 practical sentences, India-specific
- Use vendor_category names exactly as listed above`;

  const user = `Wedding date: ${intake.wedding_date}
Guest count: ${intake.guest_count}
City: ${intake.city}
Venue type: ${intake.venue_type}
Total budget (INR): ${budgetInr}
Budget bracket: ${intake.budget_bracket}
Top 2 priorities: ${intake.priorities.join(", ")}${retryError ? `\n\nPrevious response failed validation: ${retryError}\nPlease fix and return valid JSON only.` : ""}`;

  return { system, user, budgetInr };
}
