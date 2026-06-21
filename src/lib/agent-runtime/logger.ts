import type { Store } from "@/lib/storage/store.interface";
import type { AgentLog, LogLevel } from "./types";
import { genId, nowIso } from "./ids";

/**
 * Run-scoped structured logger. Every entry is persisted to the store so the
 * run-detail log console reflects exactly what the engine recorded — the same
 * telemetry an observability platform (LangSmith/Langfuse) would surface.
 */
export class RunLogger {
  constructor(
    private readonly store: Store,
    private readonly runId: string,
  ) {}

  private async write(
    level: LogLevel,
    message: string,
    stepId: string | null = null,
    metadata: Record<string, unknown> | null = null,
  ): Promise<AgentLog> {
    return this.store.appendLog({
      id: genId("log"),
      runId: this.runId,
      stepId,
      level,
      message,
      timestamp: nowIso(),
      metadata,
    });
  }

  debug(message: string, stepId?: string, metadata?: Record<string, unknown>) {
    return this.write("debug", message, stepId ?? null, metadata ?? null);
  }
  info(message: string, stepId?: string, metadata?: Record<string, unknown>) {
    return this.write("info", message, stepId ?? null, metadata ?? null);
  }
  warn(message: string, stepId?: string, metadata?: Record<string, unknown>) {
    return this.write("warn", message, stepId ?? null, metadata ?? null);
  }
  error(message: string, stepId?: string, metadata?: Record<string, unknown>) {
    return this.write("error", message, stepId ?? null, metadata ?? null);
  }
}
