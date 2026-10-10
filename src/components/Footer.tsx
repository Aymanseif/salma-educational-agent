"use client";

import { useLocale } from "@/lib/locale";

export default function Footer() {
  const { t } = useLocale();
  return (
    <footer className="mx-auto max-w-2xl px-4 pb-28 pt-4 text-center">
      <p className="text-[11px] leading-relaxed text-slate-500">
        {t("footer.disclaimer")}
      </p>
      <p className="mt-2 text-[11px] text-slate-400">{t("footer.rights")}</p>
    </footer>
  );
}