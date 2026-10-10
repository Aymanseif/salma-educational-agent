import type {
  Bi,
  ContentStatus,
  SubjectContent,
  VerificationStatus,
  Lesson,
} from "./content-types";
import {
  curriculum,
  getContent,
  getSubjectMeta,
  getTeacherForSubject,
  subjectIds,
} from "./data";

export type SubjectSummary = {
  id: string;
  arName: string;
  enName: string;
  category: Bi;
  status: VerificationStatus;
  officialPage: string;
  teacherNameArabic: string | null;
  teacherNameLatin: string | null;
  teacherVerified: boolean;
  totalLessons: number;
  importedLessons: number;
};

function countImported(content: SubjectContent): { total: number; imported: number } {
  let total = 0;
  let imported = 0;
  for (const unit of content.units) {
    for (const lesson of unit.lessons) {
      total += 1;
      if (lesson.contentStatus && lesson.contentStatus !== "NOT_YET_IMPORTED") {
        imported += 1;
      }
    }
  }
  return { total, imported };
}

export function getSubjectSummary(id: string): SubjectSummary | null {
  const meta = getSubjectMeta(id);
  const content = getContent(id);
  if (!meta || !content) return null;
  const teacher = getTeacherForSubject(id);
  const { total, imported } = countImported(content);
  return {
    id,
    arName: meta.arName,
    enName: meta.enName,
    category: meta.category,
    status: meta.status,
    officialPage: meta.officialPage,
    teacherNameArabic: teacher?.nameArabic ?? null,
    teacherNameLatin: teacher?.nameLatin ?? null,
    teacherVerified: teacher?.verification === "VERIFIED",
    totalLessons: total,
    importedLessons: imported,
  };
}

export function getSubjectSummaries(): SubjectSummary[] {
  return subjectIds
    .map(getSubjectSummary)
    .filter((s): s is SubjectSummary => s !== null);
}

export function totalsBySubject(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of subjectIds) {
    const content = getContent(id);
    out[id] = content
      ? content.units.reduce((n, u) => n + u.lessons.length, 0)
      : 0;
  }
  return out;
}

export const academicYear = curriculum.academicYear;

export type FlatLessonItem = {
  subjectId: string;
  subjectAr: string;
  subjectEn: string;
  unitId: string;
  unitTitle: Bi;
  lessonId: string;
  lessonTitle: Bi;
  summary: Bi | null;
  contentStatus: ContentStatus;
};

export function buildFlatLessonItems(): FlatLessonItem[] {
  const items: FlatLessonItem[] = [];
  for (const id of subjectIds) {
    const meta = getSubjectMeta(id);
    const content = getContent(id);
    if (!meta || !content) continue;
    for (const unit of content.units) {
      for (const lesson of unit.lessons as Lesson[]) {
        items.push({
          subjectId: id,
          subjectAr: meta.arName,
          subjectEn: meta.enName,
          unitId: unit.id,
          unitTitle: unit.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          summary: lesson.summary ?? null,
          contentStatus: lesson.contentStatus ?? "NOT_YET_IMPORTED",
        });
      }
    }
  }
  return items;
}