/**
 * Client-side progress store. Pure functions operate on plain state so they
 * can be unit-tested; persistence lives in localStorage.
 */

export const PROGRESS_KEY = "salma.progress.v1";

export type LessonReviewEntry = { reviewedAt: string };
export type QuizRecord = {
  id: string;
  subjectId: string;
  unitId?: string;
  lessonId: string;
  score: number;
  total: number;
  at: string;
};

export type ProgressState = {
  lessons: Record<string, LessonReviewEntry>;
  quizzes: QuizRecord[];
};

export function lessonKey(subjectId: string, lessonId: string): string {
  return `${subjectId}/${lessonId}`;
}

export function emptyProgress(): ProgressState {
  return { lessons: {}, quizzes: [] };
}

/** Pure: mark a lesson as reviewed / unmark it. */
export function markLessonReviewed(
  state: ProgressState,
  subjectId: string,
  lessonId: string,
  reviewed: boolean,
): ProgressState {
  const key = lessonKey(subjectId, lessonId);
  const lessons = { ...state.lessons };
  if (reviewed) {
    lessons[key] = { reviewedAt: new Date().toISOString() };
  } else {
    delete lessons[key];
  }
  return { ...state, lessons };
}

/** Pure: append a quiz attempt record. */
export function recordQuiz(
  state: ProgressState,
  entry: Omit<QuizRecord, "id" | "at">,
): ProgressState {
  const record: QuizRecord = {
    ...entry,
    id: `${entry.subjectId}/${entry.lessonId}/${Date.now()}`,
    at: new Date().toISOString(),
  };
  return { ...state, quizzes: [...state.quizzes, record] };
}

export type SubjectStats = {
  reviewed: number;
  totalLessons: number;
  quizzesTaken: number;
  avgScore: number | null;
  reviewedIds: string[];
};

/** Pure: compute per-subject stats given the number of lessons in that subject. */
export function getSubjectStats(
  state: ProgressState,
  subjectId: string,
  totalLessons: number,
): SubjectStats {
  const reviewedIds = Object.keys(state.lessons)
    .filter((k) => k.startsWith(`${subjectId}/`))
    .map((k) => k.slice(subjectId.length + 1));
  const quizzes = state.quizzes.filter((q) => q.subjectId === subjectId);
  const avgScore =
    quizzes.length === 0
      ? null
      : Math.round(
          quizzes.reduce((sum, q) => sum + (q.total ? q.score / q.total : 0), 0) /
            quizzes.length *
            100,
        );
  return {
    reviewed: reviewedIds.length,
    totalLessons,
    quizzesTaken: quizzes.length,
    avgScore,
    reviewedIds,
  };
}

/** Pure: overall stats across multiple subjects (totalLessons map by subjectId). */
export function getOverallStats(
  state: ProgressState,
  totalsBySubject: Record<string, number>,
): { reviewed: number; quizzesTaken: number; avgScore: number | null } {
  let reviewed = 0;
  let quizzesTaken = 0;
  let scoreSum = 0;
  let scoreWeight = 0;
  for (const subjectId of Object.keys(totalsBySubject)) {
    const stats = getSubjectStats(state, subjectId, totalsBySubject[subjectId]);
    reviewed += stats.reviewed;
    quizzesTaken += stats.quizzesTaken;
    if (stats.avgScore !== null) {
      scoreSum += stats.avgScore;
      scoreWeight += 1;
    }
  }
  return {
    reviewed,
    quizzesTaken,
    avgScore: scoreWeight === 0 ? null : Math.round(scoreSum / scoreWeight),
  };
}

export function isReviewed(state: ProgressState, subjectId: string, lessonId: string): boolean {
  return Boolean(state.lessons[lessonKey(subjectId, lessonId)]);
}

/* ---------------- Persistence (client only) ---------------- */

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    if (!parsed || typeof parsed !== "object") return emptyProgress();
    return {
      lessons: parsed.lessons ?? {},
      quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — ignore */
  }
}