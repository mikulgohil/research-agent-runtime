import type { AgentRun, AgentStep } from "@/lib/agent-runtime/types";
import { formatCost, formatDuration, formatTokens } from "@/lib/utils";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] font-medium text-subtle">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

export function ObservabilityBar({
  run,
  steps,
}: {
  run: AgentRun;
  steps: AgentStep[];
}) {
  const completed = steps.filter((s) => s.status === "completed").length;
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
      <Metric label="Steps" value={`${completed}/${steps.length}`} />
      <Metric
        label="Duration"
        value={formatDuration(run.startedAt, run.completedAt)}
      />
      <Metric label="Tokens" value={formatTokens(run.tokenUsage)} />
      <Metric label="Est. cost" value={formatCost(run.estimatedCost)} />
      <Metric label="Retries" value={`${run.retryCount}`} />
      <Metric label="Model" value={run.model} />
    </div>
  );
}
