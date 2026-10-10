"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { href: "/", key: "nav.home", icon: "🏠" },
  { href: "/subjects", key: "nav.subjects", icon: "📚" },
  { href: "/search", key: "nav.search", icon: "🔍" },
  { href: "/progress", key: "nav.progress", icon: "📈" },
  { href: "/sources", key: "nav.sources", icon: "🔗" },
] as const;

export default function Header() {
  const { t, dir } = useLocale();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg text-white">
              🎓
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-slate-900">
                {t("app.name")}
              </span>
              <span className="block truncate text-[11px] text-brand-700">
                {t("app.tagline")}
              </span>
            </span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                  active ? "text-brand-700" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span dir={dir}>{t(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}