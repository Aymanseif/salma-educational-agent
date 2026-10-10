"use client";

import { useEffect, useRef, useState } from "react";
import { speak, isSpeechSupported, stopSpeaking } from "@/lib/speech";
import { useLocale } from "@/lib/locale";

/**
 * Browser audio playback via the Web Speech API. No OS-specific commands.
 */
export default function AudioReader({
  text,
  lang,
}: {
  text: string;
  lang?: string;
}) {
  const { t } = useLocale();
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const cancelRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    setSupported(isSpeechSupported());
    return () => {
      stopSpeaking();
    };
  }, []);

  const toggle = () => {
    if (speaking) {
      cancelRef.current?.();
      setSpeaking(false);
      return;
    }
    if (!text.trim()) return;
    cancelRef.current = speak(text, {
      lang: lang ?? "ar-SA",
      onEnd: () => setSpeaking(false),
    });
    setSpeaking(true);
  };

  if (!supported) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        {t("lesson.audioUnavailable")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-soft transition-colors hover:bg-brand-700"
      >
        <span aria-hidden>{speaking ? "⏹" : "🔊"}</span>
        {speaking ? t("lesson.audioStop") : t("lesson.audioPlay")}
      </button>
      <span className="text-[11px] text-slate-500">{t("lesson.audioNote")}</span>
    </div>
  );
}