"use client";

import { useState, useTransition } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import {
  OUTPUT_FORMATS,
  OUTPUT_FORMAT_LABELS,
  DEPTHS,
  DEPTH_LABELS,
  type Depth,
  type OutputFormat,
} from "@/lib/agent-runtime/types";
import { createTaskAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-lg border border-line-strong bg-elevated/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle focus-visible:border-accent focus-visible:outline-none";

const DEPTH_HINT: Record<Depth, string> = {
  quick: "6 steps · fast overview",
  standard: "8 steps · balanced",
  deep: "9 steps · thorough",
};

const EXAMPLES = [
  {
    title: "AI coding assistant market",
    question:
      "Research the AI coding assistant market and generate an executive report covering key players, differentiation, and where the opportunity is.",
  },
  {
    title: "Supabase vs Firebase",
    question:
      "Compare Supabase and Firebase for a seed-stage startup: pricing, DX, scaling, lock-in, and which to choose.",
  },
];

export function NewTaskForm() {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("executive_brief");
  const [depth, setDepth] = useState<Depth>("standard");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await createTaskAction({
        title,
        question,
        context: context || undefined,
        outputFormat,
        depth,
      });
      // On success the action redirects; we only get here on failure.
      if (result && !result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.error) setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="AI coding assistant market research"
          className={cn(FIELD, "mt-1.5")}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <FieldError id="title-error" messages={errors.title} />
      </div>

      <div>
        <label htmlFor="question" className="block text-sm font-medium text-ink">
          Research question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="What do you want the agent to investigate?"
          className={cn(FIELD, "mt-1.5 resize-y")}
          aria-invalid={!!errors.question}
          aria-describedby={errors.question ? "question-error" : undefined}
        />
        <FieldError id="question-error" messages={errors.question} />
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.title}
              type="button"
              onClick={() => {
                setTitle(ex.title);
                setQuestion(ex.question);
              }}
              className="rounded-full border border-line-strong px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent/60 hover:text-ink"
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="context" className="block text-sm font-medium text-ink">
          Context <span className="text-subtle">(optional)</span>
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={2}
          placeholder="Audience, constraints, or anything that should steer the research."
          className={cn(FIELD, "mt-1.5 resize-y")}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="outputFormat"
            className="block text-sm font-medium text-ink"
          >
            Output format
          </label>
          <select
            id="outputFormat"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className={cn(FIELD, "mt-1.5")}
          >
            {OUTPUT_FORMATS.map((f) => (
              <option key={f} value={f}>
                {OUTPUT_FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-sm font-medium text-ink">Depth</span>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {DEPTHS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDepth(d)}
                aria-pressed={depth === d}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center transition-colors",
                  depth === d
                    ? "border-accent bg-accent-soft/30 text-ink"
                    : "border-line-strong text-muted hover:border-accent/50",
                )}
              >
                <span className="block text-sm font-medium">
                  {DEPTH_LABELS[d]}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight text-subtle">
                  {DEPTH_HINT[d]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {formError && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <AlertCircle className="size-4" /> {formError}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={isPending}>
          <Sparkles className="size-4" />
          {isPending ? "Starting run…" : "Create task & run"}
        </Button>
        <p className="text-xs text-subtle">
          The agent will plan, execute, and pause for your approval.
        </p>
      </div>
    </form>
  );
}

function FieldError({
  id,
  messages,
}: {
  id: string;
  messages?: string[];
}) {
  if (!messages || messages.length === 0) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-danger">
      {messages[0]}
    </p>
  );
}
