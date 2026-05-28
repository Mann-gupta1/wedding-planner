"use client";

import { Progress } from "@/components/ui/progress";
import { BudgetDonut } from "./BudgetDonut";
import { formatINR, cn } from "@/lib/utils";
import type { BudgetSummary as BudgetSummaryType } from "@/lib/budget";
import type { RecommendationRecord, PaymentRecord } from "@/lib/types";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface BudgetSummaryProps {
  budgetSummary: BudgetSummaryType;
  recommendations: RecommendationRecord[];
  payments: PaymentRecord[];
}

const DONUT_COLORS = ["hsl(43 74% 52%)", "hsl(168 45% 38%)", "hsl(0 0% 35%)", "hsl(280 40% 45%)"];

export function BudgetSummary({ budgetSummary, recommendations, payments }: BudgetSummaryProps) {
  const { total_budget_inr, total_spent_inr, remaining_inr, category_balances } = budgetSummary;
  const allocated = recommendations.reduce((s, r) => s + r.suggested_budget_inr, 0);
  const allocatedPct = Math.min(100, (allocated / total_budget_inr) * 100);
  const spentPercent = Math.min(100, (total_spent_inr / total_budget_inr) * 100);

  const topSlices = [...recommendations]
    .sort((a, b) => b.suggested_budget_inr - a.suggested_budget_inr)
    .slice(0, 3);
  const othersSum =
    recommendations.reduce((s, r) => s + r.suggested_budget_inr, 0) -
    topSlices.reduce((s, r) => s + r.suggested_budget_inr, 0);

  const donutSlices = [
    ...topSlices.map((r, i) => ({
      label: r.vendor_category,
      value: r.suggested_budget_inr,
      color: DONUT_COLORS[i] ?? DONUT_COLORS[3],
    })),
    ...(othersSum > 0 ? [{ label: "Others", value: othersSum, color: DONUT_COLORS[2] }] : []),
  ];

  const sorted = [...recommendations].sort((a, b) => a.priority_rank - b.priority_rank);
  const overBudget = Object.values(category_balances).filter((c) => c.balance < 0).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="card-luxury p-8">
          <h3 className="font-serif text-xl mb-6">Visualize the balance</h3>
          <BudgetDonut total={total_budget_inr} slices={donutSlices} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-luxury p-6 flex flex-col items-center justify-center text-center">
            <div className="relative h-24 w-24 mb-3">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray={`${allocatedPct} 100`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gold">
                {allocatedPct.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground uppercase">Allocated</p>
          </div>
          <div className="card-luxury p-6">
            <p className="text-xs text-muted-foreground uppercase mb-2">Total budget</p>
            <p className="font-serif text-2xl text-gold">{formatINR(total_budget_inr)}</p>
          </div>
          <div className="card-luxury p-6">
            <p className="text-xs text-muted-foreground uppercase mb-2">Remaining</p>
            <p
              className={cn(
                "font-serif text-2xl",
                remaining_inr < 0 ? "text-destructive" : "text-gold"
              )}
            >
              {formatINR(remaining_inr)}
            </p>
            <Progress value={spentPercent} className="mt-3" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Spending by category</h3>
            <span className="text-sm text-gold">Manage categories</span>
          </div>
          <div className="space-y-3">
            {sorted.map((rec) => {
              const balance = category_balances[rec.vendor_category] ?? {
                allocated: rec.suggested_budget_inr,
                spent: 0,
                balance: rec.suggested_budget_inr,
              };
              const pct =
                balance.allocated > 0
                  ? Math.min(100, (balance.spent / balance.allocated) * 100)
                  : 0;

              return (
                <div key={rec.id} className="card-luxury p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center text-gold font-serif text-lg shrink-0">
                    {rec.vendor_category.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="font-medium">{rec.vendor_category}</p>
                      <p className="text-gold font-semibold shrink-0">
                        {formatINR(balance.spent)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Allocated: {formatINR(balance.allocated)} · {pct.toFixed(0)}% utilized
                    </p>
                    <Progress value={pct} className="mt-2 h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-xl">Payment health</h3>
          <div className="card-luxury p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold text-gold">
                {payments.length > 0 ? "94%" : "—"}
              </p>
              <p className="text-xs text-muted-foreground">On-time payments</p>
            </div>
          </div>
          <div className="card-luxury p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-2xl font-bold">{Math.max(0, recommendations.length - payments.length)}</p>
              <p className="text-xs text-muted-foreground">Pending deposits</p>
            </div>
          </div>
          <div className="card-luxury p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive shrink-0" />
            <div>
              <p className="text-2xl font-bold">{overBudget}</p>
              <p className="text-xs text-muted-foreground">Over-budget items</p>
            </div>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="text-gold font-medium">Pro Tip</p>
            <p className="text-muted-foreground mt-1">
              Pay venue deposits early to unlock better vendor negotiation leverage.
            </p>
          </div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="card-luxury overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-serif text-lg">Payment history</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left border-b border-border">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Vendor</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-4">{p.paid_on}</td>
                    <td className="p-4 font-medium">{p.vendor_name}</td>
                    <td className="p-4 text-muted-foreground">{p.vendor_category}</td>
                    <td className="p-4 text-right text-gold font-semibold">
                      {formatINR(p.amount_inr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
