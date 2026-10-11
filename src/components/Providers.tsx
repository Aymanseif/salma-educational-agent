"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/locale";
import { ProgressProvider } from "@/lib/progress-context";
import { AuthProvider } from "@/lib/auth-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ProgressProvider>
        <AuthProvider>{children}</AuthProvider>
      </ProgressProvider>
    </LocaleProvider>
  );
}