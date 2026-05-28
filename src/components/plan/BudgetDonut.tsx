"use client";

import { formatINR } from "@/lib/utils";

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface BudgetDonutProps {
  total: number;
  slices: Slice[];
}

export function BudgetDonut({ total, slices }: BudgetDonutProps) {
  const sum = slices.reduce((s, x) => s + x.value, 0) || 1;
  let cumulative = 0;
  const gradientParts = slices.map((slice) => {
    const pct = (slice.value / sum) * 100;
    const start = cumulative;
    cumulative += pct;
    return `${slice.color} ${start}% ${cumulative}%`;
  });

  const gradient =
    gradientParts.length > 0
      ? `conic-gradient(${gradientParts.join(", ")})`
      : "conic-gradient(hsl(43 74% 52%) 0% 100%)";

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative h-44 w-44 shrink-0">
        <div
          className="h-full w-full rounded-full"
          style={{ background: gradient }}
        />
        <div className="absolute inset-4 rounded-full bg-card flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
          <span className="font-serif text-lg text-gold leading-tight">{formatINR(total)}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-medium ml-auto">{Math.round((s.value / sum) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
