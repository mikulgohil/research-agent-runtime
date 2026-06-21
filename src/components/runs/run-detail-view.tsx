"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Radio, AlertCircle } from "lucide-react";
import type { RunDetail } from "@/lib/agent-runtime/types";
import { OUTPUT_FORMAT_LABELS, DEPTH_LABELS } from "@/lib/agent-runtime/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RunStatusBadge } from "@/components/ui/status-badge";
import { ObservabilityBar } from "./observability-bar";
import { StepTimeline } from "./step-timeline";
import { LogConsole } from "./log-console";
import { ApprovalPanel } from "./approval-panel";
import { ReportView } from "./report-view";
import { formatDateTime } from "@/lib/utils";

const POLL_MS = 1200;

export function RunDetailView({ initial }: { initial: RunDetail }) {
  const [detail, setDetail] = useState<RunDetail>(initial);
  const { run, task } = detail;
  const isTerminal = run.status === "completed" || run.status === "failed";

  const tick = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${run.id}/tick`, { method: "POST" });
      if (res.ok) setDetail((await res.json()) as RunDetail);
    } catch {
      /* transient network error — next interval retries */
    }
  }, [run.id]);

  useEffect(() => {
    if (isTerminal) return;
    const handle = setInterval(tick, POLL_MS);
    return () => clearInterval(handle);
  }, [isTerminal, tick]);

  return (
    <div>
      <Link
        href="/runs"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" /> All runs
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {task.title}
            </h1>
            <RunStatusBadge status={run.status} />
            {!isTerminal && (
              <span className="inline-flex items-center gap-1 text-xs text-active">
                <Radio className="size-3.5 motion-safe:animate-pulse-dot" /> live
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted">{task.question}</p>
          <p className="mt-1.5 text-xs text-subtle">
            {OUTPUT_FORMAT_LABELS[task.outputFormat]} ·{" "}
            {DEPTH_LABELS[task.depth]} depth · started{" "}
            {formatDateTime(run.startedAt)}
          </p>
        </div>
      </div>

      <Card className="mt-6 overflow-hidden">
        <ObservabilityBar run={run} steps={detail.steps} />
      </Card>

      {run.status === "failed" && run.error && (
        <div className="mt-5 flex items-start gap-2 rounded-card border border-danger/40 bg-danger-soft/15 p-4 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{run.error}</span>
        </div>
      )}

      {run.status === "waiting_for_approval" && (
        <div className="mt-5">
          <ApprovalPanel runId={run.id} onResolved={tick} />
        </div>
      )}

      {run.report && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Final report</CardTitle>
            <Link
              href={`/reports/${run.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-strong hover:underline"
            >
              <FileText className="size-3.5" /> Full report
            </Link>
          </CardHeader>
          <div className="p-5">
            <ReportView report={run.report} />
          </div>
        </Card>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Step timeline</CardTitle>
          </CardHeader>
          <div className="p-5">
            <StepTimeline steps={detail.steps} />
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Log console</CardTitle>
            <span className="text-xs text-subtle tabular-nums">
              {detail.logs.length} lines
            </span>
          </CardHeader>
          <LogConsole logs={detail.logs} />
        </Card>
      </div>
    </div>
  );
}
