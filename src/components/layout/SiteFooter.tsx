import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/30 px-4 lg:px-8 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-6xl mx-auto">
        <div>
          <span className="font-serif text-lg text-gold">WeddingBloom</span>
          <p className="text-xs text-muted-foreground mt-1">
            © 2026 WeddingBloom. Crafted for Eternal Elegance.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="#" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="#" className="text-gold hover:text-primary">
            Contact Expert
          </Link>
        </div>
      </div>
    </footer>
  );
}
