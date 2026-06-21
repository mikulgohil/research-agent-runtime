import type { ModelUsage } from "./model.interface";

/**
 * Token-cost estimation.
 *
 * Prices are USD per million tokens, mirroring published Anthropic pricing so
 * the dashboard's "estimated cost" reads realistically. The mock model is
 * priced as Opus so a keyless demo shows the same cost profile as production.
 */
interface Pricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

const PRICING: Record<string, Pricing> = {
  "claude-opus-4-8": { inputPerMTok: 15, outputPerMTok: 75 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
  "mock-research-1": { inputPerMTok: 15, outputPerMTok: 75 },
};

const DEFAULT_PRICING: Pricing = { inputPerMTok: 15, outputPerMTok: 75 };

export function priceFor(model: string): Pricing {
  return PRICING[model] ?? DEFAULT_PRICING;
}

/** Estimate USD cost for a single model call. */
export function estimateCost(usage: ModelUsage, model: string): number {
  const p = priceFor(model);
  const cost =
    (usage.inputTokens / 1_000_000) * p.inputPerMTok +
    (usage.outputTokens / 1_000_000) * p.outputPerMTok;
  // round to 6 decimals to avoid floating-point noise in aggregates
  return Math.round(cost * 1e6) / 1e6;
}

/** Rough token count from text (~4 chars/token) — used by the mock model. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function totalTokens(usage: ModelUsage): number {
  return usage.inputTokens + usage.outputTokens;
}
