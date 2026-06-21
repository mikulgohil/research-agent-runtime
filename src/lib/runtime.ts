import "server-only";
import type { Store } from "./storage/store.interface";
import { LocalStore } from "./storage/local.store";
import { SupabaseStore } from "./storage/supabase.store";
import type { Model } from "./agent-runtime/model.interface";
import { MockModel } from "./agent-runtime/mock-model";
import { AnthropicModel } from "./agent-runtime/anthropic-model";
import { AgentExecutor } from "./agent-runtime/executor";

/**
 * Composition root. Reads the two driver env vars, instantiates the matching
 * adapters once, and wires them into a single AgentExecutor. Everything else in
 * the app depends on `getEngine()` / `getStore()` — never on a concrete driver.
 */

export type StorageDriver = "local" | "supabase";
export type ModelDriver = "mock" | "anthropic";

export interface RuntimeConfig {
  storageDriver: StorageDriver;
  modelDriver: ModelDriver;
  modelName: string;
  modelIsLive: boolean;
  /** True when MODEL_DRIVER=anthropic was requested but no API key was found. */
  anthropicFellBackToMock: boolean;
}

let storeSingleton: Store | null = null;
let modelSingleton: Model | null = null;
let executorSingleton: AgentExecutor | null = null;

function resolveStorageDriver(): StorageDriver {
  return process.env.STORAGE_DRIVER === "supabase" ? "supabase" : "local";
}

function wantsAnthropic(): boolean {
  return process.env.MODEL_DRIVER === "anthropic";
}

function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getStore(): Store {
  if (!storeSingleton) {
    storeSingleton =
      resolveStorageDriver() === "supabase"
        ? new SupabaseStore()
        : new LocalStore();
  }
  return storeSingleton;
}

export function getModel(): Model {
  if (!modelSingleton) {
    modelSingleton =
      wantsAnthropic() && hasAnthropicKey() ? new AnthropicModel() : new MockModel();
  }
  return modelSingleton;
}

export function getEngine(): AgentExecutor {
  if (!executorSingleton) {
    executorSingleton = new AgentExecutor(getStore(), getModel());
  }
  return executorSingleton;
}

export function getRuntimeConfig(): RuntimeConfig {
  const model = getModel();
  return {
    storageDriver: resolveStorageDriver(),
    modelDriver: model.isLive ? "anthropic" : "mock",
    modelName: model.name,
    modelIsLive: model.isLive,
    anthropicFellBackToMock: wantsAnthropic() && !hasAnthropicKey(),
  };
}
