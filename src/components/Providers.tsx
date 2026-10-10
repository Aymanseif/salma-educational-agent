"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/locale";
import { ProgressProvider } from "@/lib/progress-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </LocaleProvider>
  );
}