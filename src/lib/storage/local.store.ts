import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AgentLog,
  AgentRun,
  AgentStep,
  ResearchTask,
  ReviewDecision,
  RunDetail,
  RunSummary,
} from "@/lib/agent-runtime/types";
import type { DashboardMetrics, Store } from "./store.interface";

/**
 * File-backed store — the zero-setup default. Persists the whole dataset as a
 * single JSON document under ./.data so a fresh clone runs with no database.
 *
 * Writes are serialized through an in-process promise chain to avoid lost
 * updates from concurrent requests (sufficient for a single-node demo; the
 * Supabase driver is the path for real concurrency).
 */
interface Db {
  tasks: ResearchTask[];
  runs: AgentRun[];
  steps: AgentStep[];
  logs: AgentLog[];
  reviews: ReviewDecision[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "runtime.json");
const EMPTY_DB: Db = { tasks: [], runs: [], steps: [], logs: [], reviews: [] };

export class LocalStore implements Store {
  private writeChain: Promise<unknown> = Promise.resolve();

  private async read(): Promise<Db> {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      return { ...EMPTY_DB, ...(JSON.parse(raw) as Db) };
    } catch {
      return structuredClone(EMPTY_DB);
    }
  }

  private async write(db: Db): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
  }

  /** Serialize a read-modify-write so concurrent mutations don't clobber. */
  private mutate<T>(fn: (db: Db) => { db: Db; result: T }): Promise<T> {
    const next = this.writeChain.then(async () => {
      const db = await this.read();
      const { db: updated, result } = fn(db);
      await this.write(updated);
      return result;
    });
    // keep the chain alive even if this mutation rejects
    this.writeChain = next.catch(() => undefined);
    return next;
  }

  // tasks
  createTask(task: ResearchTask): Promise<ResearchTask> {
    return this.mutate((db) => {
      db.tasks.push(task);
      return { db, result: task };
    });
  }
  async getTask(id: string): Promise<ResearchTask | null> {
    const db = await this.read();
    return db.tasks.find((t) => t.id === id) ?? null;
  }

  // runs
  createRun(run: AgentRun): Promise<AgentRun> {
    return this.mutate((db) => {
      db.runs.push(run);
      return { db, result: run };
    });
  }
  async getRun(id: string): Promise<AgentRun | null> {
    const db = await this.read();
    return db.runs.find((r) => r.id === id) ?? null;
  }
  updateRun(id: string, patch: Partial<AgentRun>): Promise<AgentRun> {
    return this.mutate((db) => {
      const i = db.runs.findIndex((r) => r.id === id);
      if (i === -1) throw new Error(`Run ${id} not found`);
      db.runs[i] = { ...db.runs[i], ...patch };
      return { db, result: db.runs[i] };
    });
  }
  async listRuns(): Promise<AgentRun[]> {
    const db = await this.read();
    return [...db.runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // steps
  createSteps(steps: AgentStep[]): Promise<AgentStep[]> {
    return this.mutate((db) => {
      db.steps.push(...steps);
      return { db, result: steps };
    });
  }
  async getStep(id: string): Promise<AgentStep | null> {
    const db = await this.read();
    return db.steps.find((s) => s.id === id) ?? null;
  }
  updateStep(id: string, patch: Partial<AgentStep>): Promise<AgentStep> {
    return this.mutate((db) => {
      const i = db.steps.findIndex((s) => s.id === id);
      if (i === -1) throw new Error(`Step ${id} not found`);
      db.steps[i] = { ...db.steps[i], ...patch };
      return { db, result: db.steps[i] };
    });
  }
  async listSteps(runId: string): Promise<AgentStep[]> {
    const db = await this.read();
    return db.steps
      .filter((s) => s.runId === runId)
      .sort((a, b) => a.order - b.order);
  }

  // logs
  appendLog(log: AgentLog): Promise<AgentLog> {
    return this.mutate((db) => {
      db.logs.push(log);
      return { db, result: log };
    });
  }
  async listLogs(runId: string): Promise<AgentLog[]> {
    const db = await this.read();
    return db.logs
      .filter((l) => l.runId === runId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  // reviews
  createReview(review: ReviewDecision): Promise<ReviewDecision> {
    return this.mutate((db) => {
      db.reviews.push(review);
      return { db, result: review };
    });
  }
  async listReviews(runId: string): Promise<ReviewDecision[]> {
    const db = await this.read();
    return db.reviews
      .filter((r) => r.runId === runId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // composite reads
  async getRunDetail(runId: string): Promise<RunDetail | null> {
    const db = await this.read();
    const run = db.runs.find((r) => r.id === runId);
    if (!run) return null;
    const task = db.tasks.find((t) => t.id === run.taskId);
    if (!task) return null;
    return {
      run,
      task,
      steps: db.steps
        .filter((s) => s.runId === runId)
        .sort((a, b) => a.order - b.order),
      logs: db.logs
        .filter((l) => l.runId === runId)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      reviews: db.reviews
        .filter((r) => r.runId === runId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  }

  async listRunSummaries(): Promise<RunSummary[]> {
    const db = await this.read();
    const tasksById = new Map(db.tasks.map((t) => [t.id, t]));
    return [...db.runs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .flatMap((run) => {
        const task = tasksById.get(run.taskId);
        if (!task) return [];
        const steps = db.steps.filter((s) => s.runId === run.id);
        return [
          {
            run,
            task,
            stepCount: steps.length,
            completedSteps: steps.filter((s) => s.status === "completed").length,
          },
        ];
      });
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const db = await this.read();
    const runs = db.runs;
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
