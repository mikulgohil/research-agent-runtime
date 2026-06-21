"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, PlusCircle, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runs", label: "Runs", icon: ListChecks },
  { href: "/tasks/new", label: "New", icon: PlusCircle },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  return (
    <header className="flex items-center justify-between border-b border-line bg-surface/60 px-4 py-3 backdrop-blur-sm md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent-strong">
          <Hexagon className="size-4" strokeWidth={2.2} />
        </span>
        <span className="text-sm font-semibold">Agent Runtime</span>
      </Link>
      <nav className="flex items-center gap-1" aria-label="Primary mobile">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "rounded-lg p-2 transition-colors",
                active ? "bg-accent-soft/40 text-ink" : "text-muted",
              )}
            >
              <Icon className="size-5" />
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
