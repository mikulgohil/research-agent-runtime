import { notFound } from "next/navigation";
import { getStore } from "@/lib/runtime";
import { RunDetailView } from "@/components/runs/run-detail-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getStore().getRunDetail(id);
  return { title: detail ? detail.task.title : "Run" };
}

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getStore().getRunDetail(id);
  if (!detail) notFound();
  return <RunDetailView initial={detail} />;
}
