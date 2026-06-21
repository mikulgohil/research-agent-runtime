import { Database, Cpu, TriangleAlert } from "lucide-react";
import { getRuntimeConfig } from "@/lib/runtime";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const cfg = getRuntimeConfig();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Runtime configuration, resolved from environment variables at startup.
      </p>

      {cfg.anthropicFellBackToMock && (
        <div className="mt-5 flex items-start gap-2 rounded-card border border-warning/40 bg-warning-soft/15 p-4 text-sm text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            <code>MODEL_DRIVER=anthropic</code> is set but no{" "}
            <code>ANTHROPIC_API_KEY</code> was found — falling back to the mock
            model.
          </span>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Cpu className="size-4 text-accent-strong" /> Model
            </span>
          </CardTitle>
        </CardHeader>
        <CardBody className="divide-y divide-line py-1">
          <Row
            label="Driver"
            value={
              <Badge tone={cfg.modelIsLive ? "success" : "neutral"}>
                {cfg.modelDriver}
              </Badge>
            }
          />
          <Row label="Model" value={<code className="text-xs">{cfg.modelName}</code>} />
          <Row
            label="Mode"
            value={cfg.modelIsLive ? "Live (real Claude)" : "Deterministic mock"}
          />
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Database className="size-4 text-accent-strong" /> Storage
            </span>
          </CardTitle>
        </CardHeader>
        <CardBody className="divide-y divide-line py-1">
          <Row
            label="Driver"
            value={<Badge tone="neutral">{cfg.storageDriver}</Badge>}
          />
          <Row
            label="Persistence"
            value={
              cfg.storageDriver === "supabase"
                ? "Supabase (Postgres)"
                : "Local JSON file (./.data)"
            }
          />
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Environment variables</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted">
            Configure these in <code>.env.local</code> (see{" "}
            <code>env.example</code>). All have safe defaults — the app runs with
            zero configuration.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["STORAGE_DRIVER", "local | supabase"],
              ["MODEL_DRIVER", "mock | anthropic"],
              ["ANTHROPIC_API_KEY", "required when MODEL_DRIVER=anthropic"],
              ["NEXT_PUBLIC_SUPABASE_URL", "required when STORAGE_DRIVER=supabase"],
              ["SUPABASE_SERVICE_ROLE_KEY", "required when STORAGE_DRIVER=supabase"],
            ].map(([key, desc]) => (
              <div key={key} className="flex flex-wrap items-baseline gap-x-3">
                <code className="text-xs text-accent-strong">{key}</code>
                <span className="text-xs text-subtle">{desc}</span>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
