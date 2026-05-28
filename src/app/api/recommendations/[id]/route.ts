import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { computeBudgetSummary } from "@/lib/budget";
import type { PlanResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getSupabaseAdmin();

    const { data: intake, error: intakeError } = await supabase
      .from("intakes")
      .select("*")
      .eq("id", id)
      .single();

    if (intakeError || !intake) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const { data: recommendations, error: recError } = await supabase
      .from("recommendations")
      .select("*")
      .eq("intake_id", id)
      .order("priority_rank", { ascending: true });

    if (recError) {
      return NextResponse.json({ error: recError.message }, { status: 500 });
    }

    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("*")
      .eq("intake_id", id)
      .order("paid_on", { ascending: false });

    if (payError) {
      return NextResponse.json({ error: payError.message }, { status: 500 });
    }

    const budget_summary = computeBudgetSummary(
      intake.budget_inr,
      recommendations ?? [],
      payments ?? []
    );

    const response: PlanResponse = {
      intake: {
        id: intake.id,
        wedding_date: intake.wedding_date,
        guest_count: intake.guest_count,
        city: intake.city,
        venue_type: intake.venue_type,
        budget_bracket: intake.budget_bracket,
        budget_inr: intake.budget_inr,
        priorities: intake.priorities,
        created_at: intake.created_at,
      },
      recommendations: recommendations ?? [],
      payments: payments ?? [],
      budget_summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/recommendations/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
