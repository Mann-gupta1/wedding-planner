import { NextRequest, NextResponse } from "next/server";
import { loadPlanById } from "@/lib/plan-loader";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await loadPlanById(params.id);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[GET /api/recommendations/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
