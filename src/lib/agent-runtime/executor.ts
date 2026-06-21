import type { Model } from "./model.interface";
import type { Store } from "@/lib/storage/store.interface";
import type {
  AgentRun,
  AgentStep,
  ResearchTask,
  ReviewDecisionType,
  RunStatus,
} from "./types";
import { buildPlan } from "./planner";
import { estimateCost, totalTokens } from "./cost";
import { RunLogger } from "./logger";
import { genId, nowIso } from "./ids";

/** Retry budget per step (so a transient model error doesn't fail the run). */
const MAX_RETRIES = 1;

/**
 * The execution engine.
 *
 * A "tick" state machine: `advanceRun` performs at most one step per call and
 * returns the updated run. The UI (or a drain loop) repeatedly ticks the run
 * forward, which keeps execution serverless-friendly — no long-lived worker.
 */
export class AgentExecutor {
  constructor(
    private readonly store: Store,
    private readonly model: Model,
  ) {}

  /** Create a run for an existing task: build the plan, persist pending steps. */
  async startRun(task: ResearchTask): Promise<AgentRun> {
    const runId = genId("run");
    const at = nowIso();
    const run: AgentRun = {
      id: runId,
      taskId: task.id,
      status: "running",
      model: this.model.name,
      createdAt: at,
      startedAt: at,
      completedAt: null,
      estimatedCost: 0,
      tokenUsage: 0,
      retryCount: 0,
      error: null,
      report: null,
    };
    await this.store.createRun(run);

    const plan = buildPlan(task);
    const steps: AgentStep[] = plan.map((p, i) => ({
      id: genId("step"),
      runId,
      order: i,
      name: p.name,
      description: p.description,
      kind: p.kind,
      status: "pending",
      startedAt: null,
      completedAt: null,
      output: null,
      error: null,
      retryCount: 0,
      tokenUsage: 0,
      costUsd: 0,
    }));
    await this.store.createSteps(steps);

    const logger = new RunLogger(this.store, runId);
    await logger.info(`Run created with ${steps.length} planned steps`, undefined, {
      depth: task.depth,
      outputFormat: task.outputFormat,
    });
    await logger.info(
      `Model adapter: ${this.model.name} (${this.model.isLive ? "live" : "mock"})`,
    );
    return run;
  }

