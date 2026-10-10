"use client";

import Link from "next/link";
import type { SubjectSummary } from "@/lib/summary";
import { useLocale } from "@/lib/locale";
import { useProgress } from "@/lib/progress-context";
import {
  getSubjectStats,
  getOverallStats,
} from "@/lib/progress";
import ProgressRing from "./ProgressRing";
import StatusBadge from "./StatusBadge";
import type { ContentStatus } from "@/lib/content-types";

export default function ProgressView({
  subjects,
  totals,
  coverage,
}: {
  subjects: SubjectSummary[];
  totals: Record<string, number>;
  coverage: Record<string, number>;
}) {
  const { locale, t } = useLocale();
  const { state } = useProgress();
  const overall = getOverallStats(state, totals);
  const totalLessons = Object.values(totals).reduce((a, b) => a + b, 0);
  const percent =
    totalLessons === 0 ? 0 : Math.round((overall.reviewed / totalLessons) * 100);

  const coverageLabels: { status: ContentStatus; key: string }[] = [
    { status: "VERIFIED", key: "lesson.badge.verified" },
    { status: "AI_GENERATED", key: "lesson.badge.aiGenerated" },
    { status: "NOT_YET_IMPORTED", key: "lesson.badge.notImported" },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black text-slate-900">{t("progress.title")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("progress.subtitle")}</p>
      </header>

      <section className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div>
          <h2 className="font-extrabold text-slate-900">{t("progress.overall")}</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>
              {t("home.stats.lessonsReviewed")}:{" "}
              <span className="font-bold text-slate-900">
                {overall.reviewed} / {totalLessons}
              </span>
            </li>
            <li>
              {t("progress.quizzesTaken")}:{" "}
              <span className="font-bold text-slate-900">
                {overall.quizzesTaken}
              </span>
            </li>
            <li>
              {t("progress.avgScore")}:{" "}
              <span className="font-bold text-slate-900">
                {overall.avgScore === null ? "—" : `${overall.avgScore}%`}
              </span>
            </li>
          </ul>
        </div>
        <ProgressRing value={percent} size={88} stroke={8} />
      </section>

      <section className="space-y-3">
        {subjects.map((subject) => {
          const stats = getSubjectStats(state, subject.id, subject.totalLessons);
          const p =
            subject.totalLessons === 0
              ? 0
              : Math.round((stats.reviewed / subject.totalLessons) * 100);
          return (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-soft hover:border-brand-400"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900">
                  {locale === "ar" ? subject.arName : subject.enName}
                </h3>
                <span className="text-sm font-extrabold text-brand-700">{p}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${p}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {t("progress.reviewed")}: {stats.reviewed} / {subject.totalLessons} ·{" "}
                {t("progress.quizzesTaken")}: {stats.quizzesTaken}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="font-extrabold text-slate-900">
          {t("progress.coverageTitle")}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{t("progress.coverageBody")}</p>
        <ul className="mt-3 space-y-2">
          {coverageLabels.map(({ status, key }) => (
            <li
              key={status}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <StatusBadge status={status} label={t(key)} />
              </span>
              <span className="font-bold text-slate-900">
                {coverage[status] ?? 0}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          {t("progress.translationNote")}
        </p>
      </section>
    </div>
  );
}
