"use client";

import { useEffect, useRef } from "react";
import type { AgentLog, LogLevel } from "@/lib/agent-runtime/types";
import { cn, formatTime } from "@/lib/utils";

const LEVEL_CLS: Record<LogLevel, string> = {
  debug: "text-subtle",
  info: "text-muted",
  warn: "text-warning",
  error: "text-danger",
};

export function LogConsole({ logs }: { logs: AgentLog[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest line as logs stream in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [logs.length]);

  return (
    <div className="h-[28rem] overflow-y-auto bg-canvas/60 p-4 font-mono text-[11px] leading-relaxed">
      {logs.length === 0 ? (
        <p className="text-subtle">Waiting for logs…</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="flex gap-2.5 py-0.5">
            <span className="shrink-0 text-subtle tabular-nums">
              {formatTime(log.timestamp)}
            </span>
            <span
              className={cn(
                "shrink-0 font-semibold uppercase",
                LEVEL_CLS[log.level],
              )}
            >
              {log.level}
            </span>
            <span className="text-muted">{log.message}</span>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}
