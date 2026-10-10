import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizCard from "@/components/QuizCard";
import type { QuizQuestion } from "@/lib/content-types";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    question: { ar: "ما عاصمة مصر؟", en: "What is the capital of Egypt?" },
    options: [
      { ar: "القاهرة", en: "Cairo" },
      { ar: "الإسكندرية", en: "Alexandria" },
    ],
    correctIndex: 0,
    explanation: { ar: "القاهرة هي العاصمة.", en: "Cairo is the capital." },
  },
  {
    id: "q2",
    question: { ar: "كم عدد ألوان العلم المصري؟", en: "How many colors are in the Egyptian flag?" },
    options: [
      { ar: "ثلاثة", en: "Three" },
      { ar: "أربعة", en: "Four" },
    ],
    correctIndex: 0,
    explanation: { ar: "ثلاثة ألوان.", en: "Three colors." },
  },
];

describe("QuizCard", () => {
  it("shows immediate correct feedback after answering", async () => {
    const user = userEvent.setup();
    render(<QuizCard questions={questions} />);

    await user.click(screen.getByText("القاهرة"));
    await user.click(screen.getByText("إرسال الإجابة"));

    expect(screen.getByText(/إجابة صحيحة/)).toBeInTheDocument();
    expect(screen.getByText(/القاهرة هي العاصمة/)).toBeInTheDocument();
  });

  it("shows incorrect feedback and the correct answer emphasis", async () => {
    const user = userEvent.setup();
    render(<QuizCard questions={questions} />);

    await user.click(screen.getByText("الإسكندرية"));
    await user.click(screen.getByText("إرسال الإجابة"));

    expect(screen.getByText(/إجابة غير صحيحة/)).toBeInTheDocument();
  });

  it("completes the quiz and reports the score to the callback", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<QuizCard questions={questions} onComplete={onComplete} />);

    // Question 1 — correct
    await user.click(screen.getByText("القاهرة"));
    await user.click(screen.getByText("إرسال الإجابة"));
    await user.click(screen.getByText("السؤال التالي"));

    // Question 2 — correct
    await user.click(screen.getByText("ثلاثة"));
    await user.click(screen.getByText("إرسال الإجابة"));
    await user.click(screen.getByText("نتيجتك"));

    expect(onComplete).toHaveBeenCalledWith({ correct: 2, total: 2 });
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("renders nothing for an empty question list", () => {
    const { container } = render(<QuizCard questions={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
