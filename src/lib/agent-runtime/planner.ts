import type { Depth, OutputFormat, ResearchTask, StepKind } from "./types";
import { OUTPUT_FORMAT_LABELS } from "./types";

/**
 * Deterministic planner.
 *
 * Decomposes a task into an ordered plan. It is intentionally deterministic so
 * the demo is reproducible and testable; the Model seam handles the actual
 * "thinking" per step. Swapping in an LLM-generated plan later means only
 * replacing this function — the executor consumes `PlannedStep[]` either way.
 */
export interface PlannedStep {
  name: string;
  description: string;
  kind: StepKind;
}

const CORE_STEPS: PlannedStep[] = [
  {
    name: "Clarify objective",
    description: "Restate the research question and define what a good answer looks like.",
    kind: "agent",
  },
  {
    name: "Identify research areas",
    description: "Break the question into the key sub-areas worth investigating.",
    kind: "agent",
  },
  {
    name: "Gather source notes",
    description: "Collect candidate sources and capture raw notes from each.",
    kind: "agent",
  },
];

const ANALYSIS_STEPS: PlannedStep[] = [
  {
    name: "Extract key facts",
    description: "Distil the most decision-relevant facts from the gathered notes.",
    kind: "agent",
  },
  {
    name: "Compare competing views",
    description: "Contrast differing positions and weigh the strength of evidence.",
    kind: "agent",
  },
];

const DEEP_STEP: PlannedStep = {
  name: "Stress-test assumptions",
  description: "Challenge the leading conclusions and probe for failure modes.",
  kind: "agent",
};

const SYNTHESIS_STEP: PlannedStep = {
  name: "Synthesize findings",
  description: "Integrate the analysis into a coherent set of conclusions.",
  kind: "agent",
};

const REVIEW_STEP: PlannedStep = {
  name: "Human review",
  description: "Pause for a human to approve the findings before the report is generated.",
  kind: "human_review",
};

function reportStep(format: OutputFormat): PlannedStep {
  return {
    name: "Prepare report",
    description: `Generate the final ${OUTPUT_FORMAT_LABELS[format].toLowerCase()} from the approved findings.`,
    kind: "report",
  };
}

/** Build the ordered plan for a task based on its depth + output format. */
export function buildPlan(task: ResearchTask): PlannedStep[] {
  const steps: PlannedStep[] = [...CORE_STEPS];

  const depth: Depth = task.depth;
  if (depth === "standard" || depth === "deep") {
    steps.push(...ANALYSIS_STEPS);
  }
  if (depth === "deep") {
    steps.push(DEEP_STEP);
  }

  steps.push(SYNTHESIS_STEP, REVIEW_STEP, reportStep(task.outputFormat));
  return steps;
}
