import Link from "next/link";
import { ChevronRight, Coins, Clock, ListTree } from "lucide-react";
import type { RunSummary } from "@/lib/agent-runtime/types";
import { OUTPUT_FORMAT_LABELS } from "@/lib/agent-runtime/types";
import { RunStatusBadge } from "@/components/ui/status-badge";
import {
  cn,
  formatCost,
  formatDateTime,
  formatDuration,
  formatTokens,
} from "@/lib/utils";

function RunRow({ summary }: { summary: RunSummary }) {
  const { run, task, stepCount, completedSteps } = summary;
  const progress = stepCount ? Math.round((completedSteps / stepCount) * 100) : 0;

  return (
    <Link
      href={`/runs/${run.id}`}
      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span className="truncate text-sm font-medium text-ink">
            {task.title}
          </span>
          <RunStatusBadge status={run.status} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
          <span>{OUTPUT_FORMAT_LABELS[task.outputFormat]}</span>
          <span className="inline-flex items-center gap-1">
            <ListTree className="size-3.5" />
            {completedSteps}/{stepCount} steps
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDuration(run.startedAt, run.completedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Coins className="size-3.5" />
            {formatCost(run.estimatedCost)} · {formatTokens(run.tokenUsage)} tok
          </span>
          <span>{formatDateTime(run.createdAt)}</span>
        </div>
        {/* progress bar */}
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-elevated">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              run.status === "failed" ? "bg-danger" : "bg-accent",
            )}
            style={{ width: `${run.status === "completed" ? 100 : progress}%` }}
          />
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-subtle transition-colors group-hover:text-muted" />
    </Link>
  );
}

export function RunList({ runs }: { runs: RunSummary[] }) {
  if (runs.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm text-muted">No runs yet.</p>
        <Link
          href="/tasks/new"
          className="mt-3 inline-block text-sm font-medium text-accent-strong hover:underline"
        >
          Create your first research task →
        </Link>
      </div>
    );
  }
  return (
    <div className="divide-y divide-line">
      {runs.map((s) => (
        <RunRow key={s.run.id} summary={s} />
      ))}
    </div>
  );
}
