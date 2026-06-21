/**
 * Seed the local store with high-quality demo runs so a fresh clone has
 * something realistic to show. Runs the real engine (mock model), then
 * backdates run timestamps for a believable dashboard spread.
 *
 *   pnpm seed
 *
 * Writes to ./.data (gitignored). Safe to re-run — it resets the dataset.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { LocalStore } from "@/lib/storage/local.store";
import { MockModel } from "@/lib/agent-runtime/mock-model";
import { AgentExecutor } from "@/lib/agent-runtime/executor";
import { genId } from "@/lib/agent-runtime/ids";
import type {
  CreateTaskInput,
  ReviewDecisionType,
} from "@/lib/agent-runtime/types";

type Outcome =
  | { kind: "approve"; durationSec: number }
  | { kind: "reject"; durationSec: number }
  | { kind: "leave_waiting" };

interface SeedSpec {
  task: CreateTaskInput;
  ageDays: number;
  outcome: Outcome;
}

const SPECS: SeedSpec[] = [
  {
    task: {
      title: "AI coding assistant market research",
      question:
        "Research the AI coding assistant market and generate an executive report covering key players, differentiation, adoption drivers, and where the opportunity is for a new entrant.",
      context: "For a seed-stage founder evaluating where to build.",
      outputFormat: "executive_brief",
      depth: "deep",
    },
    ageDays: 4,
    outcome: { kind: "approve", durationSec: 58 },
  },
  {
    task: {
      title: "Supabase vs Firebase comparison",
      question:
        "Compare Supabase and Firebase for a seed-stage startup: pricing, developer experience, scaling, lock-in, and a clear recommendation.",
      context: "Team is TypeScript-first and values open source.",
      outputFormat: "comparison_table",
      depth: "standard",
    },
    ageDays: 1,
    outcome: { kind: "approve", durationSec: 41 },
  },
  {
    task: {
      title: "Agent observability tools landscape",
      question:
        "Map the agent observability tools landscape (LangSmith, Langfuse, Helicone, etc.) and identify gaps a new product could fill.",
      context: null,
      outputFormat: "market_map",
      depth: "standard",
    },
    ageDays: 0.08, // ~2 hours ago — left paused at the human gate
    outcome: { kind: "leave_waiting" },
  },
  {
    task: {
      title: "LLM evaluation frameworks survey",
      question:
        "Survey open-source LLM evaluation frameworks and recommend one for a small team.",
      context: null,
      outputFormat: "detailed_report",
      depth: "quick",
    },
    ageDays: 6,
    outcome: { kind: "reject", durationSec: 23 },
  },
];

async function main() {
  // fresh dataset
  await fs.rm(path.join(process.cwd(), ".data"), {
    recursive: true,
    force: true,
  });

  const store = new LocalStore();
  const engine = new AgentExecutor(store, new MockModel({ latencyMs: 120 }));

  for (const spec of SPECS) {
    const base = Date.now() - spec.ageDays * 86_400_000;
    const createdAt = new Date(base).toISOString();

    const task = {
      id: genId("task"),
      title: spec.task.title,
      question: spec.task.question,
      context: spec.task.context ?? null,
      outputFormat: spec.task.outputFormat,
      depth: spec.task.depth,
      createdAt,
    };
    await store.createTask(task);
    const run = await engine.startRun(task);

    await engine.drain(run.id); // -> waiting_for_approval

    if (spec.outcome.kind === "approve") {
      await engine.submitReview(run.id, "approved" as ReviewDecisionType, "Findings look solid — ship the report.");
      await engine.drain(run.id); // -> completed
      await store.updateRun(run.id, {
        createdAt,
        startedAt: createdAt,
        completedAt: new Date(base + spec.outcome.durationSec * 1000).toISOString(),
      });
    } else if (spec.outcome.kind === "reject") {
      await engine.submitReview(run.id, "rejected" as ReviewDecisionType, "Sources too thin — needs a deeper pass before reporting.");
      await store.updateRun(run.id, {
        createdAt,
        startedAt: createdAt,
        completedAt: new Date(base + spec.outcome.durationSec * 1000).toISOString(),
      });
    } else {
      await store.updateRun(run.id, { createdAt, startedAt: createdAt });
    }

    console.log(`  seeded: ${spec.task.title} (${spec.outcome.kind})`);
  }

  const metrics = await store.getDashboardMetrics();
  console.log(
    `\nDone. ${metrics.totalRuns} runs — ${metrics.completedRuns} completed, ${metrics.failedRuns} failed, ${metrics.awaitingApproval} awaiting approval.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
