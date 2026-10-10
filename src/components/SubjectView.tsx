"use client";

import Link from "next/link";
import type {
  Bi,
  Supplement,
  Teacher,
  Unit,
  SourceInventory,
} from "@/lib/content-types";
import type { SubjectSummary } from "@/lib/summary";
import { useLocale } from "@/lib/locale";
import { useProgress } from "@/lib/progress-context";
import { getSubjectStats } from "@/lib/progress";
import StatusBadge from "./StatusBadge";
import ProgressRing from "./ProgressRing";

export default function SubjectView({
  summary,
  units,
  teacher,
  officialSources,
  notImportedNote,
  supplements,
}: {
  summary: SubjectSummary;
  units: Unit[];
  teacher: Teacher | null;
  officialSources: SourceInventory["sources"];
  notImportedNote: Bi | null;
  supplements: Supplement[];
}) {
  const { locale, t } = useLocale();
  const { state } = useProgress();
  const stats = getSubjectStats(state, summary.id, summary.totalLessons);
  const percent =
    summary.totalLessons === 0
      ? 0
      : Math.round((stats.reviewed / summary.totalLessons) * 100);

  const name = locale === "ar" ? summary.arName : summary.enName;

  return (
    <div className="space-y-5">
      <Link
        href="/subjects"
        className="inline-block text-sm font-bold text-brand-700 hover:underline"
      >
        ← {t("subject.back")}
      </Link>

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-snug text-slate-900">
              {name}
            </h1>
            <p className="mt-1 text-xs text-slate-500" dir="auto">
              {summary.category[locale]}
            </p>
          </div>
          <StatusBadge status={summary.status} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500">
              {t("subjects.teacher")}
            </p>
            <p className="truncate font-bold text-slate-900" dir="auto">
              {teacher
                ? locale === "ar"
                  ? teacher.nameArabic
                  : teacher.nameLatin
                : "—"}
            </p>
            {teacher && teacher.verification !== "VERIFIED" && (
              <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                ⚠ {t("subjects.teacherUnverified")}
              </p>
            )}
          </div>
          <ProgressRing value={percent} size={72} stroke={7} />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {t("subject.progress")}: {stats.reviewed} / {summary.totalLessons}{" "}
          {t("subject.lessonsCount")}
        </p>
      </header>

      {teacher && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          <p className="font-bold">{t("subject.teacherLinks")}</p>
          <p className="mt-1" dir="auto">
            {teacher.verificationNote[locale]}
          </p>
          {teacher.voiceUrl && (
            <a
              href={teacher.voiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700"
            >
              🎤 {t("subject.teacherVoice")} ↗
            </a>
          )}
          {teacher.candidateResources.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {teacher.candidateResources.map((r) => (
                <li
                  key={r.url}
                  className="rounded-lg bg-white/70 p-2"
                >
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-brand-700 hover:underline"
                    dir="auto"
                  >
                    {r.label} ↗
                  </a>
                  <span
                    className={`ms-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.attributionSubstantiated
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {r.attributionSubstantiated
                      ? t("subject.teacherMatchStrong")
                      : t("subject.teacherMatchPartial")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-amber-800">
            {t("subject.teacherLinksNote")}
          </p>
        </section>
      )}

      {/* Units */}
      {units.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">
            {t("subject.units")}
          </h2>
          {units.map((unit) => (
            <div
              key={unit.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-extrabold leading-snug text-slate-900" dir="auto">
                  {unit.title[locale]}
                </h3>
                {unit.titleStatus && <StatusBadge status={unit.titleStatus} />}
              </div>
              {unit.description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600" dir="auto">
                  {unit.description[locale]}
                </p>
              )}
              {unit.titleNote && (
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-800">
                  {unit.titleNote[locale]}
                </p>
              )}
              <ul className="mt-3 divide-y divide-slate-100">
                {unit.lessons.map((lesson) => {
                  const reviewed = Boolean(
                    state.lessons[`${summary.id}/${lesson.id}`],
                  );
                  const imported =
                    lesson.contentStatus &&
                    lesson.contentStatus !== "NOT_YET_IMPORTED";
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/subjects/${summary.id}/${lesson.id}`}
                        className="flex items-center justify-between gap-2 py-3 transition-colors hover:text-brand-700"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              reviewed
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                            aria-hidden
                          >
                            {reviewed ? "✓" : lesson.order ?? ""}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-800" dir="auto">
                              {lesson.title[locale]}
                            </span>
                            {!imported && (
                              <span className="text-[11px] text-slate-400">
                                {t("subjects.notImportedLabel")}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 text-slate-400">›</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-3xl" aria-hidden>
            📭
          </p>
          <h2 className="mt-2 font-extrabold text-slate-800">
            {t("subject.noLessonsYet")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-600">
            {notImportedNote ? notImportedNote[locale] : t("subject.noLessonsYetBody")}
          </p>
        </section>
      )}

      {/* Supplements (e.g., English practice) */}
      {supplements.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-slate-900">
            {t("subject.supplements")}
          </h2>
          {supplements.map((sup) => (
            <div
              key={sup.id}
              className="rounded-2xl border border-violet-200 bg-violet-50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-extrabold text-violet-900" dir="auto">
                  {sup.title[locale]}
                </h3>
                <StatusBadge status={sup.origin} />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-violet-700" dir="auto">
                {sup.label[locale]}
              </p>
              {sup.text && (
                <p
                  className="mt-2 rounded-xl bg-white p-3 text-sm leading-relaxed text-slate-700"
                  dir={locale === "ar" ? "rtl" : "ltr"}
                >
                  {locale === "ar" ? sup.text.ar : sup.text.en}
                </p>
              )}
              {sup.vocabulary && (
                <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {sup.vocabulary.map((v) => (
                    <li
                      key={v.en}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5 text-xs"
                    >
                      <span className="font-bold text-slate-800" dir="ltr">
                        {v.en}
                      </span>
                      <span className="text-slate-400" dir="ltr">
                        {v.ipa}
                      </span>
                      <span className="text-slate-600" dir="rtl">
                        {v.ar}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3">
                <Link
                  href={`/practice/${sup.id}`}
                  className="inline-block rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
                >
                  {t("subjects.view")}
                </Link>
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Official resources */}
      {officialSources.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-3 font-extrabold text-slate-900">
            {t("subject.officialResources")}
          </h2>
          <ul className="space-y-2">
            {officialSources.map((src) => (
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
                    <span className="block text-[11px] text-slate-500">
                      {src.status}
                    </span>
                  </span>
                  <span className="shrink-0 text-brand-700">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
