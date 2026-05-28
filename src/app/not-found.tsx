import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card-luxury max-w-lg w-full p-8 text-center space-y-4">
        <p className="text-xs uppercase tracking-wider text-accent">404</p>
        <h1 className="font-serif text-3xl">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This route does not exist or is temporarily unavailable.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="gold">Back to home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

