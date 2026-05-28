"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BudgetSummary } from "@/lib/budget";
import type { PaymentRecord, RecommendationRecord } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";

interface LogPaymentFormProps {
  intakeId: string;
  recommendations: RecommendationRecord[];
  onPaymentLogged: (payment: PaymentRecord, budgetSummary: BudgetSummary) => void;
}

export function LogPaymentForm({ intakeId, recommendations, onPaymentLogged }: LogPaymentFormProps) {
  const [vendorCategory, setVendorCategory] = useState(recommendations[0]?.vendor_category ?? "");
  const [vendorName, setVendorName] = useState("");
  const [amountInr, setAmountInr] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = Array.from(new Set(recommendations.map((r) => r.vendor_category)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake_id: intakeId,
          vendor_category: vendorCategory,
          vendor_name: vendorName,
          amount_inr: Number(amountInr),
          paid_on: paidOn,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to log payment");

      onPaymentLogged(data.payment, data.budget_summary);
      setVendorName("");
      setAmountInr("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-luxury p-6">
      <h3 className="font-serif text-xl flex items-center gap-2 mb-6">
        <Plus className="h-5 w-5 text-primary" />
        Add expense
      </h3>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Vendor category
          </Label>
          <select
            value={vendorCategory}
            onChange={(e) => setVendorCategory(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-input bg-secondary/50 px-3 text-sm"
            required
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Vendor name
          </Label>
          <Input
            placeholder="e.g. Royal Caterers"
            className="h-11 bg-secondary/50 rounded-xl"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
          <Input
            type="number"
            min={1}
            placeholder="50000"
            className="h-11 bg-secondary/50 rounded-xl"
            value={amountInr}
            onChange={(e) => setAmountInr(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date paid</Label>
          <Input
            type="date"
            className="h-11 bg-secondary/50 rounded-xl"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" variant="gold" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Log payment"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
