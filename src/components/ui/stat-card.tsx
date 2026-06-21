import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  sublabel?: string;
  accent?: "default" | "success" | "danger" | "warning";
}

const ICON_ACCENT = {
  default: "bg-accent/10 text-accent-strong",
  success: "bg-success-soft/40 text-success",
  danger: "bg-danger-soft/40 text-danger",
  warning: "bg-warning-soft/40 text-warning",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  sublabel,
  accent = "default",
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-subtle">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {sublabel && (
            <p className="mt-1 truncate text-xs text-muted">{sublabel}</p>
          )}
        </div>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            ICON_ACCENT[accent],
          )}
        >
          <Icon className="size-4.5" strokeWidth={2} />
        </span>
      </div>
    </Card>
  );
}
