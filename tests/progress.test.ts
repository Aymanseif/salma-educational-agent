import { describe, it, expect } from "vitest";
import {
  emptyProgress,
  markLessonReviewed,
  recordQuiz,
  getSubjectStats,
  getOverallStats,
  isReviewed,
  lessonKey,
} from "@/lib/progress";

describe("progress store (pure logic)", () => {
  it("marks and unmarks a lesson as reviewed", () => {
    let state = emptyProgress();
    state = markLessonReviewed(state, "arabic", "ar-u1-l1", true);
    expect(isReviewed(state, "arabic", "ar-u1-l1")).toBe(true);
    expect(state.lessons[lessonKey("arabic", "ar-u1-l1")].reviewedAt).toBeTruthy();

    state = markLessonReviewed(state, "arabic", "ar-u1-l1", false);
    expect(isReviewed(state, "arabic", "ar-u1-l1")).toBe(false);
  });

  it("does not mutate the previous state object", () => {
    const state = emptyProgress();
    const next = markLessonReviewed(state, "arabic", "ar-u1-l1", true);
    expect(state.lessons).toEqual({});
    expect(next).not.toBe(state);
  });

  it("records quiz attempts and computes averages per subject", () => {
    let state = emptyProgress();
    state = recordQuiz(state, {
      subjectId: "history",
      lessonId: "hi-u1-l1",
      score: 2,
      total: 2,
    });
    state = recordQuiz(state, {
      subjectId: "history",
      lessonId: "hi-u1-l2",
      score: 0,
      total: 2,
    });
    const stats = getSubjectStats(state, "history", 12);
    expect(stats.quizzesTaken).toBe(2);
    expect(stats.avgScore).toBe(50);
  });

  it("computes overall stats across subjects", () => {
    let state = emptyProgress();
    state = markLessonReviewed(state, "arabic", "a", true);
    state = markLessonReviewed(state, "history", "b", true);
    state = recordQuiz(state, {
      subjectId: "arabic",
      lessonId: "a",
      score: 3,
      total: 3,
    });
    const overall = getOverallStats(state, { arabic: 9, history: 12 });
    expect(overall.reviewed).toBe(2);
    expect(overall.quizzesTaken).toBe(1);
    expect(overall.avgScore).toBe(100);
  });

  it("returns null average when no quizzes were taken", () => {
    const stats = getSubjectStats(emptyProgress(), "english", 0);
    expect(stats.avgScore).toBeNull();
    expect(stats.reviewed).toBe(0);
  });

  it("keeps reviewed lesson ids scoped to the right subject", () => {
    let state = emptyProgress();
    state = markLessonReviewed(state, "arabic", "x", true);
    const history = getSubjectStats(state, "history", 12);
    expect(history.reviewedIds).toEqual([]);
  });
});
