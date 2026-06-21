import { Card, CardBody } from "@/components/ui/card";
import { NewTaskForm } from "@/components/tasks/new-task-form";

export const metadata = { title: "New task" };

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        New research task
      </h1>
      <p className="mt-1 text-sm text-muted">
        Describe what to research. The runtime builds a plan and executes it
        step by step.
      </p>
      <Card className="mt-6">
        <CardBody>
          <NewTaskForm />
        </CardBody>
      </Card>
    </div>
  );
}
