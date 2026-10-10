import { describe, it, expect } from "vitest";
import { evaluateQuiz, validateQuiz, isQuizValid } from "@/lib/quiz";
import type { QuizQuestion } from "@/lib/content-types";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    question: { ar: "س١", en: "Q1" },
    options: [
      { ar: "أ", en: "A" },
      { ar: "ب", en: "B" },
    ],
    correctIndex: 0,
    explanation: { ar: "ش", en: "E" },
  },
  {
    id: "q2",
    question: { ar: "س٢", en: "Q2" },
    options: [
      { ar: "أ", en: "A" },
      { ar: "ب", en: "B" },
    ],
    correctIndex: 1,
    explanation: { ar: "ش", en: "E" },
  },
];

describe("quiz evaluation", () => {
  it("scores all-correct answers at 100%", () => {
    const result = evaluateQuiz(questions, { q1: 0, q2: 1 });
    expect(result.correct).toBe(2);
    expect(result.total).toBe(2);
    expect(result.percent).toBe(100);
  });

  it("scores partial answers correctly", () => {
    const result = evaluateQuiz(questions, { q1: 0, q2: 0 });
    expect(result.correct).toBe(1);
    expect(result.percent).toBe(50);
    expect(result.perQuestion.q2.correct).toBe(false);
  });

  it("treats unanswered questions as incorrect", () => {
    const result = evaluateQuiz(questions, {});
    expect(result.correct).toBe(0);
    expect(result.perQuestion.q1.answered).toBe(false);
  });

  it("returns 0% for an empty quiz without dividing by zero", () => {
    const result = evaluateQuiz([], {});
    expect(result.percent).toBe(0);
  });
});

describe("quiz validation", () => {
  it("accepts a well-formed quiz", () => {
    expect(isQuizValid(questions)).toBe(true);
    expect(validateQuiz(questions)).toEqual([]);
  });

  it("rejects an out-of-range correct index", () => {
    const bad: QuizQuestion[] = [{ ...questions[0], correctIndex: 9 }];
    const issues = validateQuiz(bad);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].issue).toContain("out of range");
  });

  it("rejects options missing a language", () => {
    const bad: QuizQuestion[] = [
      {
        ...questions[0],
        options: [
          { ar: "أ", en: "" },
          { ar: "ب", en: "B" },
        ],
      },
    ];
    expect(validateQuiz(bad).some((i) => i.issue.includes("Arabic or English"))).toBe(
      true,
    );
  });

  it("rejects a single-option question", () => {
    const bad: QuizQuestion[] = [
      { ...questions[0], options: [{ ar: "أ", en: "A" }], correctIndex: 0 },
    ];
    expect(validateQuiz(bad)[0].issue).toContain("at least 2 options");
  });
});
