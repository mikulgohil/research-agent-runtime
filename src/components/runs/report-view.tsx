import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  HelpCircle,
  Link2,
  type LucideIcon,
} from "lucide-react";
import type { FinalReport } from "@/lib/agent-runtime/types";

function Section({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
  tone: string;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon className={`size-4 ${tone}`} strokeWidth={2} />
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
            <span className={`mt-2 size-1 shrink-0 rounded-full ${tone} bg-current`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ReportView({ report }: { report: FinalReport }) {
  return (
    <div className="space-y-7">
      <div className="rounded-card border border-accent/30 bg-accent-soft/15 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-accent-strong">
          <Lightbulb className="size-4" /> Executive summary
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          {report.executiveSummary}
        </p>
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <Section
          icon={CheckSquare}
          title="Key findings"
          items={report.keyFindings}
          tone="text-info"
        />
        <Section
          icon={TrendingUp}
          title="Opportunities"
          items={report.opportunities}
          tone="text-success"
        />
        <Section
          icon={AlertTriangle}
          title="Risks"
          items={report.risks}
          tone="text-danger"
        />
        <Section
          icon={CheckSquare}
          title="Recommendations"
          items={report.recommendations}
          tone="text-accent-strong"
        />
      </div>

      <Section
        icon={HelpCircle}
        title="Open questions"
        items={report.openQuestions}
        tone="text-warning"
      />

      {report.sourceNotes.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Link2 className="size-4 text-muted" /> Source notes
          </h3>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
            {report.sourceNotes.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-line bg-elevated/40 p-3.5"
              >
                <p className="text-sm font-medium text-ink">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {s.takeaway}
                </p>
                <span className="mt-1.5 block truncate text-[11px] text-subtle">
                  {s.url}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
