import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, IndianRupee, Camera, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-serif text-2xl text-gold">WeddingBloom</span>
          <nav className="hidden md:flex gap-8 text-sm text-muted-foreground">
            <Link href="/intake" className="hover:text-foreground">
              Planning
            </Link>
            <Link href="/intake" className="hover:text-foreground">
              Budget
            </Link>
          </nav>
          <Link href="/intake">
            <Button variant="gold" size="lg">
              Begin intake
            </Button>
          </Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">Nocturnal Elegance</p>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight mb-6">
          Craft your <span className="text-gold italic">eternal</span> celebration
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          AI-powered budget intelligence, curated vendor insights, and real-time payment tracking —
          designed for modern Indian weddings.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/intake">
            <Button variant="gold" size="xl" className="min-w-[220px]">
              Start planning
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/intake">
            <Button variant="outline" size="xl">
              Explore features
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-3xl text-left">
          {[
            {
              icon: Sparkles,
              title: "AI Concierge",
              desc: "Personalized vendor categories with budget allocation in ₹.",
            },
            {
              icon: IndianRupee,
              title: "Budget Tracker",
              desc: "Visualize spend by category and log payments in real time.",
            },
            {
              icon: Camera,
              title: "Priority-first",
              desc: "Your top 2 priorities get heavier budget weighting.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-luxury p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 WeddingBloom · Crafted for Eternal Elegance
      </footer>
    </main>
  );
}
