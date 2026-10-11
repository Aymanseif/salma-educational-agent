/**
 * Data access layer. Reads curriculum/registry/source JSON from /content.
 * Keep this layer thin so verified materials can be audited independently.
 */
import type {
  Bi,
  CurriculumRegistry,
  AuditReport,
  SourceInventory,
  Teacher,
  TeacherRegistry,
  SubjectContent,
  Unit,
  Lesson,
  Supplement,
} from "./content-types";

import curriculumJson from "../../content/registry/curriculum.json";
import sourcesJson from "../../content/registry/sources.json";
import teachersJson from "../../content/registry/teachers.json";
import auditReportJson from "../../content/registry/audit-report.json";
import arabicJson from "../../content/subjects/arabic.json";
import englishJson from "../../content/subjects/english.json";
import historyJson from "../../content/subjects/history.json";
import psychologyJson from "../../content/subjects/psychology.json";

export const curriculum = curriculumJson as unknown as CurriculumRegistry;
export const sourceInventory = sourcesJson as unknown as SourceInventory;
export const teacherRegistry = teachersJson as unknown as TeacherRegistry;
export const auditReport = auditReportJson as unknown as AuditReport;

const SUBJECTS: Record<string, SubjectContent> = {
  arabic: arabicJson as unknown as SubjectContent,
  english: englishJson as unknown as SubjectContent,
  history: historyJson as unknown as SubjectContent,
  psychology: psychologyJson as unknown as SubjectContent,
};

export const subjectIds = Object.keys(SUBJECTS);

export function getSubjectMeta(id: string) {
  return curriculum.subjects.find((s) => s.id === id) ?? null;
}

export function getContent(id: string): SubjectContent | null {
  return SUBJECTS[id] ?? null;
}

export function getUnits(subjectId: string): Unit[] {
  return SUBJECTS[subjectId]?.units ?? [];
}

export function getUnit(subjectId: string, unitId: string): Unit | null {
  return getUnits(subjectId).find((u) => u.id === unitId) ?? null;
}

export function getLesson(
  subjectId: string,
  lessonId: string,
): { unit: Unit; lesson: Lesson } | null {
  for (const unit of getUnits(subjectId)) {
    const lesson = unit.lessons.find((l) => l.id === lessonId);
    if (lesson) return { unit, lesson };
  }
  return null;
}

export function getSupplement(
  subjectId: string,
  supplementId: string,
): Supplement | null {
  return (
    SUBJECTS[subjectId]?.supplements?.find((s) => s.id === supplementId) ?? null
  );
}

export type FlatLesson = {
  subjectId: string;
  subjectAr: string;
  subjectEn: string;
  unitId: string;
  unitTitle: Bi;
  lesson: Lesson;
};

export function flattenLessons(): FlatLesson[] {
  const flat: FlatLesson[] = [];
  for (const subjectId of subjectIds) {
    const meta = getSubjectMeta(subjectId);
    if (!meta) continue;
    for (const unit of getUnits(subjectId)) {
      for (const lesson of unit.lessons) {
        flat.push({
          subjectId,
          subjectAr: meta.arName,
          subjectEn: meta.enName,
          unitId: unit.id,
          unitTitle: unit.title,
          lesson,
        });
      }
    }
  }
  return flat;
}

export function getSource(sourceId: string) {
  return (
    sourceInventory.sources.find((s) => s.id === sourceId) ?? null
  );
}

export function getSourcesForLesson(sourceIds: string[] = []) {
  return sourceIds
    .map((id) => getSource(id))
    .filter((s): s is NonNullable<ReturnType<typeof getSource>> => s !== null);
}

export function getTeacherForSubject(subjectId: string): Teacher | null {
  return (
    teacherRegistry.teachers.find((t) => t.subjectId === subjectId) ?? null
  );
}

/** Localized list of statuses for coverage charts. */
export function countContentStatuses() {
  const counts: Record<string, number> = {};
  for (const flat of flattenLessons()) {
    const key = flat.lesson.contentStatus ?? "NOT_YET_IMPORTED";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** Total number of lessons across all subjects (excluding supplements). */
export function totalLessonCount(): number {
  return flattenLessons().length;
}