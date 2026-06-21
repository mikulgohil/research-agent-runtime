import type {
  AgentLog,
  AgentRun,
  AgentStep,
  ResearchTask,
  ReviewDecision,
  RunDetail,
  RunSummary,
} from "@/lib/agent-runtime/types";

/** Aggregate metrics for the dashboard. */
export interface DashboardMetrics {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  awaitingApproval: number;
  /** Average wall-clock duration of finished runs, in seconds. */
  avgDurationSec: number;
  totalEstimatedCost: number;
  totalTokens: number;
}

/**
 * The Storage seam — persistence only, no business logic.
 *
 * The engine constructs fully-formed entities (ids + timestamps) and hands them
 * here to persist. `local.store.ts` writes JSON under ./.data; `supabase.store.ts`
 * writes to Postgres. Swapping `STORAGE_DRIVER` changes nothing above this line.
 */
export interface Store {
  // tasks
  createTask(task: ResearchTask): Promise<ResearchTask>;
  getTask(id: string): Promise<ResearchTask | null>;

  // runs
  createRun(run: AgentRun): Promise<AgentRun>;
  getRun(id: string): Promise<AgentRun | null>;
  updateRun(id: string, patch: Partial<AgentRun>): Promise<AgentRun>;
  listRuns(): Promise<AgentRun[]>;

  // steps
  createSteps(steps: AgentStep[]): Promise<AgentStep[]>;
  getStep(id: string): Promise<AgentStep | null>;
  updateStep(id: string, patch: Partial<AgentStep>): Promise<AgentStep>;
  listSteps(runId: string): Promise<AgentStep[]>;

  // logs
  appendLog(log: AgentLog): Promise<AgentLog>;
  listLogs(runId: string): Promise<AgentLog[]>;

  // reviews
  createReview(review: ReviewDecision): Promise<ReviewDecision>;
  listReviews(runId: string): Promise<ReviewDecision[]>;

  // composite reads
  getRunDetail(runId: string): Promise<RunDetail | null>;
  listRunSummaries(): Promise<RunSummary[]>;
  getDashboardMetrics(): Promise<DashboardMetrics>;
}
