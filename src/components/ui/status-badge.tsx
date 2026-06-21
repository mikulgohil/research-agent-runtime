import { Badge, type Tone } from "./badge";
import {
  RUN_STATUS_LABELS,
  STEP_STATUS_LABELS,
  type RunStatus,
  type StepStatus,
} from "@/lib/agent-runtime/types";

const RUN_TONES: Record<RunStatus, Tone> = {
  queued: "neutral",
  running: "active",
  waiting_for_approval: "warning",
  completed: "success",
  failed: "danger",
};

const STEP_TONES: Record<StepStatus, Tone> = {
  pending: "neutral",
  running: "active",
  completed: "success",
  failed: "danger",
  skipped: "neutral",
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return (
    <Badge tone={RUN_TONES[status]} dot pulse={status === "running"}>
      {RUN_STATUS_LABELS[status]}
    </Badge>
  );
}

export function StepStatusBadge({ status }: { status: StepStatus }) {
  return (
    <Badge tone={STEP_TONES[status]} dot pulse={status === "running"}>
      {STEP_STATUS_LABELS[status]}
    </Badge>
  );
}
