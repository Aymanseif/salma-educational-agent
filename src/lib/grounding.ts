/**
 * AI grounding layer.
 *
 * Makes the optional AI explanations genuinely smarter and safer without
 * fabricating anything:
 *  - it builds a compact "lesson brief" from the app's OWN verified content
 *    (unit/lesson titles, status, summary, key points, official sources) and
 *    injects it into the prompt, so answers stay anchored to the named lesson;
 *  - it injects the human-reviewed `ai-guidance.json` rules (global + subject
 *    specific + a small terminology glossary).
 *
 * Nothing here quotes the official textbook: the brief is derived from the
 * app-authored study aid and the verified title metadata.
 */
import type { Lesson, Locale } from "./content-types";
import { curriculum, getLesson, getSource, getSubjectMeta } from "./data";
import aiGuidanceJson from "../../content/registry/ai-guidance.json";

export type GuidanceRuleSet = { ar: string[]; en: string[] };

export type GlossaryEntry = {
  subjects: string[];
  term: { ar: string; en: string };
  note: { ar: string; en: string };
};

export type AiGuidance = {
  version: number;
  updatedOn: string;
  policy: { ar: string; en: string };
  rules: { global: GuidanceRuleSet; perSubject: Record<string, GuidanceRuleSet> };
  glossary: GlossaryEntry[];
  auditLessons: { date: string; ar: string; en: string }[];
};

export const aiGuidance = aiGuidanceJson as unknown as AiGuidance;

const BASE_SYSTEM = [
  "You are a careful teaching assistant for the Egyptian Baccalaureate (Grade 2, Arts and Humanities track).",
  "Explain ONLY the named lesson. Never invent syllabus items, page numbers, exam content, or textbook wording.",
  "Use only widely accepted, verifiable general knowledge. When something is uncertain, say so plainly instead of guessing.",
  "Begin by stating briefly that the explanation is AI-generated and is not an official textbook quote.",
].join(" ");

const ARABIC_STYLE = [
  "اكتب باللغة العربية الفصحى الحديثة، بأسلوب واضح ومناسب لطالب في الصف الثاني الثانوي.",
  "التزم بقواعد النحو والصرف والإملاء العربي وبعلامات الترقيم العربية الصحيحة.",
  "استعمل مصطلحات عربية أصيلة، وتجنّب الكلمات الأجنبية والترجمة الحرفية إلا لضرورة.",
  "نظّم الإجابة في فقرة تمهيدية قصيرة، ثم نقاط موجزة، ثم خلاصة في سطر واحد يبدأ بكلمة «الخلاصة:».",
  "اجعل الجمل قصيرة ومترابطة، وابتعد عن الحشو والتكرار.",
].join(" ");

const ENGLISH_STYLE = [
  "Write in clear, concise English suitable for a second-year secondary student.",
  "Use short paragraphs and a brief bullet list, then end with a one-line takeaway.",
].join(" ");

const BRIEF_INSTRUCTION = {
  ar: "اعتمد على «بطاقة الدرس» أعلاه إن كانت ذات صلة، ولا تخرج عنها؛ وإن كان السؤال خارج نطاقها فاذكر ذلك بوضوح.",
  en: "Use the LESSON BRIEF above when it is relevant and stay within it; if the question is outside its scope, say so clearly.",
};

function clip(text: string, max: number): string {
  const value = text.trim().replace(/\s+/g, " ");
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

/** Collect short, factual key points from the app-authored lesson sections. */
function keyPoints(lesson: Lesson, locale: Locale, other: Locale): string[] {
  const out: string[] = [];
  for (const section of lesson.sections ?? []) {
    if (section.type === "visual" || section.type === "quote") continue;
    const own = section[locale]?.trim() ?? "";
    const fallback = section[other]?.trim() ?? "";
    const text = own || fallback;
    if (text) {
      out.push(clip(text, 220));
      continue;
    }
    for (const item of section.items ?? []) {
      const itemText = (item[locale] || item[other] || "").trim();
      if (itemText) out.push(clip(itemText, 160));
    }
    if (out.length >= 6) break;
  }
  return out.slice(0, 6);
}

/**
 * Build a compact, verifiable brief for one lesson. Returns null when the
 * lesson is not in the verified registry.
 */
export function buildLessonBrief(
  subjectId: string,
  lessonId: string,
  locale: Locale,
): string | null {
  const meta = getSubjectMeta(subjectId);
  const found = getLesson(subjectId, lessonId);
  if (!meta || !found) return null;

  const { unit, lesson } = found;
  const other: Locale = locale === "ar" ? "en" : "ar";
  const lines: string[] = [
    `Subject: ${meta.enName} (${meta.arName})`,
    `Grade: Grade 2 · Arts and Humanities · Egyptian Baccalaureate ${curriculum.academicYear}`,
    `Unit: ${unit.title.en} / ${unit.title.ar}`,
    `Lesson: ${lesson.title.en} / ${lesson.title.ar}`,
  ];
  if (lesson.titleStatus && lesson.titleStatus !== "VERIFIED") {
    lines.push(`Lesson title status: ${lesson.titleStatus} (do not treat the title wording as final).`);
  }
  if (lesson.summary) {
    lines.push(`App summary: ${clip(lesson.summary[locale] || lesson.summary[other], 500)}`);
  }
  const points = keyPoints(lesson, locale, other);
  if (points.length > 0) {
    lines.push(`App key points:\n- ${points.join("\n- ")}`);
  }
  const sourceTitles = (lesson.sourceIds ?? [])
    .map((id) => getSource(id)?.title.en)
    .filter((title): title is string => Boolean(title));
  if (sourceTitles.length > 0) {
    lines.push(`Official source(s) on file: ${sourceTitles.join("; ")}`);
  }
  lines.push(BRIEF_INSTRUCTION[locale]);
  return lines.join("\n");
}

/** Full system prompt: honesty base + locale style + curated guidance rules. */
export function buildSystemPrompt(subjectId: string | undefined, locale: Locale): string {
  const style = locale === "ar" ? `${ARABIC_STYLE} أجب بالعربية حصرًا.` : `${ENGLISH_STYLE} Answer in English only.`;
  const parts = [BASE_SYSTEM, style];

  const globalRules = aiGuidance.rules.global[locale] ?? [];
  const subjectRules = subjectId ? aiGuidance.rules.perSubject[subjectId]?.[locale] ?? [] : [];
  const glossary = aiGuidance.glossary
    .filter((entry) => !subjectId || entry.subjects.includes(subjectId))
    .map((entry) => `- ${entry.term[locale]}: ${entry.note[locale]}`);

  const heading = locale === "ar" ? "قواعد إضافية ملزمة:" : "Additional binding rules:";
  const rules = [...globalRules, ...subjectRules];
  if (rules.length > 0) {
    parts.push(`${heading}\n- ${rules.join("\n- ")}`);
  }
  if (glossary.length > 0) {
    const gHeading = locale === "ar" ? "مصطلحات يُفضَّل الالتزام بها:" : "Preferred terminology:";
    parts.push(`${gHeading}\n${glossary.join("\n")}`);
  }
  return parts.filter(Boolean).join("\n\n");
}
