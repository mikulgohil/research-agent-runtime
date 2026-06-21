import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/runtime";
import { Card } from "@/components/ui/card";
import { ReportView } from "@/components/runs/report-view";
import { ObservabilityBar } from "@/components/runs/observability-bar";
import { OUTPUT_FORMAT_LABELS, DEPTH_LABELS } from "@/lib/agent-runtime/types";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getStore().getRunDetail(id);
  return { title: detail ? `Report — ${detail.task.title}` : "Report" };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getStore().getRunDetail(id);
  if (!detail || !detail.run.report) notFound();
  const { run, task, steps } = detail;
  const report = detail.run.report;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/runs/${run.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back to run
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {task.title}
      </h1>
      <p className="mt-1 text-sm text-muted">{task.question}</p>
      <p className="mt-1.5 text-xs text-subtle">
        {OUTPUT_FORMAT_LABELS[task.outputFormat]} · {DEPTH_LABELS[task.depth]}{" "}
        depth · completed {formatDateTime(run.completedAt)}
      </p>

      <Card className="mt-6 overflow-hidden">
        <ObservabilityBar run={run} steps={steps} />
      </Card>

      <div className="mt-6">
        <ReportView report={report} />
      </div>
    </div>
  );
}
