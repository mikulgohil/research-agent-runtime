import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Timer,
  Coins,
  Cpu,
  Plus,
} from "lucide-react";
import { getStore } from "@/lib/runtime";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RunList } from "@/components/runs/run-list";
import { formatCost, formatTokens } from "@/lib/utils";

// Always read fresh data — runs advance between requests.
export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const store = getStore();
  const [metrics, summaries] = await Promise.all([
    store.getDashboardMetrics(),
    store.listRunSummaries(),
  ]);
  const recent = summaries.slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Fleet-wide view of every research run.
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-strong"
        >
          <Plus className="size-4" /> New task
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total runs" value={`${metrics.totalRuns}`} icon={Activity} />
        <StatCard
          label="Completed"
          value={`${metrics.completedRuns}`}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Failed"
          value={`${metrics.failedRuns}`}
          icon={XCircle}
          accent="danger"
        />
        <StatCard
          label="Avg duration"
          value={`${metrics.avgDurationSec.toFixed(1)}s`}
          icon={Timer}
          sublabel="across finished runs"
        />
        <StatCard
          label="Est. cost"
          value={formatCost(metrics.totalEstimatedCost)}
          icon={Coins}
          sublabel={`${formatTokens(metrics.totalTokens)} tokens`}
        />
        <StatCard
          label="Awaiting approval"
          value={`${metrics.awaitingApproval}`}
          icon={Cpu}
          accent="warning"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
          <Link
            href="/runs"
            className="text-xs font-medium text-muted hover:text-ink"
          >
            View all
          </Link>
        </CardHeader>
        <RunList runs={recent} />
      </Card>
    </div>
  );
}
