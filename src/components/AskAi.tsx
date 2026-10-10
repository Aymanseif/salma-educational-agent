"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale";

type AiResponse = {
  available?: boolean;
  label?: string;
  provider?: string;
  providerName?: string;
  free?: boolean;
  model?: string;
  text?: string;
  message?: string;
  error?: string;
};

/**
 * Optional "Ask AI" box. Calls the server-side /api/ai endpoint, which
 * walks a FREE-FIRST list of configured LLM providers. When no provider is
 * configured the endpoint returns a graceful message and this component just
 * displays it — the lesson itself is unaffected.
 */
export default function AskAi({
  subjectId,
  lessonId,
}: {
  subjectId: string;
  lessonId: string;
}) {
  const { locale, t } = useLocale();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);

  const ask = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId, lessonId, question, locale }),
      });
      const data = (await response.json()) as AiResponse;
      setResult(data);
    } catch {
      setResult({
        available: false,
        message:
          locale === "ar"
            ? "تعذّر الاتصال بالخادم."
            : "Could not reach the server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-extrabold text-slate-900">
          {locale === "ar" ? "اسأل مساعدًا ذكيًا" : "Ask an AI assistant"}
        </h2>
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
          AI_GENERATED
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        {locale === "ar"
          ? "شرح اختياري بالذكاء الاصطناعي — ليس نصًا رسميًا من الكتاب. يعمل عند تهيئة مزوّد على الخادم."
          : "Optional AI-generated explanation — not an official textbook text. Works when a provider is configured on the server."}
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void ask();
          }}
          placeholder={
            locale === "ar" ? "اكتب سؤالك حول الدرس…" : "Type your question about the lesson…"
          }
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="button"
          onClick={() => void ask()}
          disabled={loading || !question.trim()}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading
            ? locale === "ar"
              ? "جارٍ…"
              : "Thinking…"
            : locale === "ar"
              ? "اسأل"
              : "Ask"}
        </button>
      </div>

      {result && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          {result.text ? (
            <>
              <p className="mb-1 text-[11px] font-bold text-violet-700">
                {result.providerName ?? "AI"}
                {result.free ? " · free tier" : ""}
                {result.model ? ` · ${result.model}` : ""}
              </p>
              <p className="whitespace-pre-line leading-relaxed text-slate-700" dir="auto">
                {result.text}
              </p>
            </>
          ) : (
            <p className="leading-relaxed text-amber-800" dir="auto">
              {result.message ??
                (result.available === false
                  ? locale === "ar"
                    ? "خدمة الذكاء الاصطناعي غير مُهيَّأة."
                    : "AI service is not configured."
                  : t("common.error"))}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
