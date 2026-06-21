import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentLog,
  AgentRun,
  AgentStep,
  FinalReport,
  LogLevel,
  ResearchTask,
  ReviewDecision,
  RunDetail,
  RunSummary,
  StepKind,
  StepStatus,
} from "@/lib/agent-runtime/types";
import type { DashboardMetrics, Store } from "./store.interface";

/**
 * Supabase (Postgres) store — the production path. Same Store contract as
 * LocalStore; swapping STORAGE_DRIVER=supabase changes nothing above this seam.
 * Run supabase/migrations/0001_init.sql before first use.
 *
 * Uses the service-role key on the server (bypasses RLS); never expose it to
 * the client.
 */

// ── row <-> entity mappers (Postgres snake_case <-> domain camelCase) ────────

interface RunRow {
  id: string;
  task_id: string;
  status: AgentRun["status"];
  model: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  estimated_cost: number;
  token_usage: number;
  retry_count: number;
  error: string | null;
  report: FinalReport | null;
}

const toRun = (r: RunRow): AgentRun => ({
  id: r.id,
  taskId: r.task_id,
  status: r.status,
  model: r.model,
  createdAt: r.created_at,
  startedAt: r.started_at,
  completedAt: r.completed_at,
  estimatedCost: r.estimated_cost,
  tokenUsage: r.token_usage,
  retryCount: r.retry_count,
  error: r.error,
  report: r.report,
});

const fromRun = (r: AgentRun): RunRow => ({
  id: r.id,
  task_id: r.taskId,
  status: r.status,
  model: r.model,
  created_at: r.createdAt,
  started_at: r.startedAt,
  completed_at: r.completedAt,
  estimated_cost: r.estimatedCost,
  token_usage: r.tokenUsage,
  retry_count: r.retryCount,
  error: r.error,
  report: r.report,
});

interface StepRow {
  id: string;
  run_id: string;
  order: number;
  name: string;
  description: string;
  kind: StepKind;
  status: StepStatus;
  started_at: string | null;
  completed_at: string | null;
  output: string | null;
  error: string | null;
  retry_count: number;
  token_usage: number;
  cost_usd: number;
}

const toStep = (s: StepRow): AgentStep => ({
  id: s.id,
  runId: s.run_id,
  order: s.order,
  name: s.name,
  description: s.description,
  kind: s.kind,
  status: s.status,
  startedAt: s.started_at,
  completedAt: s.completed_at,
  output: s.output,
  error: s.error,
  retryCount: s.retry_count,
  tokenUsage: s.token_usage,
  costUsd: s.cost_usd,
});

const fromStep = (s: AgentStep): StepRow => ({
  id: s.id,
  run_id: s.runId,
  order: s.order,
  name: s.name,
  description: s.description,
  kind: s.kind,
  status: s.status,
  started_at: s.startedAt,
  completed_at: s.completedAt,
  output: s.output,
  error: s.error,
  retry_count: s.retryCount,
  token_usage: s.tokenUsage,
  cost_usd: s.costUsd,
});

const toTask = (t: {
  id: string;
  title: string;
  question: string;
  context: string | null;
  output_format: ResearchTask["outputFormat"];
  depth: ResearchTask["depth"];
  created_at: string;
}): ResearchTask => ({
  id: t.id,
  title: t.title,
  question: t.question,
  context: t.context,
  outputFormat: t.output_format,
  depth: t.depth,
  createdAt: t.created_at,
});

/** Apply a domain-field patch as a snake_case column patch on runs/steps. */
function snakePatch(patch: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    taskId: "task_id",
    createdAt: "created_at",
    startedAt: "started_at",
    completedAt: "completed_at",
    estimatedCost: "estimated_cost",
    tokenUsage: "token_usage",
    retryCount: "retry_count",
    runId: "run_id",
    costUsd: "cost_usd",
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) out[map[k] ?? k] = v;
  return out;
}

