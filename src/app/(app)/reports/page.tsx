import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { getStore } from "@/lib/runtime";
import { Card } from "@/components/ui/card";
import { OUTPUT_FORMAT_LABELS } from "@/lib/agent-runtime/types";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const summaries = await getStore().listRunSummaries();
  const reports = summaries.filter((s) => s.run.status === "completed");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="mt-1 text-sm text-muted">
        Final reports from completed runs.
      </p>

      {reports.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <p className="text-sm text-muted">No completed reports yet.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {reports.map(({ run, task }) => (
            <Link key={run.id} href={`/reports/${run.id}`}>
              <Card className="group h-full p-5 transition-colors hover:border-accent/50">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent-strong">
                    <FileText className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-xs text-subtle">
                      {OUTPUT_FORMAT_LABELS[task.outputFormat]} ·{" "}
                      {formatDateTime(run.completedAt)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-subtle transition-colors group-hover:text-accent-strong" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
