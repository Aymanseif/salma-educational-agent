import { notFound } from "next/navigation";
import SupplementView from "@/components/SupplementView";
import { getContent, getSupplement, subjectIds } from "@/lib/data";

export function generateStaticParams() {
  const params: { id: string }[] = [];
  for (const slug of subjectIds) {
    const content = getContent(slug);
    for (const supplement of content?.supplements ?? []) {
      params.push({ id: supplement.id });
    }
  }
  return params;
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  for (const slug of subjectIds) {
    const supplement = getSupplement(slug, id);
    if (supplement) {
      return <SupplementView supplement={supplement} subjectId={slug} />;
    }
  }
  notFound();
}
