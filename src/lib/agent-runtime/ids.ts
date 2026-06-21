/** Short, readable, prefixed ids (e.g. `run_a1b2c3d4`) for entities + logs. */
export function genId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2);
  return `${prefix}_${uuid.replace(/-/g, "").slice(0, 12)}`;
}

/** Current time as an ISO string — the canonical timestamp format everywhere. */
export function nowIso(): string {
  return new Date().toISOString();
}
