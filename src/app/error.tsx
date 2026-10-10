"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useLocale } from "@/lib/locale";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <ErrorBoundary
        fallbackTitle={t("error.title")}
        fallbackBody={t("error.body")}
      >
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-3xl" aria-hidden>
            ⚠️
          </p>
          <h2 className="mt-2 font-extrabold text-rose-900">{t("error.title")}</h2>
          <p className="mt-1 text-sm text-rose-800">{t("error.body")}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
          >
            {t("common.retry")}
          </button>
        </div>
      </ErrorBoundary>
      {error.digest && (
        <p className="text-center text-[11px] text-slate-400">
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
