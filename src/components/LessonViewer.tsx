"use client";

import Link from "next/link";
import type { Lesson, LessonSection, Unit, Locale } from "@/lib/content-types";
import type { SourceInventory } from "@/lib/content-types";
import { useLocale } from "@/lib/locale";
import { useProgress } from "@/lib/progress-context";
import StatusBadge from "./StatusBadge";
import Visual from "./Visual";
import AudioReader from "./AudioReader";
import QuizCard from "./QuizCard";
import AskAi from "./AskAi";

function sectionText(sec: LessonSection, locale: Locale): string {
  return locale === "ar" ? sec.ar ?? "" : sec.en ?? "";
}

function fullLessonText(lesson: Lesson, locale: Locale): string {
  return (lesson.sections ?? [])
    .map((s) => sectionText(s, locale))
    .filter(Boolean)
    .join(" ");
}

export default function LessonViewer({
  subjectId,
  unit,
  lesson,
  sources,
  prevHref,
  nextHref,
}: {
  subjectId: string;
  unit: Unit;
  lesson: Lesson;
  sources: SourceInventory["sources"];
  prevHref: string | null;
  nextHref: string | null;
}) {
  const { locale, t } = useLocale();
  const { isLessonReviewed, markReviewed, recordQuiz } = useProgress();
  const reviewed = isLessonReviewed(subjectId, lesson.id);

  const imported = lesson.contentStatus !== "NOT_YET_IMPORTED" && lesson.sections;

  return (
    <article className="space-y-5">
      {/* Title */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <p className="mb-1 text-xs font-bold text-brand-700" dir="auto">
          {unit.title[locale]}
        </p>
        <h1 className="text-xl font-black leading-snug text-slate-900" dir="auto">
          {lesson.title[locale]}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {lesson.titleStatus && (
            <StatusBadge status={lesson.titleStatus} />
          )}
          {lesson.contentStatus && lesson.contentStatus !== "NOT_YET_IMPORTED" && (
            <StatusBadge status={lesson.contentStatus} />
          )}
          <button
            type="button"
            onClick={() => markReviewed(subjectId, lesson.id, !reviewed)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
              reviewed
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {reviewed ? t("lesson.markReviewedDone") : t("lesson.markReviewed")}
          </button>
        </div>
        {lesson.titleNote && (
          <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs leading-relaxed text-amber-800">
            {lesson.titleNote[locale]}
          </p>
        )}
        {lesson.summary && (
          <p className="mt-3 leading-relaxed text-slate-600" dir="auto">
            {lesson.summary[locale]}
          </p>
        )}
      </header>

      {lesson.contentNote && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs leading-relaxed text-violet-900">
          <span className="font-bold">{t("lesson.contentNote")}: </span>
          <span dir="auto">{lesson.contentNote[locale]}</span>
        </div>
      )}

      {/* Body */}
      {imported ? (
        <>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            {lesson.sections?.map((sec, i) => {
              const text = sectionText(sec, locale);
              switch (sec.type) {
                case "heading":
                  return (
                    <h2
                      key={i}
                      className="pt-2 text-lg font-extrabold text-slate-900"
                      dir="auto"
                    >
                      {text}
                    </h2>
                  );
                case "list":
                  return (
                    <ul key={i} className="list-disc space-y-1 ps-5 text-slate-700">
                      {sec.items?.map((it, j) => (
                        <li key={j} dir="auto" className="leading-relaxed">
                          {locale === "ar" ? it.ar : it.en}
                        </li>
                      ))}
                    </ul>
                  );
                case "example":
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-relaxed text-sky-900"
                      dir="auto"
                    >
                      <span className="font-bold">💡 </span>
                      {text}
                    </div>
                  );
                case "keypoint":
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold leading-relaxed text-emerald-900"
                      dir="auto"
                    >
                      🎯 {text}
                    </div>
                  );
                case "quote":
                  return (
                    <blockquote
                      key={i}
                      className="border-s-4 border-brand-400 bg-brand-50 p-3 text-sm italic text-slate-700"
                      dir="auto"
                    >
                      {text}
                    </blockquote>
                  );
                case "visual":
                  return sec.visualId ? (
                    <div key={i} className="pt-1">
                      <Visual visualId={sec.visualId} />
                    </div>
                  ) : null;
                default:
                  return (
                    <p key={i} className="leading-relaxed text-slate-700" dir="auto">
                      {text}
                    </p>
                  );
              }
            })}
          </div>

          <AudioReader
            text={fullLessonText(lesson, locale)}
            lang={lesson.audio?.[locale] ?? (locale === "ar" ? "ar-SA" : "en-US")}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-3xl" aria-hidden>
            ⏳
          </p>
          <h2 className="mt-2 font-extrabold text-slate-800">
            {t("lesson.notImported")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-600">
            {t("lesson.notImportedBody")}
          </p>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-3 font-extrabold text-slate-900">
            {t("lesson.relatedResources")}
          </h2>
          <ul className="space-y-2">
            {sources.map((src) => (
              <li key={src.id}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm hover:border-brand-400 hover:bg-brand-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-800" dir="auto">
                      {src.title[locale]}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {src.status} · {t("sources.checkedOn")}: {src.accessed ?? "—"}
                    </span>
                  </span>
                  <span className="shrink-0 text-brand-700">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quiz */}
      {lesson.quizzes && lesson.quizzes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-slate-900">
            {t("lesson.quizTitle")}
          </h2>
          <QuizCard
            questions={lesson.quizzes}
            onComplete={(result) =>
              recordQuiz({
                subjectId,
                unitId: unit.id,
                lessonId: lesson.id,
                score: result.correct,
                total: result.total,
              })
            }
          />
        </section>
      )}

      {imported && <AskAi subjectId={subjectId} lessonId={lesson.id} />}

      {/* Prev / next */}
      <nav className="flex items-center justify-between gap-3 pb-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            ← {t("lesson.prev")}
          </Link>
        ) : (
          <span />
        )}
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
          >
            {t("lesson.next")} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}