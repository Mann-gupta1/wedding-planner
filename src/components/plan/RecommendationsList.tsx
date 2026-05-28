"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { RecommendationRecord } from "@/lib/types";
import { Calendar, MessageCircle, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationsListProps {
  recommendations: RecommendationRecord[];
}

const CARD_GRADIENTS = [
  "from-amber-950/80 to-zinc-900",
  "from-emerald-950/80 to-zinc-900",
  "from-violet-950/80 to-zinc-900",
];

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const sorted = [...recommendations].sort((a, b) => a.priority_rank - b.priority_rank);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map((rec, i) => {
        const match = Math.max(88, 99 - rec.priority_rank * 2);
        const badge =
          rec.priority_rank === 1
            ? { label: `${match}% Match`, variant: "default" as const }
            : rec.priority_rank === 2
              ? { label: "Rare Selection", variant: "secondary" as const }
              : { label: "Trending", variant: "outline" as const };

        return (
          <article
            key={rec.id}
            className="card-luxury overflow-hidden flex flex-col group hover:shadow-gold transition-shadow"
          >
            <div
              className={cn(
                "h-36 bg-gradient-to-br relative",
                CARD_GRADIENTS[i % CARD_GRADIENTS.length]
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(43_74%_52%/0.2),transparent)]" />
              <Badge
                className={cn(
                  "absolute top-3 right-3",
                  badge.variant === "default" && "bg-primary text-primary-foreground"
                )}
                variant={badge.variant}
              >
                {badge.label}
              </Badge>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-lg">{rec.vendor_category}</h3>
                <span className="flex items-center gap-1 text-sm text-gold shrink-0">
                  <Star className="h-3.5 w-3.5 fill-primary" />
                  {(4.5 + (5 - rec.priority_rank) * 0.1).toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex-1 line-clamp-3">{rec.rationale}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Suggested allocation</p>
                  <p className="font-semibold text-gold">{formatINR(rec.suggested_budget_inr)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="rounded-full h-9 w-9">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-full h-9 w-9">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function RecommendationsListCompact({
  recommendations,
}: RecommendationsListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {recommendations.slice(0, 4).map((rec) => (
        <div key={rec.id} className="card-luxury p-4 flex justify-between items-center">
          <div>
            <p className="font-medium">{rec.vendor_category}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-accent" />
              Optimal range
            </p>
          </div>
          <p className="text-gold font-semibold">{formatINR(rec.suggested_budget_inr)}</p>
        </div>
      ))}
    </div>
  );
}
