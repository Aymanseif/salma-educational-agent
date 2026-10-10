import { notFound } from "next/navigation";
import LessonViewer from "@/components/LessonViewer";
import {
  getContent,
  getLesson,
  getSource,
  getUnits,
  subjectIds,
} from "@/lib/data";

export function generateStaticParams() {
  const params: { slug: string; lessonId: string }[] = [];
  for (const slug of subjectIds) {
    for (const lesson of getUnits(slug).flatMap((u) => u.lessons)) {
      params.push({ slug, lessonId: lesson.id });
    }
  }
  return params;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const found = getLesson(slug, lessonId);
  const content = getContent(slug);
  if (!found || !content) notFound();

  const { unit, lesson } = found;

  // Build ordered lesson list for prev/next navigation.
  const ordered = getUnits(slug).flatMap((u) =>
    u.lessons.map((l) => ({ unitId: u.id, lessonId: l.id })),
  );
  const index = ordered.findIndex((x) => x.lessonId === lessonId);
  const prev =
    index > 0 ? `/subjects/${slug}/${ordered[index - 1].lessonId}` : null;
  const next =
    index >= 0 && index < ordered.length - 1
      ? `/subjects/${slug}/${ordered[index + 1].lessonId}`
      : null;

  const sourceIds =
    lesson.sourceIds && lesson.sourceIds.length > 0
      ? lesson.sourceIds
      : unit.sourceId
        ? [unit.sourceId]
        : [];
  const sources = sourceIds
    .map(getSource)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <LessonViewer
      subjectId={slug}
      unit={unit}
      lesson={lesson}
      sources={sources}
      prevHref={prev}
      nextHref={next}
    />
  );
}
