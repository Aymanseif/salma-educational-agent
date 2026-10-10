"use client";

import { useLocale } from "@/lib/locale";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div
      role="group"
      aria-label={t("lang.toggleLabel")}
      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm"
    >
      <button
        type="button"
        onClick={() => setLocale("ar")}
        aria-pressed={locale === "ar"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "ar"
            ? "bg-brand-600 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {t("lang.arabic")}
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "en"
            ? "bg-brand-600 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {t("lang.english")}
      </button>
    </div>
  );
}