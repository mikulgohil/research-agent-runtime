import Link from "next/link";
import { Plus } from "lucide-react";
import { getStore } from "@/lib/runtime";
import { Card } from "@/components/ui/card";
import { RunList } from "@/components/runs/run-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Runs" };

export default async function RunsPage() {
  const summaries = await getStore().listRunSummaries();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
          <p className="mt-1 text-sm text-muted">
            {summaries.length} run{summaries.length === 1 ? "" : "s"} total.
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-strong"
        >
          <Plus className="size-4" /> New task
        </Link>
      </div>

      <Card className="mt-6">
        <RunList runs={summaries} />
      </Card>
    </div>
  );
}
