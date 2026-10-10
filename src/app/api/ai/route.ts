import { NextResponse } from "next/server";
import { getLesson, getSubjectMeta } from "@/lib/data";
import {
  AI_PROVIDERS,
  isAiConfigured,
  resolveConfiguredProviders,
  type ResolvedProvider,
} from "@/lib/ai-providers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AiRequestBody = {
  subjectId?: string;
  lessonId?: string;
  question?: string;
  locale?: "ar" | "en";
};

const SYSTEM_PROMPT = [
  "You are a careful teaching assistant for the Egyptian Baccalaureate (Grade 2, Arts and Humanities track).",
  "Explain ONLY the named lesson. Never invent syllabus items, page numbers, exam content, or textbook wording.",
  "Use only widely accepted, verifiable general knowledge. When something is uncertain, say so plainly instead of guessing.",
  "Begin by stating briefly that the explanation is AI-generated and is not an official textbook quote.",
].join(" ");

// Arabic quality instructions: clear Modern Standard Arabic, correct grammar and
// punctuation, native terminology, age-appropriate structure. This is the main
// lever for "make the AI's Arabic better".
const ARABIC_STYLE = [
  "اكتب باللغة العربية الفصحى الحديثة، بأسلوب واضح ومناسب لطالب في الصف الثاني الثانوي.",
  "التزم بقواعد النحو والصرف والإملاء العربي وبعلامات الترقيم العربية الصحيحة.",
  "استعمل مصطلحات عربية أصيلة، وتجنّب الكلمات الأجنبية والترجمة الحرفية إلا لضرورة؛ وإذا اضطررت لمصطلح أجنبي فاكتبه بين قوسين مع شرحه بالعربية.",
  "نظّم الإجابة في فقرة تمهيدية قصيرة، ثم نقاط موجزة، ثم خلاصة في سطر واحد يبدأ بكلمة «الخلاصة:».",
  "اجعل الجمل قصيرة ومترابطة، وابتعد عن الحشو والتكرار والعبارات العامة بلا معنى.",
  "لا تخلط نصًّا إنجليزيًا داخل الشرح العربي إلا لشرح مصطلح أجنبي.",
].join(" ");

const ENGLISH_STYLE = [
  "Write in clear, concise English suitable for a second-year secondary student.",
  "Use short paragraphs and a brief bullet list, then end with a one-line takeaway.",
].join(" ");

async function callProvider(
  resolved: ResolvedProvider,
  userPrompt: string,
  locale: "ar" | "en",
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const { apiKey, baseUrl, model } = resolved;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        // OpenRouter recommends these; harmless for other providers.
        "HTTP-Referer": "https://salma-educational-agent.local",
        "X-Title": "Salma Educational Agent",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT} ${
              locale === "ar"
                ? `${ARABIC_STYLE} أجب بالعربية حصرًا.`
                : `${ENGLISH_STYLE} Answer in English only.`
            }`,
          },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, status: response.status, error: `upstream_${response.status}` };
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, status: 502, error: "empty_response" };
    return { ok: true, text };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error && error.name === "AbortError" ? "timeout" : "request_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let body: AiRequestBody;
  try {
    body = (await request.json()) as AiRequestBody;
  } catch {
    return NextResponse.json(
      { available: isAiConfigured(), error: "invalid_json" },
      { status: 400 },
    );
  }

  const { subjectId, lessonId, question, locale = "ar" } = body;
  if (!subjectId || !lessonId || !question?.trim()) {
    return NextResponse.json(
      {
        available: isAiConfigured(),
        error: "missing_fields",
        message:
          locale === "ar"
            ? "المعطيات ناقصة: المادة والدرس والسؤال مطلوبة."
            : "Missing fields: subject, lesson, and question are required.",
      },
      { status: 400 },
    );
  }

  const providers = resolveConfiguredProviders();
  if (providers.length === 0) {
    return NextResponse.json(
      {
        available: false,
        error: "ai_not_configured",
        providers: AI_PROVIDERS.filter((p) => p.free).map((p) => ({
          id: p.id,
          name: p.name,
          free: p.free,
          envKeys: p.envKeys,
          docsUrl: p.docsUrl,
        })),
        message:
          locale === "ar"
            ? "لم تُهيَّأ أي خدمة شرح بالذكاء الاصطناعي على الخادم. الشروح الأصلية المضمّنة في التطبيق تبقى متاحة."
            : "No AI explanation provider is configured on the server. The app's bundled original explanations remain available.",
      },
      { status: 501 },
    );
  }

  const meta = getSubjectMeta(subjectId);
  const found = getLesson(subjectId, lessonId);
  if (!meta || !found) {
    return NextResponse.json(
      {
        available: true,
        error: "unknown_lesson",
        message:
          locale === "ar"
            ? "لم يتم العثور على الدرس المطلوب في السجل الموثق."
            : "The requested lesson was not found in the verified registry.",
      },
      { status: 404 },
    );
  }

  const userPrompt = [
    `Subject: ${meta.enName} (${meta.arName}).`,
    `Lesson: ${found.lesson.title.en} / ${found.lesson.title.ar}.`,
    `Question: ${question}`,
  ].join("\n");

  // Walk the free-first list; fall back automatically on failure.
  const attempts: { id: string; model: string; error: string }[] = [];
  for (const resolved of providers) {
    const result = await callProvider(resolved, userPrompt, locale);
    if (result.ok) {
      return NextResponse.json({
        available: true,
        label: "AI_GENERATED",
        provider: resolved.provider.id,
        providerName: resolved.provider.name,
        free: resolved.provider.free,
        model: resolved.model,
        attempts,
        text: result.text,
      });
    }
    attempts.push({
      id: resolved.provider.id,
      model: resolved.model,
      error: result.error,
    });
  }

  return NextResponse.json(
    {
      available: true,
      error: "all_providers_failed",
      attempts,
      message:
        locale === "ar"
          ? "تعذّر الحصول على شرح من أي مزوّد الآن. حاول لاحقًا."
          : "Could not obtain an explanation from any provider right now. Please try again later.",
    },
    { status: 502 },
  );
}

export function GET() {
  const configured = resolveConfiguredProviders();
  return NextResponse.json({
    available: configured.length > 0,
    method: "POST",
    order: configured.map((c) => ({ id: c.provider.id, model: c.model, free: c.provider.free })),
    body: {
      subjectId: "string",
      lessonId: "string",
      question: "string",
      locale: "ar|en",
    },
    freeProviders: AI_PROVIDERS.filter((p) => p.free).map((p) => p.id),
  });
}
