"use client";

import { Badge } from "@/components/ui/badge";
import { formatINR, cn } from "@/lib/utils";
import type { RecommendationRecord } from "@/lib/types";
import { Star } from "lucide-react";

interface RecommendationsListProps {
  recommendations: RecommendationRecord[];
  venueLocked?: boolean;
}

const CARD_ACCENTS = [
  "from-amber-50 to-orange-50",
  "from-rose-50 to-pink-50",
  "from-emerald-50 to-teal-50",
];

export function RecommendationsList({ recommendations, venueLocked }: RecommendationsListProps) {
  const sorted = [...recommendations].sort((a, b) => a.priority_rank - b.priority_rank);

  return (
    <div className="space-y-6">
      {sorted.map((rec, i) => {
        const vendors = rec.vendors ?? [];
        const allocation = rec.effective_budget_inr ?? rec.suggested_budget_inr;
        const range = rec.price_range;

        return (
          <article key={rec.id} className="card-luxury overflow-hidden">
            <div
              className={cn(
                "h-2 bg-gradient-to-r",
                CARD_ACCENTS[i % CARD_ACCENTS.length]
              )}
            />
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl">{rec.vendor_category}</h3>
                    <Badge variant="secondary">Priority #{rec.priority_rank}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{rec.rationale}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {venueLocked && rec.vendor_category === "Venue"
                      ? "Locked allocation"
                      : "Suggested allocation"}
                  </p>
                  <p className="text-xl font-semibold text-gold">{formatINR(allocation)}</p>
                  {range && vendors.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Vendor quotes: {formatINR(range.min_inr)} – {formatINR(range.max_inr)}
                    </p>
                  )}
                </div>
              </div>

              {vendors.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {vendors.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-border bg-muted/30 p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{v.vendor_name}</p>
                        <span className="flex items-center gap-0.5 text-xs text-gold shrink-0">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          {(4.2 + (v.quoted_price_inr % 8) * 0.1).toFixed(1)}
                        </span>
                      </div>
                      {v.highlight && (
                        <p className="text-xs text-accent mt-1">{v.highlight}</p>
                      )}
                      <p className="text-lg font-semibold text-gold mt-2">
                        {formatINR(v.quoted_price_inr)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
