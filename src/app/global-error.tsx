"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global app error:", error);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="card-luxury max-w-lg w-full p-8 text-center space-y-4">
          <p className="text-xs uppercase tracking-wider text-accent">Critical error</p>
          <h1 className="font-serif text-3xl">Application crashed</h1>
          <p className="text-sm text-muted-foreground">
            Refresh the page or restart the dev server if this keeps happening.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="gold" onClick={reset}>
              Retry
            </Button>
            <Link href="/">
              <Button variant="outline">Go home</Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

