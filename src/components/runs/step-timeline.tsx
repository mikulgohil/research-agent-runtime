import {
  Circle,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import type { AgentStep, StepStatus } from "@/lib/agent-runtime/types";
import { cn, formatCost, formatDuration, formatTokens } from "@/lib/utils";

const STATUS_ICON: Record<StepStatus, { icon: LucideIcon; cls: string; spin?: boolean }> = {
  pending: { icon: Circle, cls: "text-subtle" },
  running: { icon: LoaderCircle, cls: "text-active", spin: true },
  completed: { icon: CheckCircle2, cls: "text-success" },
  failed: { icon: XCircle, cls: "text-danger" },
  skipped: { icon: MinusCircle, cls: "text-subtle" },
};

function StepNode({ step, isLast }: { step: AgentStep; isLast: boolean }) {
  const meta = STATUS_ICON[step.status];
  const Icon = step.kind === "human_review" && step.status === "running"
    ? UserCheck
    : meta.icon;
  const active = step.status === "running";

  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {!isLast && (
        <span
          className="absolute top-6 left-[11px] h-[calc(100%-1rem)] w-px bg-line"
          aria-hidden
        />
      )}
      <span className="relative z-10 mt-0.5 shrink-0">
        <Icon
          className={cn(
            "size-[22px]",
            meta.cls,
            meta.spin && "motion-safe:animate-spin",
          )}
          strokeWidth={2}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-sm font-medium",
              active ? "text-ink" : "text-muted",
              step.status === "completed" && "text-ink",
            )}
          >
            {step.name}
          </span>
          {step.kind === "human_review" && (
            <span className="rounded bg-warning-soft/40 px-1.5 py-0.5 text-[10px] font-medium text-warning">
              human gate
            </span>
          )}
          {step.retryCount > 0 && (
            <span className="text-[11px] text-warning">
              {step.retryCount} retr{step.retryCount === 1 ? "y" : "ies"}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-subtle">{step.description}</p>

        {(step.status === "completed" || step.status === "failed") && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-subtle tabular-nums">
            <span>{formatDuration(step.startedAt, step.completedAt)}</span>
            {step.tokenUsage > 0 && <span>{formatTokens(step.tokenUsage)} tok</span>}
            {step.costUsd > 0 && <span>{formatCost(step.costUsd)}</span>}
          </div>
        )}

        {step.error && (
          <p className="mt-1.5 rounded-md bg-danger-soft/30 px-2 py-1 text-xs text-danger">
            {step.error}
          </p>
        )}

        {step.output && step.kind === "agent" && (
          <details className="group mt-2">
            <summary className="cursor-pointer text-[11px] font-medium text-accent-strong hover:underline">
              View notes
            </summary>
            <pre className="mt-1.5 overflow-x-auto rounded-md border border-line bg-canvas/60 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted">
              {step.output}
            </pre>
          </details>
        )}
      </div>
    </li>
  );
}

export function StepTimeline({ steps }: { steps: AgentStep[] }) {
  return (
    <ol className="px-1">
      {steps.map((step, i) => (
        <StepNode key={step.id} step={step} isLast={i === steps.length - 1} />
      ))}
    </ol>
  );
}
