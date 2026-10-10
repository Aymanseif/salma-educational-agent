"use client";

import Link from "next/link";
import type { SubjectSummary } from "@/lib/summary";
import { useLocale } from "@/lib/locale";
import { useProgress } from "@/lib/progress-context";
import { getOverallStats, getSubjectStats } from "@/lib/progress";
import ProgressRing from "./ProgressRing";
import StatusBadge from "./StatusBadge";

export default function HomeDashboard({
  subjects,
  totals,
}: {
  subjects: SubjectSummary[];
  totals: Record<string, number>;
}) {
  const { locale, t } = useLocale();
  const { state } = useProgress();

  const overall = getOverallStats(state, totals);
  const totalLessons = Object.values(totals).reduce((a, b) => a + b, 0);
  const overallPercent =
    totalLessons === 0 ? 0 : Math.round((overall.reviewed / totalLessons) * 100);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-brand-100">{t("app.studentName")}</p>
        <h1 className="mt-1 text-2xl font-black">{t("home.welcome")}</h1>
        <p className="mt-1 text-sm text-brand-100">{t("home.subtitle")}</p>
        <p className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
          {t("app.academicYear")}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900">
              {t("home.overallProgress")}
            </h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <dt className="text-slate-500">{t("home.stats.lessonsReviewed")}:</dt>
                <dd className="font-bold text-slate-900">
                  {overall.reviewed} / {totalLessons}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="text-slate-500">{t("home.stats.quizzes")}:</dt>
                <dd className="font-bold text-slate-900">{overall.quizzesTaken}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="text-slate-500">{t("home.stats.avgScore")}:</dt>
                <dd className="font-bold text-slate-900">
                  {overall.avgScore === null ? "—" : `${overall.avgScore}%`}
                </dd>
              </div>
            </dl>
          </div>
          <ProgressRing value={overallPercent} size={84} stroke={8} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-slate-900">
          {t("home.yourSubjects")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {subjects.map((subject) => {
            const stats = getSubjectStats(state, subject.id, subject.totalLessons);
            const percent =
              subject.totalLessons === 0
                ? 0
                : Math.round((stats.reviewed / subject.totalLessons) * 100);
            const name = locale === "ar" ? subject.arName : subject.enName;
            const teacher = locale === "ar" ? subject.teacherNameArabic : subject.teacherNameLatin;
            return (
              <Link
                key={subject.id}
                href={`/subjects/${subject.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition-colors hover:border-brand-400 hover:bg-brand-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {t("subjects.teacher")}: {teacher ?? "—"}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={subject.status} />
                  </div>
                </div>
                <ProgressRing value={percent} size={56} stroke={6} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}