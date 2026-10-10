import type { QuizQuestion } from "./content-types";

export type QuizAnswers = Record<string, number>;

export type QuizEvaluation = {
  correct: number;
  total: number;
  perQuestion: Record<string, { answered: boolean; correct: boolean }>;
  percent: number;
};

/** Evaluate a set of quiz questions against the given answers. Pure logic. */
export function evaluateQuiz(
  questions: QuizQuestion[],
  answers: QuizAnswers,
): QuizEvaluation {
  const perQuestion: QuizEvaluation["perQuestion"] = {};
  let correct = 0;
  for (const question of questions) {
    const chosen = answers[question.id];
    const answered = typeof chosen === "number" && chosen >= 0;
    const isCorrect = answered && chosen === question.correctIndex;
    if (isCorrect) correct += 1;
    perQuestion[question.id] = { answered, correct: Boolean(isCorrect) };
  }
  const total = questions.length;
  return {
    correct,
    total,
    perQuestion,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}

export type QuizValidationIssue = {
  questionId: string;
  issue: string;
};

/** Structural validation of quiz data (used by automated tests). */
export function validateQuiz(questions: QuizQuestion[]): QuizValidationIssue[] {
  const issues: QuizValidationIssue[] = [];
  for (const q of questions) {
    if (!q.id) issues.push({ questionId: q.id, issue: "missing id" });
    if (!q.options || q.options.length < 2) {
      issues.push({
        questionId: q.id,
        issue: "must have at least 2 options",
      });
      continue;
    }
    if (
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    ) {
      issues.push({
        questionId: q.id,
        issue: `correctIndex ${q.correctIndex} out of range`,
      });
    }
    for (const [i, opt] of q.options.entries()) {
      if (!opt.ar?.trim() || !opt.en?.trim()) {
        issues.push({
          questionId: q.id,
          issue: `option ${i} is missing Arabic or English text`,
        });
      }
    }
    if (!q.question.ar?.trim() || !q.question.en?.trim()) {
      issues.push({ questionId: q.id, issue: "question missing a language" });
    }
    if (!q.explanation.ar?.trim() || !q.explanation.en?.trim()) {
      issues.push({ questionId: q.id, issue: "explanation missing a language" });
    }
  }
  return issues;
}

/** True when a lesson/supplement quiz passes structural validation. */
export function isQuizValid(questions: QuizQuestion[]): boolean {
  return validateQuiz(questions).length === 0;
}