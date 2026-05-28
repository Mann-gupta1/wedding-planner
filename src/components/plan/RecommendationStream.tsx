"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TypingText } from "./TypingText";
import { formatINR } from "@/lib/utils";

interface ParsedRec {
  vendor_category: string;
  priority_rank: number;
  suggested_budget_inr: number;
  rationale: string;
}

function tryParseRecommendations(json: string): ParsedRec[] {
  try {
    const parsed = JSON.parse(json) as { recommendations?: ParsedRec[] };
    return parsed.recommendations ?? [];
  } catch {
    return [];
  }
}

interface RecommendationStreamProps {
  onComplete?: () => void;
}

export function RecommendationStream({ onComplete }: RecommendationStreamProps) {
  const [raw, setRaw] = useState("");
  const [items, setItems] = useState<ParsedRec[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("recommend_stream");
    if (stored) setRaw(stored);

    const interval = setInterval(() => {
      const latest = sessionStorage.getItem("recommend_stream") ?? "";
      setRaw(latest);
      const parsed = tryParseRecommendations(latest);
      if (parsed.length > 0) setItems(parsed);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (items.length > 0 && !sessionStorage.getItem("recommend_stream_active")) {
      onComplete?.();
    }
  }, [items, onComplete]);

  if (!raw && items.length === 0) {
    return (
      <div className="space-y-4 grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="card-luxury border-0">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground animate-pulse">
            Generating your personalized budget plan…
          </p>
          <pre className="mt-2 max-h-24 overflow-hidden text-xs text-muted-foreground/50 truncate">
            {raw.slice(-200)}
          </pre>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((rec, idx) => (
        <Card key={`${rec.vendor_category}-${idx}`} className="card-luxury border-primary/20 overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <CardTitle className="text-lg">{rec.vendor_category}</CardTitle>
            <Badge variant="secondary">Priority #{rec.priority_rank}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-semibold text-primary">
              {formatINR(rec.suggested_budget_inr)}
            </p>
            <TypingText text={rec.rationale} className="text-sm text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
