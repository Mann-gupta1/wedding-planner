import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { paymentSchema } from "@/lib/validators/intake";
import { computeBudgetSummary } from "@/lib/budget";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { intake_id, vendor_category, vendor_name, amount_inr, paid_on } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data: intake, error: intakeError } = await supabase
      .from("intakes")
      .select("id, budget_inr")
      .eq("id", intake_id)
      .single();

    if (intakeError || !intake) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const { data: recs, error: recError } = await supabase
      .from("recommendations")
      .select("vendor_category")
      .eq("intake_id", intake_id);

    if (recError) {
      return NextResponse.json({ error: recError.message }, { status: 500 });
    }

    const validCategories = new Set((recs ?? []).map((r) => r.vendor_category));
    if (!validCategories.has(vendor_category)) {
      return NextResponse.json(
        { error: "Vendor category must match a recommendation category" },
        { status: 400 }
      );
    }

    const { data: payment, error: payError } = await supabase
      .from("payments")
      .insert({ intake_id, vendor_category, vendor_name, amount_inr, paid_on })
      .select()
      .single();

    if (payError || !payment) {
      return NextResponse.json({ error: payError?.message ?? "Failed to save payment" }, { status: 500 });
    }

    const { data: allPayments } = await supabase
      .from("payments")
      .select("vendor_category, amount_inr")
      .eq("intake_id", intake_id);

    const { data: allRecs } = await supabase
      .from("recommendations")
      .select("vendor_category, suggested_budget_inr")
      .eq("intake_id", intake_id);

    const budget_summary = computeBudgetSummary(
      intake.budget_inr,
      allRecs ?? [],
      allPayments ?? []
    );

    return NextResponse.json({ payment, budget_summary });
  } catch (error) {
    console.error("[POST /api/payments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