  /** Advance the run by one step. No-op when terminal or awaiting a human. */
  async advanceRun(runId: string): Promise<AgentRun> {
    const run = await this.store.getRun(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    if (
      run.status === "completed" ||
      run.status === "failed" ||
      run.status === "waiting_for_approval"
    ) {
      return run;
    }

    const steps = await this.store.listSteps(runId);
    const next = steps.find((s) => s.status === "pending");
    if (!next) {
      return this.finishRun(run, "completed");
    }

    const logger = new RunLogger(this.store, runId);

    if (next.kind === "human_review") {
      await this.store.updateStep(next.id, {
        status: "running",
        startedAt: nowIso(),
      });
      await logger.info(
        "Reached review gate — awaiting human approval before report generation",
        next.id,
      );
      return this.store.updateRun(runId, { status: "waiting_for_approval" });
    }

    return this.executeStep(run, next, logger);
  }

  /** Record a human decision and resume (approve) or fail (reject) the run. */
  async submitReview(
    runId: string,
    decision: ReviewDecisionType,
    notes: string | null,
  ): Promise<AgentRun> {
    const run = await this.store.getRun(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    if (run.status !== "waiting_for_approval") {
      throw new Error("Run is not awaiting approval");
    }

    const reviewStep = (await this.store.listSteps(runId)).find(
      (s) => s.kind === "human_review",
    );
    const logger = new RunLogger(this.store, runId);

    await this.store.createReview({
      id: genId("review"),
      runId,
      decision,
      notes: notes && notes.length > 0 ? notes : null,
      createdAt: nowIso(),
    });

    if (decision === "approved") {
      if (reviewStep) {
        await this.store.updateStep(reviewStep.id, {
          status: "completed",
          completedAt: nowIso(),
          output: notes ? `Approved — ${notes}` : "Approved by reviewer",
        });
      }
      await logger.info(
        "Human approved findings — resuming to generate report",
        reviewStep?.id,
      );
      return this.store.updateRun(runId, { status: "running" });
    }

    if (reviewStep) {
      await this.store.updateStep(reviewStep.id, {
        status: "failed",
        completedAt: nowIso(),
        error: notes ?? "Rejected by reviewer",
      });
    }
    await logger.warn("Human rejected findings — run marked failed", reviewStep?.id);
    return this.finishRun(run, "failed", notes ? `Rejected — ${notes}` : "Rejected by reviewer");
  }

  /** Tick repeatedly until the run is terminal or blocked on a human. */
  async drain(runId: string, maxTicks = 50): Promise<AgentRun> {
    let run = await this.store.getRun(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    for (let i = 0; i < maxTicks; i++) {
      if (
        run.status === "completed" ||
        run.status === "failed" ||
        run.status === "waiting_for_approval"
      ) {
        break;
      }
      run = await this.advanceRun(runId);
    }
    return run;
  }

  // ── internals ───────────────────────────────────────────────────────────

  private async executeStep(
    run: AgentRun,
    step: AgentStep,
    logger: RunLogger,
  ): Promise<AgentRun> {
    const task = await this.store.getTask(run.taskId);
    if (!task) throw new Error(`Task ${run.taskId} not found`);

    await this.store.updateStep(step.id, {
      status: "running",
      startedAt: nowIso(),
    });
    await logger.info(`Step started: ${step.name}`, step.id);

    let attempt = 0;
    while (true) {
      try {
        if (step.kind === "report") {
          await this.runReportStep(task, step, logger);
        } else {
          await this.runAgentStep(task, step, logger);
        }
        break;
      } catch (err) {
        attempt += 1;
        const message = err instanceof Error ? err.message : String(err);
        if (attempt > MAX_RETRIES) {
          await this.store.updateStep(step.id, {
            status: "failed",
            completedAt: nowIso(),
            error: message,
            retryCount: attempt - 1,
          });
          await logger.error(`Step failed after ${attempt} attempts: ${message}`, step.id);
          return this.finishRun(run, "failed", `Step "${step.name}" failed: ${message}`);
        }
        await this.store.updateStep(step.id, { retryCount: attempt });
        await logger.warn(
          `Step "${step.name}" errored (${message}) — retrying (${attempt}/${MAX_RETRIES})`,
          step.id,
        );
      }
    }

    await this.recomputeAggregates(run.id);

    const remaining = (await this.store.listSteps(run.id)).some(
      (s) => s.status === "pending",
    );
    if (!remaining) {
      const fresh = await this.store.getRun(run.id);
      return this.finishRun(fresh ?? run, "completed");
    }
    return (await this.store.getRun(run.id)) ?? run;
  }

  private async runAgentStep(
    task: ResearchTask,
    step: AgentStep,
    logger: RunLogger,
  ): Promise<void> {
    const priorOutputs = await this.completedOutputs(step.runId);
    const { output, usage } = await this.model.runStep({
      task,
      step: { name: step.name, description: step.description, kind: step.kind },
      priorOutputs,
    });
    const tokens = totalTokens(usage);
    const cost = estimateCost(usage, this.model.name);
    await this.store.updateStep(step.id, {
      status: "completed",
      completedAt: nowIso(),
      output,
      tokenUsage: tokens,
      costUsd: cost,
    });
    await logger.info(`Step completed: ${step.name}`, step.id, {
      tokens,
      costUsd: cost,
    });
  }

  private async runReportStep(
    task: ResearchTask,
    step: AgentStep,
    logger: RunLogger,
  ): Promise<void> {
    const stepOutputs = await this.completedOutputs(step.runId);
    const { report, usage } = await this.model.generateReport({ task, stepOutputs });
    const tokens = totalTokens(usage);
    const cost = estimateCost(usage, this.model.name);
    await this.store.updateStep(step.id, {
      status: "completed",
      completedAt: nowIso(),
      output: report.executiveSummary,
      tokenUsage: tokens,
      costUsd: cost,
    });
    await this.store.updateRun(step.runId, { report });
    await logger.info("Final report generated", step.id, { tokens, costUsd: cost });
  }

  private async completedOutputs(
    runId: string,
  ): Promise<Array<{ name: string; output: string }>> {
    const steps = await this.store.listSteps(runId);
    return steps
      .filter((s) => s.status === "completed" && s.output && s.kind === "agent")
      .map((s) => ({ name: s.name, output: s.output as string }));
  }

  private async recomputeAggregates(runId: string): Promise<void> {
    const steps = await this.store.listSteps(runId);
    const tokenUsage = steps.reduce((sum, s) => sum + s.tokenUsage, 0);
    const estimatedCost =
      Math.round(steps.reduce((sum, s) => sum + s.costUsd, 0) * 1e6) / 1e6;
    const retryCount = steps.reduce((sum, s) => sum + s.retryCount, 0);
    await this.store.updateRun(runId, { tokenUsage, estimatedCost, retryCount });
  }

  private async finishRun(
    run: AgentRun,
    status: Extract<RunStatus, "completed" | "failed">,
    error?: string,
  ): Promise<AgentRun> {
    return this.store.updateRun(run.id, {
      status,
      completedAt: nowIso(),
      error: error ?? null,
    });
  }
}
