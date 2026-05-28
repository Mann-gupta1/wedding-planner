import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>
          Step {String(current).padStart(2, "0")} of {String(total).padStart(2, "0")}
        </span>
        {labels?.[current - 1] && <span className="text-gold">{labels[current - 1]}</span>}
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center flex-1 gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-all",
                i + 1 <= current
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            {i < total - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  i + 1 < current ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
