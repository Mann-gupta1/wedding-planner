"use client";

import Link from "next/link";
import {
  ClipboardList,
  Sparkles,
  Wallet,
  Users,
  Store,
  HeadphonesIcon,
  LogOut,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection } from "./AppShell";
import { Button } from "@/components/ui/button";

const NAV: Array<{
  id: NavSection;
  label: string;
  icon: typeof ClipboardList;
  href: (id?: string) => string;
  disabled?: boolean;
}> = [
  { id: "intake", label: "Intake Form", icon: ClipboardList, href: () => "/intake" },
  { id: "concierge", label: "AI Concierge", icon: Sparkles, href: (id) => (id ? `/plan/${id}` : "/intake") },
  { id: "budget", label: "Budget Tracker", icon: Wallet, href: (id) => (id ? `/plan/${id}?view=budget` : "/intake") },
  { id: "guests", label: "Guest List", icon: Users, href: () => "#", disabled: true },
  { id: "vendors", label: "Vendor Hub", icon: Store, href: () => "#", disabled: true },
];

interface SidebarProps {
  activeNav: NavSection;
  planId?: string;
}

export function Sidebar({ activeNav, planId }: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 shrink-0">
      <div className="p-6 border-b border-border">
        <Link href="/" className="block">
          <span className="font-serif text-2xl text-gold tracking-tight">WeddingBloom</span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Nocturnal Elegance
          </p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          const href = item.href(planId);
          const disabled = item.disabled;

          if (disabled) {
            return (
              <span
                key={item.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground/50 cursor-not-allowed"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                isActive
                  ? "bg-primary text-primary-foreground font-medium gold-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-3 border-t border-border">
        <Button className="w-full gold-glow font-semibold" size="lg">
          <Crown className="h-4 w-4" />
          Upgrade to Premium
        </Button>
        <Link
          href="#"
          className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <HeadphonesIcon className="h-4 w-4" />
          Support
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
