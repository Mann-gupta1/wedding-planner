"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RecommendationsList } from "./RecommendationsList";
import { VenuePicker } from "./VenuePicker";
import { RecommendationStream } from "./RecommendationStream";
import { BudgetSummary } from "./BudgetSummary";
import { LogPaymentForm } from "./LogPaymentForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { PlanResponse, PaymentRecord } from "@/lib/types";
import type { BudgetSummary as BudgetSummaryType } from "@/lib/budget";
import { AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { BUDGET_BRACKETS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PlanViewProps {
  planId: string;
  defaultView?: "concierge" | "budget";
}

export function PlanView({ planId, defaultView = "concierge" }: PlanViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isStreaming = searchParams.get("streaming") === "1";
  const viewParam = searchParams.get("view");
  const [view, setView] = useState<"concierge" | "budget">(
    viewParam === "budget" ? "budget" : defaultView
  );

  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStream, setShowStream] = useState(isStreaming);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recommendations/${planId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load plan");
      }
      const data: PlanResponse = await res.json();
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (!showStream) {
      loadPlan();
      return;
    }
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/recommendations/${planId}`);
        if (res.ok) {
          const data: PlanResponse = await res.json();
          if (data.recommendations.length > 0) {
            sessionStorage.removeItem("recommend_stream");
            sessionStorage.removeItem("recommend_stream_active");
            setPlan(data);
            setShowStream(false);
            setLoading(false);
            clearInterval(poll);
          }
        }
      } catch {
        /* keep polling */
      }
    }, 800);
    const timeout = setTimeout(() => {
      clearInterval(poll);
      setShowStream(false);
      loadPlan();
    }, 15000);
    return () => {
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, [showStream, loadPlan, planId]);

  function switchView(v: "concierge" | "budget") {
    setView(v);
    const url = v === "budget" ? `/plan/${planId}?view=budget` : `/plan/${planId}`;
    router.replace(url, { scroll: false });
  }

  function handlePaymentLogged(payment: PaymentRecord, budgetSummary: BudgetSummaryType) {
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        payments: [payment, ...prev.payments],
        budget_summary: budgetSummary,
      };
    });
  }

  if (showStream) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-wider text-accent">AI Concierge</span>
          <h1 className="font-serif text-3xl mt-2">Curating your wedding intelligence…</h1>
        </div>
        <RecommendationStream />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <p className="text-destructive">{error ?? "Plan not found"}</p>
        <Button onClick={loadPlan} variant="gold">
          Try again
        </Button>
      </div>
    );
  }

  const bracketLabel =
    BUDGET_BRACKETS.find((b) => b.id === plan.intake.budget_bracket)?.title ??
    plan.intake.budget_bracket;

  const venueVendors =
    plan.recommendations.find((r) => r.vendor_category === "Venue")?.vendors ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full mb-3">
            <Sparkles className="h-3 w-3" />
            AI-Powered Concierge
          </span>
          <h1 className="font-serif text-3xl md:text-4xl">
            {view === "budget" ? (
              <>
                Budget <span className="text-gold italic">Tracker</span>
              </>
            ) : (
              <>
                Curated Wedding <span className="text-gold italic">Intelligence</span>
              </>
            )}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            {plan.intake.city} · {plan.intake.venue_type} · {plan.intake.guest_count} guests ·{" "}
            {bracketLabel} ({formatINR(plan.intake.budget_inr)})
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "concierge" ? "gold" : "outline"}
            size="sm"
            onClick={() => switchView("concierge")}
          >
            AI Concierge
          </Button>
          <Button
            variant={view === "budget" ? "gold" : "outline"}
            size="sm"
            onClick={() => switchView("budget")}
          >
            Budget Tracker
          </Button>
          <Link href="/intake">
            <Button variant="teal" size="sm">
              <RefreshCw className="h-4 w-4" />
              New plan
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b border-border pb-2 lg:hidden">
        {(["concierge", "budget"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => switchView(v)}
            className={cn(
              "px-4 py-2 text-sm rounded-lg capitalize",
              view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {v === "concierge" ? "AI Concierge" : "Budget"}
          </button>
        ))}
      </div>

      {plan.vendors_table_ready === false && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Database migration needed</p>
          <p className="mt-1">
            Run <code className="bg-white px-1 rounded">supabase/migrations/002_vendors_and_venue_lock.sql</code>{" "}
            in Supabase SQL Editor, then submit a new intake to save vendor quotes and lock venue budget.
          </p>
        </div>
      )}

      {view === "concierge" ? (
        <section className="space-y-8">
          <VenuePicker
            planId={planId}
            vendors={venueVendors}
            locked={plan.venue_locked}
            selectedVendorId={plan.intake.selected_venue_vendor_id}
            vendorsTableReady={plan.vendors_table_ready !== false}
            onLocked={(updated) => setPlan(updated)}
          />
          <div>
            <h2 className="font-serif text-2xl mb-2">Vendor options by category</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Priorities: {plan.intake.priorities.join(" · ")} · Each category shows 2–3 quotes based
              on your guest count and budget.
            </p>
            <RecommendationsList
              recommendations={plan.recommendations}
              venueLocked={plan.venue_locked}
            />
          </div>
        </section>
      ) : (
        <section className="space-y-8">
          <BudgetSummary
            budgetSummary={plan.budget_summary}
            recommendations={plan.recommendations}
            payments={plan.payments}
          />
          <LogPaymentForm
            intakeId={planId}
            recommendations={plan.recommendations}
            onPaymentLogged={handlePaymentLogged}
          />
        </section>
      )}
    </div>
  );
}
