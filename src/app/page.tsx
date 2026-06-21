import Link from "next/link";
import {
  Hexagon,
  ArrowRight,
  GitBranch,
  Activity,
  ShieldCheck,
  Gauge,
  Boxes,
  Workflow,
} from "lucide-react";

const FEATURES = [
  {
    icon: Workflow,
    title: "Plan → Execute → Review",
    body: "Tasks are decomposed into a typed plan, executed step-by-step through a runtime state machine, and paused for human approval before the final report.",
  },
  {
    icon: Activity,
    title: "First-class observability",
    body: "Every run tracks step status, latency, retries, structured logs, token usage, and estimated cost — the kind of telemetry agent platforms live on.",
  },
  {
    icon: ShieldCheck,
    title: "Human-in-the-loop",
    body: "Runs halt at a review gate. Approve to generate the report, or reject with reviewer notes — control that real agent systems require.",
  },
  {
    icon: Boxes,
    title: "Swappable adapters",
    body: "A Model interface (mock ↔ Claude) and a Storage interface (local file ↔ Supabase) keep the engine identical from laptop demo to production.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="relative">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent-strong">
            <Hexagon className="size-4.5" strokeWidth={2.2} />
          </span>
          <span className="text-sm font-semibold">Research Agent Runtime</span>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/60 hover:text-ink"
        >
          Open app <ArrowRight className="size-4" />
        </Link>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pt-16 pb-20 md:px-8 md:pt-24">
        <div className="max-w-3xl animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/60 px-3 py-1 text-xs font-medium text-muted">
            <GitBranch className="size-3.5 text-accent-strong" />
            Agent execution platform · not a chatbot
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Mission control for{" "}
            <span className="text-accent-strong">research agents</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted text-pretty">
            Give the runtime a research question. It builds a plan, runs each
            step through an observable execution engine, pauses for your
            approval, then produces a structured executive report — with full
            run history, logs, and cost tracking.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm shadow-accent/20 transition-colors hover:bg-accent-strong"
            >
              Create a research task <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent/60"
            >
              <Gauge className="size-4" /> View dashboard
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-card border border-line bg-surface/60 p-6 backdrop-blur-sm"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent-strong">
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 py-8 text-xs text-subtle md:px-8">
        Built as a portfolio project · Next.js 16 · TypeScript · Tailwind v4 ·
        adapter-based agent runtime
      </footer>
    </div>
  );
}
