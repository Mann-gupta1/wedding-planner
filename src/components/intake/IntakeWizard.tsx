"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepIndicator } from "@/components/ui/StepIndicator";
import {
  BUDGET_BRACKETS,
  PRIORITY_OPTIONS,
  VENUE_TYPES,
  WEDDING_VIBES,
  POPULAR_CITIES,
} from "@/lib/constants";
import { validateWeddingDate } from "@/lib/validators/intake";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Gem,
  Castle,
  PartyPopper,
} from "lucide-react";

const STEPS = ["Date & guests", "Location & vibe", "Budget & priorities", "Review"];
const TOTAL_STEPS = STEPS.length;

const BUDGET_ICONS = [PartyPopper, Gem, Castle, Gem, Castle];

export interface IntakeFormData {
  wedding_date: string;
  guest_count: string;
  city: string;
  venue_type: string;
  budget_bracket: string;
  priorities: string[];
  vibe: string;
}

const initialData: IntakeFormData = {
  wedding_date: "",
  guest_count: "150",
  city: "",
  venue_type: "",
  budget_bracket: "",
  priorities: [],
  vibe: "nocturnal",
};

export function IntakeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const guestNum = Number(data.guest_count) || 150;

  function validateStep(): boolean {
    const next: Record<string, string> = {};

    if (step === 0) {
      if (!data.wedding_date) next.wedding_date = "Wedding date is required";
      else {
        const dateErr = validateWeddingDate(data.wedding_date);
        if (dateErr) next.wedding_date = dateErr;
      }
      const guests = Number(data.guest_count);
      if (!data.guest_count) next.guest_count = "Guest count is required";
      else if (isNaN(guests) || guests < 50) next.guest_count = "Minimum 50 guests";
      else if (guests > 5000) next.guest_count = "Maximum 5000 guests";
    }

    if (step === 1) {
      if (!data.city.trim()) next.city = "City is required";
      if (!data.venue_type) next.venue_type = "Select a venue vibe";
    }

    if (step === 2) {
      if (!data.budget_bracket) next.budget_bracket = "Select a budget bracket";
      if (data.priorities.length !== 2) next.priorities = "Select exactly 2 priorities";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function nextStep() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function prevStep() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  function togglePriority(priority: string) {
    setData((d) => {
      const selected = d.priorities.includes(priority)
        ? d.priorities.filter((p) => p !== priority)
        : d.priorities.length < 2
          ? [...d.priorities, priority]
          : d.priorities;
      return { ...d, priorities: selected };
    });
    setErrors((e) => ({ ...e, priorities: "" }));
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      wedding_date: data.wedding_date,
      guest_count: Number(data.guest_count),
      city: data.city.trim(),
      venue_type: data.venue_type,
      budget_bracket: data.budget_bracket,
      priorities: data.priorities,
    };

    try {
      const res = await fetch("/api/recommend?stream=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to generate plan");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let planId: string | null = null;
      let streamContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6)) as {
            type: string;
            chunk?: string;
            id?: string;
            message?: string;
          };
          if (event.type === "token" && event.chunk) {
            streamContent += event.chunk;
            sessionStorage.setItem("recommend_stream", streamContent);
          }
          if (event.type === "done" && event.id) planId = event.id;
          if (event.type === "error") throw new Error(event.message ?? "Stream failed");
        }
      }

      if (!planId) throw new Error("No plan ID returned");
      sessionStorage.setItem("recommend_stream_active", "1");
      router.push(`/plan/${planId}?streaming=1`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const selectedBracket = BUDGET_BRACKETS.find((b) => b.id === data.budget_bracket);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <StepIndicator current={step + 1} total={TOTAL_STEPS} labels={STEPS} />

      <div className="mt-10 mb-8 text-center max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-3">
          {step === 0 && "Tell us about your big day"}
          {step === 1 && "Where is the celebration?"}
          {step === 2 && (
            <>
              <span className="text-gold">Budget</span> & Priorities
            </>
          )}
          {step === 3 && "Ready to craft your blueprint"}
        </h1>
        <p className="text-muted-foreground">
          {step === 0 &&
            "Every love story is unique. Share your vision so our AI Concierge can curate your bespoke wedding blueprint."}
          {step === 1 &&
            "From royal palaces in Rajasthan to serene beaches in Goa — we'll find the perfect backdrop."}
          {step === 2 &&
            "Define your financial comfort zone and rank what matters most for intelligent allocation."}
          {step === 3 && "Review once more, then let AI build your personalized plan."}
        </p>
      </div>

      {step === 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-luxury p-6 space-y-4">
            <Label className="text-gold text-xs uppercase tracking-wider">The Grand Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                className="pl-10 h-12 bg-secondary/50"
                value={data.wedding_date}
                onChange={(e) => setData({ ...data, wedding_date: e.target.value })}
              />
            </div>
            {errors.wedding_date && <p className="text-sm text-destructive">{errors.wedding_date}</p>}
            <p className="text-xs text-muted-foreground italic">
              We recommend booking venues 9–12 months in advance for peak season.
            </p>
          </div>

          <div className="card-luxury p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-gold text-xs uppercase tracking-wider">Guest List Size</Label>
              <span className="text-2xl font-serif text-gold">{guestNum}</span>
            </div>
            <p className="text-xs text-muted-foreground">Estimated attendees</p>
            <input
              type="range"
              min={50}
              max={500}
              step={10}
              value={Math.min(500, Math.max(50, guestNum))}
              onChange={(e) => setData({ ...data, guest_count: e.target.value })}
              className="w-full accent-primary h-2 rounded-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Intimate (50)</span>
              <span>Grand (500+)</span>
            </div>
            {errors.guest_count && <p className="text-sm text-destructive">{errors.guest_count}</p>}
          </div>

          <div className="card-luxury p-6 lg:col-span-2 space-y-4">
            <Label className="text-gold text-xs uppercase tracking-wider">Desired Vibe</Label>
            <div className="flex flex-wrap gap-2">
              {WEDDING_VIBES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setData({ ...data, vibe: v.id })}
                  className={cn(
                    "chip-vibe flex items-center gap-2",
                    data.vibe === v.id && "chip-vibe-active"
                  )}
                >
                  <span>{v.icon}</span>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card-luxury lg:col-span-2 h-48 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-end p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(43_74%_52%/0.15),transparent_50%)]" />
            <p className="text-xs uppercase tracking-[0.3em] text-gold relative z-10">Crafting memories</p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8">
          <div className="card-luxury p-6 space-y-4 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for a city or region..."
                className="pl-12 h-14 text-base bg-secondary/50 rounded-2xl"
                value={data.city}
                onChange={(e) => setData({ ...data, city: e.target.value })}
              />
              <MapPin className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            </div>
            {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground mr-2">Popular:</span>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setData({ ...data, city: c })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    data.city === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-xl mb-4 text-center">Select your Venue Vibe</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {VENUE_TYPES.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setData({ ...data, venue_type: v.name })}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border-2 text-left transition-all aspect-[4/5] max-h-72",
                    data.venue_type === v.name
                      ? "border-primary shadow-gold"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-t", v.gradient)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                      {v.tagline}
                    </span>
                    <p className="font-serif text-xl mt-1">{v.name}</p>
                  </div>
                </button>
              ))}
            </div>
            {errors.venue_type && (
              <p className="text-sm text-destructive text-center mt-2">{errors.venue_type}</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-accent flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Intake step 3
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {BUDGET_BRACKETS.map((b, i) => {
                const Icon = BUDGET_ICONS[i] ?? Gem;
                const selected = data.budget_bracket === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setData({ ...data, budget_bracket: b.id })}
                    className={cn(
                      "card-luxury p-5 text-left relative transition-all",
                      selected && "ring-2 ring-primary shadow-gold"
                    )}
                  >
                    {b.popular && (
                      <span className="absolute top-3 right-3 text-[10px] uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                        Most popular
                      </span>
                    )}
                    <Icon className="h-6 w-6 text-primary mb-3" />
                    <p className="font-serif text-lg">{b.title}</p>
                    <p className="text-gold text-sm font-medium mt-1">{b.label}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{b.description}</p>
                  </button>
                );
              })}
            </div>
            {errors.budget_bracket && (
              <p className="text-sm text-destructive">{errors.budget_bracket}</p>
            )}
          </div>

          <div className="card-luxury p-6 space-y-4">
            <h3 className="font-serif text-xl">Priority ranking</h3>
            <p className="text-sm text-muted-foreground italic">
              Select your top 2 priorities (we weight budget toward these)
            </p>
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map((p) => {
                const rank = data.priorities.indexOf(p);
                const selected = rank >= 0;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePriority(p)}
                    disabled={!selected && data.priorities.length >= 2}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                      selected
                        ? "border-primary/60 bg-primary/5"
                        : "border-border hover:border-border/80 opacity-80",
                      !selected && data.priorities.length >= 2 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                        selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {selected ? `0${rank + 1}` : "—"}
                    </span>
                    <span className="font-medium">{p}</span>
                  </button>
                );
              })}
            </div>
            {errors.priorities && <p className="text-sm text-destructive">{errors.priorities}</p>}
          </div>
        </div>
      )}

      {step === 3 && selectedBracket && (
        <div className="card-luxury p-8 max-w-xl mx-auto space-y-4 text-sm">
          <h3 className="font-serif text-2xl text-center mb-6">Your blueprint summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <span className="text-muted-foreground">Date</span>
            <span>{data.wedding_date}</span>
            <span className="text-muted-foreground">Guests</span>
            <span>{data.guest_count}</span>
            <span className="text-muted-foreground">City</span>
            <span>{data.city}</span>
            <span className="text-muted-foreground">Venue</span>
            <span>{data.venue_type}</span>
            <span className="text-muted-foreground">Budget</span>
            <span className="text-gold">{selectedBracket.title} ({selectedBracket.label})</span>
            <span className="text-muted-foreground">Priorities</span>
            <span>{data.priorities.join(", ")}</span>
            <span className="text-muted-foreground">Vibe</span>
            <span>{WEDDING_VIBES.find((v) => v.id === data.vibe)?.label}</span>
          </div>
          {submitError && (
            <p className="rounded-lg bg-destructive/10 p-3 text-destructive text-center">{submitError}</p>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 border-t border-border bg-background/95 backdrop-blur p-4 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {step === 0 ? (
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Welcome
            </Link>
          ) : (
            <Button variant="ghost" onClick={prevStep} disabled={submitting}>
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? "Back to details" : step === 2 ? "Back to location" : "Back"}
            </Button>
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Button variant="gold" size="lg" onClick={nextStep}>
              Continue to {STEPS[step + 1]}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="gold" size="lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Curating your plan…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Launch AI Concierge
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
