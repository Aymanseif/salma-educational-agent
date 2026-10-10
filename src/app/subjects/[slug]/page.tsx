import { notFound } from "next/navigation";
import SubjectView from "@/components/SubjectView";
import {
  getContent,
  getSubjectMeta,
  getTeacherForSubject,
  getSource,
  subjectIds,
} from "@/lib/data";
import { getSubjectSummary } from "@/lib/summary";

export function generateStaticParams() {
  return subjectIds.map((slug) => ({ slug }));
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getSubjectMeta(slug);
  const content = getContent(slug);
  const summary = getSubjectSummary(slug);
  if (!meta || !content || !summary) notFound();

  const teacher = getTeacherForSubject(slug);
  const officialSources = content.units
    .map((u) => (u.sourceId ? getSource(u.sourceId) : null))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    // de-duplicate by id
    .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);

  return (
    <SubjectView
      summary={summary}
      units={content.units}
      teacher={teacher}
      officialSources={officialSources}
      notImportedNote={content.unitsNotImportedNote ?? null}
      supplements={content.supplements ?? []}
    />
  );
}
