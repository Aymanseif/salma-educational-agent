"use client";

import Link from "next/link";
import { useState } from "react";
import type { Supplement } from "@/lib/content-types";
import { useLocale } from "@/lib/locale";
import { speak } from "@/lib/speech";
import AudioReader from "./AudioReader";
import QuizCard from "./QuizCard";
import StatusBadge from "./StatusBadge";

function WordSpeak({ word, lang }: { word: string; lang: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        speak(word, { lang, onEnd: () => setBusy(false) });
      }}
      aria-label={`Listen: ${word}`}
      className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 hover:bg-violet-200"
    >
      {busy ? "⏹" : "🔊"}
    </button>
  );
}

export default function SupplementView({
  supplement,
  subjectId,
}: {
  supplement: Supplement;
  subjectId: string;
}) {
  const { locale, t } = useLocale();
  const lang = supplement.audioLang ?? "en-US";

  return (
    <div className="space-y-5">
      <Link
        href={`/subjects/${subjectId}`}
        className="inline-block text-sm font-bold text-brand-700 hover:underline"
      >
        ← {t("subject.back")}
      </Link>

      <header className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-black text-violet-900" dir="auto">
            {supplement.title[locale]}
          </h1>
          <StatusBadge status={supplement.origin} />
        </div>
        <p className="mt-2 text-xs font-semibold text-violet-700" dir="auto">
          {supplement.label[locale]}
        </p>
      </header>

      {supplement.text && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p
            className="whitespace-pre-line text-base leading-loose text-slate-800"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {locale === "ar" ? supplement.text.ar : supplement.text.en}
          </p>
          <AudioReader text={supplement.text.en} lang={lang} />
        </section>
      )}

      {supplement.vocabulary && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-3 font-extrabold text-slate-900">
            {locale === "ar" ? "المفردات والنطق" : "Vocabulary & pronunciation"}
          </h2>
          <ul className="divide-y divide-slate-100">
            {supplement.vocabulary.map((v) => (
              <li key={v.en} className="flex items-center gap-3 py-2">
                <WordSpeak word={v.en} lang={lang} />
                <span className="font-bold text-slate-900" dir="ltr">
                  {v.en}
                </span>
                <span className="text-xs text-slate-400" dir="ltr">
                  {v.ipa}
                </span>
                <span className="ms-auto text-sm text-slate-600" dir="rtl">
                  {v.ar}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {supplement.quiz && supplement.quiz.questions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-slate-900">
            {t("lesson.quizTitle")}
          </h2>
          <QuizCard questions={supplement.quiz.questions} />
        </section>
      )}
    </div>
  );
}