export class SupabaseStore implements Store {
  private readonly db: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "STORAGE_DRIVER=supabase requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      );
    }
    this.db = createClient(url, key, { auth: { persistSession: false } });
  }

  private check<T>(data: T | null, error: { message: string } | null): T {
    if (error) throw new Error(error.message);
    return data as T;
  }

  // tasks
  async createTask(task: ResearchTask): Promise<ResearchTask> {
    const { error } = await this.db.from("research_tasks").insert({
      id: task.id,
      title: task.title,
      question: task.question,
      context: task.context,
      output_format: task.outputFormat,
      depth: task.depth,
      created_at: task.createdAt,
    });
    if (error) throw new Error(error.message);
    return task;
  }
  async getTask(id: string): Promise<ResearchTask | null> {
    const { data, error } = await this.db
      .from("research_tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toTask(data) : null;
  }

  // runs
  async createRun(run: AgentRun): Promise<AgentRun> {
    const { error } = await this.db.from("agent_runs").insert(fromRun(run));
    if (error) throw new Error(error.message);
    return run;
  }
  async getRun(id: string): Promise<AgentRun | null> {
    const { data, error } = await this.db
      .from("agent_runs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toRun(data as RunRow) : null;
  }
  async updateRun(id: string, patch: Partial<AgentRun>): Promise<AgentRun> {
    const { data, error } = await this.db
      .from("agent_runs")
      .update(snakePatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    return toRun(this.check(data, error) as RunRow);
  }
  async listRuns(): Promise<AgentRun[]> {
    const { data, error } = await this.db
      .from("agent_runs")
      .select("*")
      .order("created_at", { ascending: false });
    return this.check(data, error).map((r: RunRow) => toRun(r));
  }

  // steps
  async createSteps(steps: AgentStep[]): Promise<AgentStep[]> {
    const { error } = await this.db
      .from("agent_steps")
      .insert(steps.map(fromStep));
    if (error) throw new Error(error.message);
    return steps;
  }
  async getStep(id: string): Promise<AgentStep | null> {
    const { data, error } = await this.db
      .from("agent_steps")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toStep(data as StepRow) : null;
  }
  async updateStep(id: string, patch: Partial<AgentStep>): Promise<AgentStep> {
    const { data, error } = await this.db
      .from("agent_steps")
      .update(snakePatch(patch))
      .eq("id", id)
      .select("*")
      .single();
    return toStep(this.check(data, error) as StepRow);
  }
  async listSteps(runId: string): Promise<AgentStep[]> {
    const { data, error } = await this.db
      .from("agent_steps")
      .select("*")
      .eq("run_id", runId)
      .order("order", { ascending: true });
    return this.check(data, error).map((s: StepRow) => toStep(s));
  }

  // logs
  async appendLog(log: AgentLog): Promise<AgentLog> {
    const { error } = await this.db.from("agent_logs").insert({
      id: log.id,
      run_id: log.runId,
      step_id: log.stepId,
      level: log.level,
      message: log.message,
      timestamp: log.timestamp,
      metadata: log.metadata,
    });
    if (error) throw new Error(error.message);
    return log;
  }
  async listLogs(runId: string): Promise<AgentLog[]> {
    const { data, error } = await this.db
      .from("agent_logs")
      .select("*")
      .eq("run_id", runId)
      .order("timestamp", { ascending: true });
    return this.check(data, error).map(
      (l: {
        id: string;
        run_id: string;
        step_id: string | null;
        level: LogLevel;
        message: string;
        timestamp: string;
        metadata: Record<string, unknown> | null;
      }): AgentLog => ({
        id: l.id,
        runId: l.run_id,
        stepId: l.step_id,
        level: l.level,
        message: l.message,
        timestamp: l.timestamp,
        metadata: l.metadata,
      }),
    );
  }

  // reviews
  async createReview(review: ReviewDecision): Promise<ReviewDecision> {
    const { error } = await this.db.from("review_decisions").insert({
      id: review.id,
      run_id: review.runId,
      decision: review.decision,
      notes: review.notes,
      created_at: review.createdAt,
    });
    if (error) throw new Error(error.message);
    return review;
  }
  async listReviews(runId: string): Promise<ReviewDecision[]> {
    const { data, error } = await this.db
      .from("review_decisions")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true });
    return this.check(data, error).map(
      (r: {
        id: string;
        run_id: string;
        decision: ReviewDecision["decision"];
        notes: string | null;
        created_at: string;
      }): ReviewDecision => ({
        id: r.id,
        runId: r.run_id,
        decision: r.decision,
        notes: r.notes,
        createdAt: r.created_at,
      }),
    );
  }

  // composite reads
  async getRunDetail(runId: string): Promise<RunDetail | null> {
    const run = await this.getRun(runId);
    if (!run) return null;
    const task = await this.getTask(run.taskId);
    if (!task) return null;
    const [steps, logs, reviews] = await Promise.all([
      this.listSteps(runId),
      this.listLogs(runId),
      this.listReviews(runId),
    ]);
    return { run, task, steps, logs, reviews };
  }

  async listRunSummaries(): Promise<RunSummary[]> {
    const runs = await this.listRuns();
    const summaries = await Promise.all(
      runs.map(async (run) => {
        const [task, steps] = await Promise.all([
          this.getTask(run.taskId),
          this.listSteps(run.id),
        ]);
        if (!task) return null;
        return {
          run,
          task,
          stepCount: steps.length,
          completedSteps: steps.filter((s) => s.status === "completed").length,
        };
      }),
    );
    return summaries.filter((s): s is RunSummary => s !== null);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const runs = await this.listRuns();
    const finished = runs.filter((r) => r.startedAt && r.completedAt);
    const totalDurationSec = finished.reduce((sum, r) => {
      const ms =
        new Date(r.completedAt as string).getTime() -
        new Date(r.startedAt as string).getTime();
      return sum + Math.max(0, ms) / 1000;
    }, 0);
    return {
      totalRuns: runs.length,
      completedRuns: runs.filter((r) => r.status === "completed").length,
      failedRuns: runs.filter((r) => r.status === "failed").length,
      awaitingApproval: runs.filter((r) => r.status === "waiting_for_approval")
        .length,
      avgDurationSec: finished.length ? totalDurationSec / finished.length : 0,
      totalEstimatedCost:
        Math.round(runs.reduce((s, r) => s + r.estimatedCost, 0) * 1e6) / 1e6,
      totalTokens: runs.reduce((s, r) => s + r.tokenUsage, 0),
    };
  }
}
