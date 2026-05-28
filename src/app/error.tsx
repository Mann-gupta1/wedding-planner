"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card-luxury max-w-lg w-full p-8 text-center space-y-4">
        <p className="text-xs uppercase tracking-wider text-accent">Something went wrong</p>
        <h1 className="font-serif text-3xl">Unable to load this page</h1>
        <p className="text-sm text-muted-foreground">
          Please retry. If the issue persists, go back to the intake flow.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="gold" onClick={reset}>
            Try again
          </Button>
          <Link href="/intake">
            <Button variant="outline">Go to intake</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

