"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft">
      <p className="text-4xl" aria-hidden>
        🧭
      </p>
      <h1 className="mt-3 text-xl font-black text-slate-900">404</h1>
      <p className="mt-1 text-sm text-slate-600">{t("empty.title")}</p>
      <p className="mt-1 text-xs text-slate-500">{t("empty.body")}</p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
      >
        {t("nav.home")}
      </Link>
    </div>
  );
}
