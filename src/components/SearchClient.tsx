"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FlatLessonItem } from "@/lib/summary";
import { useLocale } from "@/lib/locale";
import StatusBadge from "./StatusBadge";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "") // Arabic diacritics
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SearchClient({ items }: { items: FlatLessonItem[] }) {
  const { locale, t } = useLocale();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return items.filter((item) => {
      const haystack = normalize(
        [
          item.lessonTitle.ar,
          item.lessonTitle.en,
          item.unitTitle.ar,
          item.unitTitle.en,
          item.subjectAr,
          item.subjectEn,
          item.summary?.ar ?? "",
          item.summary?.en ?? "",
        ].join(" "),
      );
      return q.split(" ").every((token) => haystack.includes(token));
    });
  }, [items, query]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black text-slate-900">{t("search.title")}</h1>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.title")}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-brand-500"
      />

      {query.trim() === "" ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          {t("search.placeholder")}
        </p>
      ) : results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          {t("search.noResults")}
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500">
            {t("search.resultsFor")} “{query}” — {results.length}
          </p>
          {results.map((item) => (
            <Link
              key={`${item.subjectId}/${item.lessonId}`}
              href={`/subjects/${item.subjectId}/${item.lessonId}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold leading-snug text-slate-900" dir="auto">
                  {item.lessonTitle[locale]}
                </h2>
                <StatusBadge status={item.contentStatus} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500" dir="auto">
                {item.subjectAr} · {item.unitTitle[locale]}
              </p>
              {item.summary && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-600" dir="auto">
                  {item.summary[locale]}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
