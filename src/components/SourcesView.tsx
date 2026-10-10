"use client";

import type { SourceInventory, Teacher } from "@/lib/content-types";
import { useLocale } from "@/lib/locale";
import StatusBadge from "./StatusBadge";

export default function SourcesView({
  sources,
  candidates,
  teachers,
  checkedOn,
}: {
  sources: SourceInventory["sources"];
  candidates: SourceInventory["teacherResourceCandidates"];
  teachers: Teacher[];
  checkedOn: string;
}) {
  const { locale, t } = useLocale();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black text-slate-900">{t("sources.title")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("sources.subtitle")}</p>
        <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
          {t("sources.checkedOn")}: {checkedOn}
        </p>
      </header>

      <section className="space-y-3">
        {sources.map((src) => (
          <div
            key={src.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold leading-snug text-slate-900" dir="auto">
                {src.title[locale]}
              </h2>
              <StatusBadge status={src.status} />
            </div>
            {src.publisher && (
              <p className="mt-1 text-[11px] text-slate-500" dir="auto">
                {src.publisher}
              </p>
            )}
            {src.coverage && (
              <p className="mt-2 text-xs leading-relaxed text-slate-600" dir="auto">
                <span className="font-semibold">{t("sources.coverage")}: </span>
                {src.coverage[locale]}
              </p>
            )}
            {src.reuse && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500" dir="auto">
                <span className="font-semibold">{t("sources.reuse")}: </span>
                {src.reuse}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              {typeof src.checkedHttp === "number" && <span>HTTP {src.checkedHttp}</span>}
              {typeof src.sizeBytes === "number" && (
                <span>{(src.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
              )}
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-auto font-bold text-brand-700 hover:underline"
              >
                {t("sources.open")} ↗
              </a>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-extrabold text-amber-900">
          {t("sources.teachersSection")}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">
          {t("sources.teachersNote")}
        </p>
        <ul className="mt-3 space-y-3">
          {teachers.map((teacher) => {
            const candidate = candidates.find(
              (c) => c.teacherId === teacher.id,
            );
            return (
              <li
                key={teacher.id}
                className="rounded-xl border border-amber-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900" dir="auto">
                      {teacher.nameArabic}
                    </p>
                    <p className="text-[11px] text-slate-500" dir="auto">
                      {teacher.subject[locale]}
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    {teacher.verification}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-600" dir="auto">
                  {teacher.verificationNote[locale]}
                </p>
                {candidate?.candidate ? (
                  <div className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">
                    <p className="font-bold">{t("sources.candidate")}</p>
                    <p className="mt-0.5" dir="auto">
                      {candidate.candidate.platform} — {candidate.candidate.channel}
                    </p>
                    <p className="mt-0.5" dir="auto">
                      {candidate.candidate.note}
                    </p>
                    <a
                      href={candidate.candidate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block font-bold text-brand-700 hover:underline"
                    >
                      {t("sources.open")} ↗
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">
                    {candidate?.note}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
