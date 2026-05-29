import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { selectVenueSchema } from "@/lib/validators/intake";
import { loadPlanById } from "@/lib/plan-loader";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = selectVenueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { intake_id, vendor_suggestion_id } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data: vendor, error: vendorError } = await supabase
      .from("vendor_suggestions")
      .select("*")
      .eq("id", vendor_suggestion_id)
      .eq("intake_id", intake_id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor option not found" }, { status: 404 });
    }

    if (vendor.vendor_category !== "Venue") {
      return NextResponse.json(
        { error: "Only a Venue vendor can lock the budget" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("intakes")
      .update({
        budget_locked: true,
        selected_venue_vendor_id: vendor.id,
        selected_venue_price_inr: vendor.quoted_price_inr,
      })
      .eq("id", intake_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const plan = await loadPlanById(intake_id);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Venue selected — your budget is now locked to this venue price.",
      selected_vendor: vendor,
      plan,
    });
  } catch (error) {
    console.error("[POST /api/select-venue]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
