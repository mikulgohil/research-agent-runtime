import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type Tone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "active";

const TONES: Record<Tone, string> = {
  neutral: "bg-elevated text-muted border-line-strong",
  accent: "bg-accent-soft/50 text-accent-strong border-accent/40",
  success: "bg-success-soft/50 text-success border-success/40",
  warning: "bg-warning-soft/50 text-warning border-warning/40",
  danger: "bg-danger-soft/50 text-danger border-danger/40",
  info: "bg-info-soft/50 text-info border-info/40",
  active: "bg-active-soft/50 text-active border-active/40",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  tone = "neutral",
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full bg-current",
            pulse && "animate-pulse-dot",
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
