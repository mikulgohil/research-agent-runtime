import type {
  Model,
  ModelUsage,
  ReportRequest,
  ReportResult,
  StepRequest,
  StepResult,
} from "./model.interface";
import type { FinalReport, ResearchTask } from "./types";
import { estimateTokens } from "./cost";

/**
 * Deterministic, keyless model. Produces plausible research notes and a
 * structured report so the product can be demoed end-to-end with no API key.
 * Output is a function of the task + step only — same input, same output.
 */
export interface MockModelOptions {
  /** Simulated per-call latency in ms (gives realistic step durations). */
  latencyMs?: number;
}

const sleep = (ms: number) =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

/** Tiny deterministic hash → stable pseudo-latency per step name. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export class MockModel implements Model {
  readonly name = "mock-research-1";
  readonly isLive = false;
  private readonly latencyMs: number;

  constructor(opts: MockModelOptions = {}) {
    this.latencyMs = opts.latencyMs ?? 400;
  }

  async runStep(req: StepRequest): Promise<StepResult> {
    const jitter = this.latencyMs > 0 ? hash(req.step.name) % 250 : 0;
    await sleep(this.latencyMs + jitter);
    const output = renderStepNotes(req);
    const usage = usageFor(req.task.question + req.step.name, output);
    return { output, usage };
  }

  async generateReport(req: ReportRequest): Promise<ReportResult> {
    await sleep(this.latencyMs + 200);
    const report = renderReport(req.task);
    const usage = usageFor(
      req.stepOutputs.map((s) => s.output).join("\n"),
      JSON.stringify(report),
    );
    return { report, usage };
  }
}

function usageFor(input: string, output: string): ModelUsage {
  return {
    inputTokens: estimateTokens(input) + 320, // + system prompt overhead
    outputTokens: estimateTokens(output),
  };
}

function renderStepNotes(req: StepRequest): string {
  const { task, step } = req;
  const topic = task.title;
  switch (step.name) {
    case "Clarify objective":
      return [
        `**Objective.** ${task.question}`,
        ``,
        `**Definition of done.** A ${task.depth}-depth answer suitable for a ${task.outputFormat.replace("_", " ")}, grounded in concrete evidence and explicit about uncertainty.`,
        `**Scope.** Focus on the core question; flag adjacent threads as open questions rather than expanding scope.`,
      ].join("\n");
    case "Identify research areas":
      return [
        `Decomposed "${topic}" into research areas:`,
        `- Market structure & key players`,
        `- Adoption drivers and buyer motivations`,
        `- Differentiation and moats`,
        `- Risks, constraints, and counter-arguments`,
        `- Forward-looking signals (12–24 months)`,
      ].join("\n");
    case "Gather source notes":
      return [
        `Collected candidate sources and captured raw notes:`,
        `- Primary vendor documentation and changelogs`,
        `- Recent analyst commentary and market sizing`,
        `- Practitioner discussion and field reports`,
        `- Comparative benchmarks where available`,
        ``,
        `_Note: in demo mode sources are simulated; the Model seam can call real search/browse tools in production._`,
      ].join("\n");
    case "Extract key facts":
      return [
        `Decision-relevant facts extracted from notes:`,
        `- The category is consolidating around a few well-funded leaders.`,
        `- Buyers weight integration depth and reliability over raw capability.`,
        `- Pricing pressure is increasing as capabilities commoditize.`,
        `- Switching costs are rising with workflow lock-in.`,
      ].join("\n");
    case "Compare competing views":
      return [
        `Contrasted competing positions:`,
        `- **Bull case:** durable demand; tooling becomes core infrastructure.`,
        `- **Bear case:** thin differentiation; margins compress as models commoditize.`,
        `- **Synthesis:** winners pair a strong wedge with a defensible workflow.`,
      ].join("\n");
    case "Stress-test assumptions":
      return [
        `Challenged the leading conclusions:`,
        `- Assumption "demand is durable" fails if budgets tighten — monitor renewal rates.`,
        `- Assumption "lock-in protects margin" fails if interop standards emerge.`,
        `- Most fragile claim: defensibility; evidence here is the thinnest.`,
      ].join("\n");
    case "Synthesize findings":
      return [
        `Integrated analysis into conclusions:`,
        `- The opportunity is real but crowded; positioning matters more than capability.`,
        `- A focused wedge plus workflow integration is the most defensible path.`,
        `- Cost discipline matters as the category commoditizes.`,
      ].join("\n");
    default:
      return `Processed step "${step.name}" for "${topic}".`;
  }
}

function renderReport(task: ResearchTask): FinalReport {
  const t = task.title;
  return {
    executiveSummary: `This ${task.outputFormat.replace("_", " ")} addresses: "${task.question}". The category shows real, durable demand but is crowded and consolidating. The defensible path pairs a focused wedge with deep workflow integration; the primary risk is thin differentiation as underlying capabilities commoditize.`,
    keyFindings: [
      `The market for ${t} is consolidating around a few well-funded leaders.`,
      `Buyers prioritize integration depth and reliability over raw capability.`,
      `Workflow lock-in is the strongest observed source of defensibility.`,
      `Pricing pressure is rising as core capabilities commoditize.`,
    ],
    opportunities: [
      `Own a specific high-value workflow end-to-end rather than competing on breadth.`,
      `Differentiate on reliability, observability, and time-to-value.`,
      `Target underserved segments where incumbents are weak.`,
    ],
    risks: [
      `Differentiation may erode as foundation-model capability commoditizes.`,
      `Margin compression from pricing pressure and free tiers.`,
      `Defensibility evidence is the thinnest part of the thesis.`,
    ],
    recommendations: [
      `Pick a wedge with a clear, measurable ROI and expand from there.`,
      `Invest early in integrations and reliability — they drive retention.`,
      `Track renewal and expansion rates as the leading demand signal.`,
    ],
    openQuestions: [
      `How durable is workflow lock-in if interoperability standards emerge?`,
      `What is the true switching cost for an established buyer?`,
      `Which segment offers the best combination of size and weak incumbents?`,
    ],
    sourceNotes: [
      {
        title: "Vendor documentation & changelogs",
        url: "https://example.com/vendor-docs",
        takeaway: "Feature velocity is high; capabilities are converging across vendors.",
      },
      {
        title: "Analyst market commentary",
        url: "https://example.com/analyst-report",
        takeaway: "Category growth remains strong with increasing consolidation.",
      },
      {
        title: "Practitioner field reports",
        url: "https://example.com/field-notes",
        takeaway: "Reliability and integration depth dominate real purchase decisions.",
      },
    ],
  };
}
