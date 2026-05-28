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
      "rationale": "string"
    }
  ]
}

Rules:
- Include 6 to 8 vendor categories from: Venue, Catering, Photography, Videography, Décor, Entertainment, Outfits, Mehendi, Invitations, Makeup & styling, Transportation, Miscellaneous
- priority_rank: 1 = highest priority for booking, unique ranks 1 through N
- suggested_budget_inr: integers in INR; sum must be <= ${budgetInr} (leave 2-5% buffer unallocated is fine)
- Boost allocations for the couple's stated top 2 priorities
- Scale Catering with guest count (${intake.guest_count} guests)
- Adjust for venue type "${intake.venue_type}" (e.g. destination weddings need more travel/venue; banquet halls need strong venue + catering)
- City context: ${intake.city}, India
- Rationale: 1-2 practical sentences, India-specific, no markdown
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
