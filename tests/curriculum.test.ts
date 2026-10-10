import { describe, it, expect } from "vitest";
import {
  curriculum,
  sourceInventory,
  teacherRegistry,
  subjectIds,
  getUnits,
  getContent,
  flattenLessons,
  getSource,
} from "@/lib/data";
import { validateQuiz } from "@/lib/quiz";
import type { QuizQuestion } from "@/lib/content-types";

const VALID_STATUSES = [
  "VERIFIED",
  "PARTIALLY_VERIFIED",
  "SOURCE_MISSING",
  "NOT_YET_IMPORTED",
];

describe("curriculum registry integrity", () => {
  it("targets the Egyptian Baccalaureate 2026-2027, Grade 2, Arts and Humanities", () => {
    expect(curriculum.academicYear).toBe("2026-2027");
    expect(curriculum.grade.code).toBe("G2");
    expect(curriculum.track.code).toBe("arts-humanities");
  });

  it("registers exactly the four expected subjects with a teacher each", () => {
    const ids = curriculum.subjects.map((s) => s.id).sort();
    expect(ids).toEqual(["arabic", "english", "history", "psychology"]);
    for (const subjectId of ids) {
      const teacher = teacherRegistry.teachers.find(
        (t) => t.subjectId === subjectId,
      );
      expect(teacher, `teacher for ${subjectId}`).toBeTruthy();
    }
  });

  it("uses only known verification statuses", () => {
    for (const subject of curriculum.subjects) {
      expect(VALID_STATUSES).toContain(subject.status);
    }
    for (const source of sourceInventory.sources) {
      expect(VALID_STATUSES).toContain(source.status);
    }
  });

  it("has unique unit and lesson ids across the whole curriculum", () => {
    const unitIds = new Set<string>();
    const lessonIds = new Set<string>();
    for (const subjectId of subjectIds) {
      for (const unit of getUnits(subjectId)) {
        expect(unitIds.has(unit.id), `duplicate unit ${unit.id}`).toBe(false);
        unitIds.add(unit.id);
        for (const lesson of unit.lessons) {
          expect(lessonIds.has(lesson.id), `duplicate lesson ${lesson.id}`).toBe(
            false,
          );
          lessonIds.add(lesson.id);
        }
      }
    }
    expect(lessonIds.size).toBeGreaterThan(0);
  });

  it("gives every lesson a bilingual title and a valid content status", () => {
    for (const flat of flattenLessons()) {
      expect(flat.lesson.title.ar.trim(), `${flat.lesson.id} ar`).not.toBe("");
      expect(flat.lesson.title.en.trim(), `${flat.lesson.id} en`).not.toBe("");
      if (flat.lesson.contentStatus) {
        expect([
          ...VALID_STATUSES,
          "AI_GENERATED",
          "OFFICIAL",
          "TEACHER",
          "MIXED",
        ]).toContain(flat.lesson.contentStatus);
      }
    }
  });

  it("only references source ids that exist in the source inventory", () => {
    for (const flat of flattenLessons()) {
      for (const sourceId of flat.lesson.sourceIds ?? []) {
        expect(getSource(sourceId), `missing source ${sourceId}`).toBeTruthy();
      }
    }
  });

  it("passes structural validation on every bundled quiz", () => {
    const issues: string[] = [];
    for (const flat of flattenLessons()) {
      const questions = (flat.lesson.quizzes ?? []) as QuizQuestion[];
      for (const issue of validateQuiz(questions)) {
        issues.push(`${flat.lesson.id}: ${issue.questionId} — ${issue.issue}`);
      }
    }
    for (const subjectId of subjectIds) {
      for (const supplement of getContent(subjectId)?.supplements ?? []) {
        for (const issue of validateQuiz(supplement.quiz?.questions ?? [])) {
          issues.push(`${supplement.id}: ${issue.questionId} — ${issue.issue}`);
        }
      }
    }
    expect(issues).toEqual([]);
  });

  it("never claims a lesson is VERIFIED unless it carries content or an official source link", () => {
    for (const flat of flattenLessons()) {
      if (flat.lesson.contentStatus === "VERIFIED") {
        const hasContent = (flat.lesson.sections?.length ?? 0) > 0;
        const hasSource = (flat.lesson.sourceIds?.length ?? 0) > 0;
        expect(
          hasContent || hasSource,
          `${flat.lesson.id} marked VERIFIED without content or source`,
        ).toBe(true);
      }
    }
  });

  it("flags all named teachers as unverified identities (no invented bios)", () => {
    for (const teacher of teacherRegistry.teachers) {
      expect(teacher.verification).toBe("UNVERIFIED_IDENTITY");
      expect(teacher.verificationNote.ar.trim()).not.toBe("");
      expect(teacher.verificationNote.en.trim()).not.toBe("");
    }
  });
});
