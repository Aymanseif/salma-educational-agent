"use client";

import { useLocale } from "@/lib/locale";
import type { ContentStatus } from "@/lib/content-types";

const COLOR: Record<ContentStatus, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PARTIALLY_VERIFIED: "bg-amber-100 text-amber-800 border-amber-200",
  NOT_YET_IMPORTED: "bg-slate-100 text-slate-600 border-slate-200",
  SOURCE_MISSING: "bg-rose-100 text-rose-700 border-rose-200",
  AI_GENERATED: "bg-violet-100 text-violet-800 border-violet-200",
  OFFICIAL: "bg-sky-100 text-sky-800 border-sky-200",
  TEACHER: "bg-teal-100 text-teal-800 border-teal-200",
  MIXED: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const KEY: Record<ContentStatus, string> = {
  VERIFIED: "lesson.badge.verified",
  PARTIALLY_VERIFIED: "lesson.badge.partiallyVerified",
  NOT_YET_IMPORTED: "lesson.badge.notImported",
  SOURCE_MISSING: "lesson.badge.sourceMissing",
  AI_GENERATED: "lesson.badge.aiGenerated",
  OFFICIAL: "lesson.badge.verified",
  TEACHER: "lesson.badge.aiGenerated",
  MIXED: "lesson.badge.partiallyVerified",
};

export default function StatusBadge({
  status,
  label,
}: {
  status: ContentStatus;
  label?: string;
}) {
  const { t } = useLocale();
  const text = label ?? t(KEY[status] ?? status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5 ${COLOR[status] ?? COLOR.NOT_YET_IMPORTED}`}
    >
      {text}
    </span>
  );
}