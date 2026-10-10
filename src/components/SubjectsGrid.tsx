"use client";

import Link from "next/link";
import type { SubjectSummary } from "@/lib/summary";
import { useLocale } from "@/lib/locale";
import { useProgress } from "@/lib/progress-context";
import { getSubjectStats } from "@/lib/progress";
import StatusBadge from "./StatusBadge";

export default function SubjectsGrid({
  subjects,
}: {
  subjects: SubjectSummary[];
}) {
  const { locale, t } = useLocale();
  const { state } = useProgress();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black text-slate-900">{t("subjects.title")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("subjects.subtitle")}</p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {subjects.map((subject) => {
          const stats = getSubjectStats(state, subject.id, subject.totalLessons);
          const percent =
            subject.totalLessons === 0
              ? 0
              : Math.round((stats.reviewed / subject.totalLessons) * 100);
          return (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-extrabold leading-snug text-slate-900">
                  {locale === "ar" ? subject.arName : subject.enName}
                </h2>
                <StatusBadge status={subject.status} />
              </div>
              <p className="text-xs text-slate-500">
                {t("subjects.teacher")}:{" "}
                <span className="font-semibold text-slate-700">
                  {locale === "ar"
                    ? subject.teacherNameArabic
                    : subject.teacherNameLatin ?? "—"}
                </span>
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {subject.importedLessons} / {subject.totalLessons}{" "}
                  {t("subject.lessonsCount")}
                </span>
                <span className="font-bold text-brand-700">{percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}