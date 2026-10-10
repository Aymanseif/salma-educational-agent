"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  markLessonReviewed as markReviewedPure,
  recordQuiz as recordQuizPure,
  PROGRESS_KEY,
  type ProgressState,
  type QuizRecord,
} from "@/lib/progress";

type ProgressContextValue = {
  state: ProgressState;
  markReviewed: (subjectId: string, lessonId: string, reviewed: boolean) => void;
  recordQuiz: (entry: Omit<QuizRecord, "id" | "at">) => void;
  isLessonReviewed: (subjectId: string, lessonId: string) => boolean;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(emptyProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadProgress());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveProgress(state);
    // Notify other tabs of progress changes.
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const markReviewed = useCallback(
    (subjectId: string, lessonId: string, reviewed: boolean) => {
      setState((prev) => markReviewedPure(prev, subjectId, lessonId, reviewed));
    },
    [],
  );

  const recordQuiz = useCallback(
    (entry: Omit<QuizRecord, "id" | "at">) => {
      setState((prev) => recordQuizPure(prev, entry));
    },
    [],
  );

  const isLessonReviewed = useCallback(
    (subjectId: string, lessonId: string) =>
      Boolean(state.lessons[`${subjectId}/${lessonId}`]),
    [state.lessons],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ state, markReviewed, recordQuiz, isLessonReviewed }),
    [state, markReviewed, recordQuiz, isLessonReviewed],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    // Fallback (e.g., isolated component tests).
    return {
      state: emptyProgress(),
      markReviewed: () => undefined,
      recordQuiz: () => undefined,
      isLessonReviewed: () => false,
    };
  }
  return ctx;
}