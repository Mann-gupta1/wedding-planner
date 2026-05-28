"use client";

import Link from "next/link";
import { Bell, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const LINKS = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "planning", label: "Planning", href: "/intake" },
  { id: "budget", label: "Budget", href: "/intake" },
  { id: "gallery", label: "Gallery", href: "#" },
] as const;

interface TopNavProps {
  active: (typeof LINKS)[number]["id"];
}

export function TopNav({ active }: TopNavProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <Link href="/" className="lg:hidden font-serif text-xl text-gold">
          WeddingBloom
        </Link>

        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors pb-1 border-b-2",
                active === link.id
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden sm:flex relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search insights..."
              className="w-48 pl-9 h-9 bg-secondary/50 border-border/60 lg:w-56"
            />
          </div>
          <button type="button" className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
            <Bell className="h-5 w-5" />
          </button>
          <button type="button" className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
            <Settings className="h-5 w-5" />
          </button>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/80 to-accent ring-2 ring-primary/30" />
        </div>
      </div>
    </header>
  );
}
