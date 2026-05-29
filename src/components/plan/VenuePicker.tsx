"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatINR, cn } from "@/lib/utils";
import type { PlanResponse, VendorSuggestionRecord } from "@/lib/types";
import { Check, Lock, MapPin } from "lucide-react";

interface VenuePickerProps {
  planId: string;
  vendors: VendorSuggestionRecord[];
  locked: boolean;
  selectedVendorId: string | null;
  onLocked: (plan: PlanResponse) => void;
}

export function VenuePicker({
  planId,
  vendors,
  locked,
  selectedVendorId,
  onLocked,
}: VenuePickerProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prices = vendors.map((v) => v.quoted_price_inr);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;

  async function selectVenue(vendorId: string) {
    if (locked) return;
    setLoading(vendorId);
    setError(null);
    try {
      const res = await fetch("/api/select-venue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_id: planId, vendor_suggestion_id: vendorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to select venue");
      onLocked(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (vendors.length === 0) return null;

  return (
    <div className="card-luxury p-6 space-y-4 border-primary/30">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-xl">Pick your venue first</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compare 2–3 venue options. Your exact budget locks only after you finalize one.
          </p>
          {prices.length > 0 && (
            <p className="text-sm font-medium text-gold mt-2">
              Suggested venue range: {formatINR(min)} – {formatINR(max)}
            </p>
          )}
        </div>
        {locked && (
          <span className="ml-auto flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full shrink-0">
            <Lock className="h-3 w-3" />
            Budget locked
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {vendors.map((v) => {
          const isSelected = selectedVendorId === v.id;
          return (
            <div
              key={v.id}
              className={cn(
                "rounded-xl border p-4 transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border bg-white hover:border-primary/40"
              )}
            >
              <p className="font-semibold">{v.vendor_name}</p>
              {v.highlight && (
                <p className="text-xs text-accent mt-1 font-medium">{v.highlight}</p>
              )}
              <p className="text-xl font-serif text-gold mt-3">{formatINR(v.quoted_price_inr)}</p>
              <Button
                variant={isSelected ? "gold" : "outline"}
                size="sm"
                className="w-full mt-4"
                disabled={locked && !isSelected}
                onClick={() => selectVenue(v.id)}
              >
                {loading === v.id ? (
                  "Saving…"
                ) : isSelected ? (
                  <>
                    <Check className="h-4 w-4" />
                    Selected
                  </>
                ) : locked ? (
                  "Locked"
                ) : (
                  "Select this venue"
                )}
              </Button>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {locked && (
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          Remaining budget for other categories has been recalculated based on your venue choice.
        </p>
      )}
    </div>
  );
}
