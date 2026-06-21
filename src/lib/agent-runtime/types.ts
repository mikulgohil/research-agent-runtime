import { z } from "zod";

/**
 * Domain model for the agent runtime.
 *
 * Zod schemas are the single source of truth: runtime validation (at the
 * Server Action boundary) and the compile-time TypeScript types are derived
 * from the same definition via `z.infer`, so they can never drift apart.
 */

// ── Enumerations (string-literal unions, not TS enums) ──────────────────────

export const OUTPUT_FORMATS = [
  "executive_brief",
  "detailed_report",
  "comparison_table",
  "market_map",
] as const;
export const outputFormatSchema = z.enum(OUTPUT_FORMATS);
export type OutputFormat = z.infer<typeof outputFormatSchema>;

export const DEPTHS = ["quick", "standard", "deep"] as const;
export const depthSchema = z.enum(DEPTHS);
export type Depth = z.infer<typeof depthSchema>;

export const RUN_STATUSES = [
  "queued",
  "running",
  "waiting_for_approval",
  "completed",
  "failed",
] as const;
export const runStatusSchema = z.enum(RUN_STATUSES);
export type RunStatus = z.infer<typeof runStatusSchema>;

export const STEP_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
] as const;
export const stepStatusSchema = z.enum(STEP_STATUSES);
export type StepStatus = z.infer<typeof stepStatusSchema>;

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export const logLevelSchema = z.enum(LOG_LEVELS);
export type LogLevel = z.infer<typeof logLevelSchema>;

export const reviewDecisionTypeSchema = z.enum(["approved", "rejected"]);
export type ReviewDecisionType = z.infer<typeof reviewDecisionTypeSchema>;

/** Steps marked `human_review` halt the run until a ReviewDecision exists. */
export const stepKindSchema = z.enum(["agent", "human_review", "report"]);
export type StepKind = z.infer<typeof stepKindSchema>;

// ── Entities ────────────────────────────────────────────────────────────────

export const researchTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  question: z.string(),
  context: z.string().nullable(),
  outputFormat: outputFormatSchema,
  depth: depthSchema,
  createdAt: z.string(),
});
export type ResearchTask = z.infer<typeof researchTaskSchema>;

export const agentStepSchema = z.object({
  id: z.string(),
  runId: z.string(),
  order: z.number().int(),
  name: z.string(),
  description: z.string(),
  kind: stepKindSchema,
  status: stepStatusSchema,
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  output: z.string().nullable(),
  error: z.string().nullable(),
  retryCount: z.number().int(),
  tokenUsage: z.number().int(),
  costUsd: z.number(),
});
export type AgentStep = z.infer<typeof agentStepSchema>;

export const agentLogSchema = z.object({
  id: z.string(),
  runId: z.string(),
  stepId: z.string().nullable(),
  level: logLevelSchema,
  message: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type AgentLog = z.infer<typeof agentLogSchema>;

export const reviewDecisionSchema = z.object({
  id: z.string(),
  runId: z.string(),
  decision: reviewDecisionTypeSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

/** Structured final report — the run's deliverable. */
export const sourceNoteSchema = z.object({
  title: z.string(),
  url: z.string(),
  takeaway: z.string(),
});
export type SourceNote = z.infer<typeof sourceNoteSchema>;

export const finalReportSchema = z.object({
  executiveSummary: z.string(),
  keyFindings: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
  openQuestions: z.array(z.string()),
  sourceNotes: z.array(sourceNoteSchema),
});
export type FinalReport = z.infer<typeof finalReportSchema>;

export const agentRunSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  status: runStatusSchema,
  model: z.string(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  estimatedCost: z.number(),
  tokenUsage: z.number().int(),
  retryCount: z.number().int(),
  error: z.string().nullable(),
  report: finalReportSchema.nullable(),
});
export type AgentRun = z.infer<typeof agentRunSchema>;

// ── Composite read models ───────────────────────────────────────────────────

/** A run joined with its task, steps, logs, and review history. */
export interface RunDetail {
  run: AgentRun;
  task: ResearchTask;
  steps: AgentStep[];
  logs: AgentLog[];
  reviews: ReviewDecision[];
}

/** A run paired with its task — the row shape used in lists and dashboards. */
export interface RunSummary {
  run: AgentRun;
  task: ResearchTask;
  stepCount: number;
  completedSteps: number;
}

// ── Inputs ──────────────────────────────────────────────────────────────────

export const createTaskInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give the task a title (at least 3 characters).")
    .max(120, "Title is too long (max 120 characters)."),
  question: z
    .string()
    .trim()
    .min(10, "Describe the research question (at least 10 characters).")
    .max(2000, "Question is too long (max 2000 characters)."),
  context: z
    .string()
    .trim()
    .max(4000, "Context is too long (max 4000 characters).")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  outputFormat: outputFormatSchema,
  depth: depthSchema,
});
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// ── Human-readable labels ────────────────────────────────────────────────────

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  executive_brief: "Executive brief",
  detailed_report: "Detailed report",
  comparison_table: "Comparison table",
  market_map: "Market map",
};

export const DEPTH_LABELS: Record<Depth, string> = {
  quick: "Quick",
  standard: "Standard",
  deep: "Deep",
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  waiting_for_approval: "Awaiting approval",
  completed: "Completed",
  failed: "Failed",
};

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
};
