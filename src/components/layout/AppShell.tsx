"use client";

import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { SiteFooter } from "./SiteFooter";

export type NavSection = "intake" | "concierge" | "budget" | "guests" | "vendors";

interface AppShellProps {
  children: React.ReactNode;
  activeNav: NavSection;
  planId?: string;
  topNavActive?: "dashboard" | "planning" | "budget" | "gallery";
}

export function AppShell({ children, activeNav, planId, topNavActive = "planning" }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar activeNav={activeNav} planId={planId} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav active={topNavActive} />
        <main className="flex-1 overflow-auto">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
