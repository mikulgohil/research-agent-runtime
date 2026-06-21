import type { FinalReport, ResearchTask, StepKind } from "./types";

/**
 * The Model seam.
 *
 * The executor depends only on this interface, never on a concrete provider.
 * `mock-model.ts` implements it deterministically (no API key) and
 * `anthropic-model.ts` implements it against live Claude — they are
 * interchangeable, which is what lets the same runtime power a keyless demo and
 * a production deployment.
 */

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface StepRequest {
  task: ResearchTask;
  step: {
    name: string;
    description: string;
    kind: StepKind;
  };
  /** Outputs of previously completed steps, for chained context. */
  priorOutputs: Array<{ name: string; output: string }>;
}

export interface StepResult {
  /** Markdown-ish notes the step produced. */
  output: string;
  usage: ModelUsage;
}

export interface ReportRequest {
  task: ResearchTask;
  stepOutputs: Array<{ name: string; output: string }>;
}

export interface ReportResult {
  report: FinalReport;
  usage: ModelUsage;
}

export interface Model {
  /** Provider/model identifier recorded on the run for observability. */
  readonly name: string;
  /** Whether this model performs real network calls (drives UI "demo" hints). */
  readonly isLive: boolean;
  /** Execute a single research step and return its notes + token usage. */
  runStep(req: StepRequest): Promise<StepResult>;
  /** Synthesize the structured final report from all step outputs. */
  generateReport(req: ReportRequest): Promise<ReportResult>;
}
