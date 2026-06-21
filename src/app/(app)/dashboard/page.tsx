import { Card, CardBody } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Metrics and recent runs land here in Phase 3.
      </p>
      <Card className="mt-6">
        <CardBody>
          <p className="text-sm text-muted">App shell is wired up.</p>
        </CardBody>
      </Card>
    </div>
  );
}
