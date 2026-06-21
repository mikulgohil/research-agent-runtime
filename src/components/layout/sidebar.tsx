"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  FileText,
  Settings,
  Hexagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runs", label: "Runs", icon: ListChecks },
  { href: "/tasks/new", label: "New Task", icon: PlusCircle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface/40 md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent-strong">
          <Hexagon className="size-4.5" strokeWidth={2.2} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink">Agent Runtime</div>
          <div className="text-[11px] text-subtle">Research mission control</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Primary">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft/40 text-ink"
                  : "text-muted hover:bg-elevated hover:text-ink",
              )}
            >
              <Icon className="size-4.5" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="rounded-lg border border-line bg-elevated/50 px-3 py-2.5 text-[11px] leading-relaxed text-subtle">
          <span className="font-medium text-muted">Demo mode</span> — running on
          the deterministic mock model. Add an API key to use live Claude.
        </div>
      </div>
    </aside>
  );
}
