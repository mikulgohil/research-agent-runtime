"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Check, X } from "lucide-react";
import { submitReviewAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function ApprovalPanel({
  runId,
  onResolved,
}: {
  runId: string;
  onResolved: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const res = await submitReviewAction(runId, decision, notes);
      if (!res.ok) {
        setError(res.error ?? "Failed to submit review");
        return;
      }
      onResolved();
    });
  }

  return (
    <div className="rounded-card border border-warning/40 bg-warning-soft/15 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-warning" />
        <h3 className="text-sm font-semibold text-ink">Human approval required</h3>
      </div>
      <p className="mt-1.5 text-sm text-muted">
        The agent has finished its analysis and paused before generating the
        final report. Approve to continue, or reject to stop the run.
      </p>

      <label htmlFor="review-notes" className="sr-only">
        Reviewer notes
      </label>
      <textarea
        id="review-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Reviewer notes (optional)…"
        className="mt-3 w-full resize-y rounded-lg border border-line-strong bg-elevated/60 px-3 py-2 text-sm text-ink placeholder:text-subtle focus-visible:border-accent focus-visible:outline-none"
      />

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-3 flex gap-2.5">
        <Button onClick={() => decide("approved")} disabled={isPending}>
          <Check className="size-4" />
          {isPending ? "Submitting…" : "Approve & generate report"}
        </Button>
        <Button
          variant="danger"
          onClick={() => decide("rejected")}
          disabled={isPending}
        >
          <X className="size-4" /> Reject
        </Button>
      </div>
    </div>
  );
}
