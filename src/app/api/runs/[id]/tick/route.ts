import { NextResponse } from "next/server";
import { getEngine, getStore } from "@/lib/runtime";

/**
 * Advance a run by one step and return its fresh detail. The run-detail page
 * polls this on an interval, which is what makes execution appear "live"
 * without a long-lived background worker. No-op when the run is terminal or
 * awaiting human approval.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await getEngine().advanceRun(id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Tick failed" },
      { status: 500 },
    );
  }
  const detail = await getStore().getRunDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
