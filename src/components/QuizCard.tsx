"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/content-types";
import { evaluateQuiz } from "@/lib/quiz";
import { useLocale } from "@/lib/locale";

export type QuizResult = { correct: number; total: number };

export default function QuizCard({
  questions,
  onComplete,
}: {
  questions: QuizQuestion[];
  onComplete?: (result: QuizResult) => void;
}) {
  const { locale, t } = useLocale();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  const question = questions[step];
  if (!question && !finished) return null;

  const chosen = answers[question?.id ?? ""];
  const isSubmitted = submitted[question?.id ?? ""];

  const choose = (optionIndex: number) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  };

  const submit = () => {
    if (!question) return;
    setSubmitted((prev) => ({ ...prev, [question.id]: true }));
  };

  const next = () => {
    if (!question) return;
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      const result = evaluateQuiz(questions, answers);
      setFinished(true);
      onComplete?.({ correct: result.correct, total: result.total });
    }
  };

  const retry = () => {
    setAnswers({});
    setSubmitted({});
    setStep(0);
    setFinished(false);
  };

  const isCorrect = isSubmitted && chosen === question.correctIndex;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      {finished ? (
        (() => {
          const result = evaluateQuiz(questions, answers);
          const passed = result.percent >= 60;
          return (
            <div className="text-center">
              <p className="text-lg font-extrabold text-slate-900">
                {t("lesson.quizScore")}: {result.correct} / {result.total}
              </p>
              <p
                className={`mt-1 text-3xl font-black ${
                  passed ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {result.percent}%
              </p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                {t("lesson.quizRetry")}
              </button>
            </div>
          );
        })()
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-slate-500">
              {step + 1} / {questions.length}
            </p>
            <span className="sr-only">{t("lesson.quizTitle")}</span>
          </div>
          <p className="mb-3 font-bold leading-relaxed text-slate-900">
            {question.question[locale]}
          </p>
          <div className="space-y-2">
            {question.options.map((opt, i) => {
              let cls =
                "border-slate-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50";
              if (isSubmitted) {
                if (i === question.correctIndex) {
                  cls = "border-emerald-300 bg-emerald-50 text-emerald-900";
                } else if (i === chosen && !isCorrect) {
                  cls = "border-rose-300 bg-rose-50 text-rose-900";
                } else {
                  cls = "border-slate-200 bg-white text-slate-400";
                }
              }
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => choose(i)}
                  className={`w-full rounded-xl border px-4 py-3 text-start text-sm font-semibold transition-colors ${cls} ${
                    !isSubmitted && chosen === i ? "border-brand-500 bg-brand-50" : ""
                  }`}
                >
                  {locale === "ar" ? opt.ar : opt.en}
                </button>
              );
            })}
          </div>

          {isSubmitted && (
            <div
              className={`mt-3 rounded-xl border p-3 text-sm ${
                isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              <p className="font-bold">
                {isCorrect ? t("lesson.quizCorrect") : t("lesson.quizWrong")}
              </p>
              <p className="mt-1 text-slate-700">
                <span className="font-semibold">{t("lesson.explanation")}: </span>
                {question.explanation[locale]}
              </p>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {!isSubmitted ? (
              <button
                type="button"
                disabled={typeof chosen !== "number"}
                onClick={submit}
                className="rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("lesson.quizSubmit")}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                {step + 1 < questions.length
                  ? t("lesson.quizNext")
                  : t("lesson.quizScore")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}