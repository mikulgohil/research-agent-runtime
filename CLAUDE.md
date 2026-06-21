# Research Agent Runtime — project context

Portfolio project: a production-style agent execution platform. See `README.md`
for the full overview and architecture diagrams.

## Architecture in one breath

Two adapter seams are the whole point:

- **Model** (`src/lib/agent-runtime/model.interface.ts`) — `mock-model` (keyless,
  deterministic) ↔ `anthropic-model` (Claude Opus 4.8).
- **Storage** (`src/lib/storage/store.interface.ts`) — `local.store` (JSON file)
  ↔ `supabase.store` (Postgres).

`src/lib/runtime.ts` is the composition root: it reads `STORAGE_DRIVER` /
`MODEL_DRIVER` and wires the executor. Everything else depends on `getEngine()` /
`getStore()`, never on a concrete driver.

The executor (`executor.ts`) is a **tick state machine**: `advanceRun()` does one
step per call; `/api/runs/[id]/tick` is polled by the UI to drive live execution.

## Conventions

- Zod schemas in `types.ts` are the source of truth; types via `z.infer`.
- Statuses are string-literal unions (not enums) for exhaustive switches.
- Tailwind v4 only (`@theme`, OKLCH tokens) — no `tailwind.config`.
- Server Actions validate input with Zod (they're public endpoints).
- `server-only` guards secret-bearing modules (supabase store, anthropic model,
  runtime root). `local.store` omits it so `pnpm seed` can run under plain Node.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm lint`
- `pnpm seed` — reset + populate `./.data` with demo runs (mock model)
