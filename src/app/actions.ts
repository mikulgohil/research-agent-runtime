"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createTaskInputSchema,
  reviewDecisionTypeSchema,
  type ResearchTask,
} from "@/lib/agent-runtime/types";
import { genId, nowIso } from "@/lib/agent-runtime/ids";
import { getEngine, getStore } from "@/lib/runtime";

export interface CreateTaskResult {
  ok: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
  error?: string;
}

/** Create a task, kick off a run, and redirect to its live detail page. */
export async function createTaskAction(
  raw: unknown,
): Promise<CreateTaskResult> {
  const parsed = createTaskInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const input = parsed.data;
  const task: ResearchTask = {
    id: genId("task"),
    title: input.title,
    question: input.question,
    context: input.context ?? null,
    outputFormat: input.outputFormat,
    depth: input.depth,
    createdAt: nowIso(),
  };

  let runId: string;
  try {
    await getStore().createTask(task);
    const run = await getEngine().startRun(task);
    runId = run.id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to start run" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/runs");
  redirect(`/runs/${runId}`);
}

/** Record a human review decision (approve resumes the run; reject fails it). */
export async function submitReviewAction(
  runId: string,
  decision: unknown,
  notes: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsedDecision = reviewDecisionTypeSchema.safeParse(decision);
  if (!parsedDecision.success) {
    return { ok: false, error: "Invalid decision" };
  }
  try {
    await getEngine().submitReview(
      runId,
      parsedDecision.data,
      notes.trim() || null,
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Review failed" };
  }
  revalidatePath(`/runs/${runId}`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { ok: true };
}
