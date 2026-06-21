import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type {
  Model,
  ModelUsage,
  ReportRequest,
  ReportResult,
  StepRequest,
  StepResult,
} from "./model.interface";
import { finalReportSchema, type ResearchTask } from "./types";

/**
 * Live Claude adapter.
 *
 * Implements the same Model interface as MockModel, so the executor is
 * identical whether it runs against the deterministic mock or real Claude.
 * Selected when MODEL_DRIVER=anthropic and ANTHROPIC_API_KEY is set.
 *
 * Uses adaptive thinking (the only supported thinking mode on Opus 4.8) and
 * structured outputs (output_config.format) to guarantee a schema-valid report.
 */

// JSON Schema mirror of FinalReport for structured outputs. Kept in lockstep
// with finalReportSchema (which validates the parsed result at runtime).
const REPORT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: { type: "string" },
    keyFindings: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    openQuestions: { type: "array", items: { type: "string" } },
    sourceNotes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          takeaway: { type: "string" },
        },
        required: ["title", "url", "takeaway"],
      },
    },
  },
  required: [
    "executiveSummary",
    "keyFindings",
    "opportunities",
    "risks",
    "recommendations",
    "openQuestions",
    "sourceNotes",
  ],
} as const;

const SYSTEM_PROMPT =
  "You are a research agent executing one step of a structured, multi-step research plan. " +
  "Be concrete, evidence-minded, and explicit about uncertainty. Keep notes tight and skimmable.";

export class AnthropicModel implements Model {
  readonly name: string;
  readonly isLive = true;
  private readonly client: Anthropic;

  constructor() {
    this.name = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
    this.client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  }

  async runStep(req: StepRequest): Promise<StepResult> {
    const prior = req.priorOutputs
      .map((p) => `### ${p.name}\n${p.output}`)
      .join("\n\n");
    const userText = [
      `Research task: ${req.task.title}`,
      `Question: ${req.task.question}`,
      req.task.context ? `Context: ${req.task.context}` : null,
      ``,
      `Current step: ${req.step.name} — ${req.step.description}`,
      prior ? `\nNotes from prior steps:\n${prior}` : null,
      ``,
      `Produce the notes for this step only, in concise markdown.`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await this.client.messages.create({
      model: this.name,
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userText }],
    });

    return { output: extractText(res), usage: usageOf(res) };
  }

  async generateReport(req: ReportRequest): Promise<ReportResult> {
    const notes = req.stepOutputs
      .map((s) => `### ${s.name}\n${s.output}`)
      .join("\n\n");
    const userText = [
      `Synthesize the final ${req.task.outputFormat.replace("_", " ")} for this research task.`,
      `Question: ${req.task.question}`,
      req.task.context ? `Context: ${req.task.context}` : null,
      ``,
      `All step notes:\n${notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await this.client.messages.create({
      model: this.name,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: {
          type: "json_schema",
          schema: REPORT_JSON_SCHEMA,
        },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userText }],
    });

    // output_config.format guarantees the text block is schema-valid JSON;
    // finalReportSchema.parse re-validates at the trust boundary.
    const report = finalReportSchema.parse(JSON.parse(extractText(res)));
    return { report, usage: usageOf(res) };
  }
}

function extractText(res: Anthropic.Message): string {
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function usageOf(res: Anthropic.Message): ModelUsage {
  return {
    inputTokens:
      res.usage.input_tokens +
      (res.usage.cache_read_input_tokens ?? 0) +
      (res.usage.cache_creation_input_tokens ?? 0),
    outputTokens: res.usage.output_tokens,
  };
}

// Referenced for type clarity in callers.
export type { ResearchTask };
