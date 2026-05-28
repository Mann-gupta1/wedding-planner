import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PlanView } from "@/components/plan/PlanView";
import { Skeleton } from "@/components/ui/skeleton";

function PlanFallback() {
  return (
    <div className="p-8 space-y-4 max-w-6xl">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export default function PlanPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { view?: string };
}) {
  const isBudget = searchParams.view === "budget";

  return (
    <AppShell
      activeNav={isBudget ? "budget" : "concierge"}
      planId={params.id}
      topNavActive={isBudget ? "budget" : "planning"}
    >
      <Suspense fallback={<PlanFallback />}>
        <PlanView planId={params.id} defaultView={isBudget ? "budget" : "concierge"} />
      </Suspense>
    </AppShell>
  );
}
