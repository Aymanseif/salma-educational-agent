import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LessonViewer from "@/components/LessonViewer";
import type { Lesson, Unit, SourceInventory } from "@/lib/content-types";

const unit: Unit = {
  id: "u1",
  order: 1,
  title: { ar: "الوحدة الأولى", en: "Unit 1" },
  titleStatus: "VERIFIED",
  lessons: [],
};

const importedLesson: Lesson = {
  id: "l1",
  order: 1,
  title: { ar: "العلمُ بينَ القانونِ والضميرِ", en: "Knowledge Between Law and Conscience" },
  titleStatus: "VERIFIED",
  contentStatus: "AI_GENERATED",
  contentNote: { ar: "شرح مولَّد", en: "Generated explanation" },
  summary: { ar: "ملخص الدرس", en: "Lesson summary" },
  sourceIds: ["s1"],
  sections: [
    { type: "heading", ar: "الفكرة", en: "The idea" },
    { type: "paragraph", ar: "العلم قوة.", en: "Knowledge is power." },
    {
      type: "list",
      items: [
        { ar: "بند أول", en: "First item" },
        { ar: "بند ثانٍ", en: "Second item" },
      ],
    },
    { type: "keypoint", ar: "خلاصة مهمة", en: "Important takeaway" },
  ],
  quizzes: [
    {
      id: "q1",
      question: { ar: "سؤال تجريبي؟", en: "Sample question?" },
      options: [
        { ar: "نعم", en: "Yes" },
        { ar: "لا", en: "No" },
      ],
      correctIndex: 0,
      explanation: { ar: "لأن", en: "Because" },
    },
  ],
};

const notImportedLesson: Lesson = {
  id: "l2",
  order: 2,
  title: { ar: "درس غير مستورد", en: "Not imported lesson" },
  titleStatus: "VERIFIED",
  contentStatus: "NOT_YET_IMPORTED",
  summary: { ar: "—", en: "—" },
};

const sources: SourceInventory["sources"] = [
  {
    id: "s1",
    type: "official_textbook",
    title: { ar: "كتاب رسمي", en: "Official book" },
    url: "https://example.test/book.pdf",
    status: "VERIFIED",
    accessed: "2026-10-10",
  },
];

describe("LessonViewer", () => {
  it("renders the lesson title in Arabic by default", () => {
    render(
      <LessonViewer
        subjectId="arabic"
        unit={unit}
        lesson={importedLesson}
        sources={sources}
        prevHref={null}
        nextHref={null}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "العلمُ بينَ القانونِ والضميرِ" }),
    ).toBeInTheDocument();
  });

  it("shows the AI-generated badge and content note", () => {
    render(
      <LessonViewer
        subjectId="arabic"
        unit={unit}
        lesson={importedLesson}
        sources={sources}
        prevHref={null}
        nextHref={null}
      />,
    );
    expect(
      screen.getAllByText("شرح مولَّد بالذكاء الاصطناعي").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/ملاحظة حول المحتوى/)).toBeInTheDocument();
  });

  it("renders body sections and the quiz", () => {
    render(
      <LessonViewer
        subjectId="arabic"
        unit={unit}
        lesson={importedLesson}
        sources={sources}
        prevHref={null}
        nextHref={null}
      />,
    );
    expect(screen.getByText("العلم قوة.")).toBeInTheDocument();
    expect(screen.getByText("بند أول")).toBeInTheDocument();
    expect(screen.getByText("سؤال تجريبي؟")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /اختبر نفسك/ }),
    ).toBeInTheDocument();
  });

  it("lists the official source link", () => {
    render(
      <LessonViewer
        subjectId="arabic"
        unit={unit}
        lesson={importedLesson}
        sources={sources}
        prevHref={null}
        nextHref={null}
      />,
    );
    const link = screen.getByRole("link", { name: /كتاب رسمي/ });
    expect(link).toHaveAttribute("href", "https://example.test/book.pdf");
  });

  it("shows a clear empty state for a not-yet-imported lesson", () => {
    render(
      <LessonViewer
        subjectId="arabic"
        unit={unit}
        lesson={notImportedLesson}
        sources={[]}
        prevHref={null}
        nextHref={null}
      />,
    );
    expect(screen.getByText(/لم يُستورد بعد/)).toBeInTheDocument();
    expect(screen.queryByText("العلم قوة.")).not.toBeInTheDocument();
  });

  it("renders prev/next navigation links when provided", () => {
    render(
      <LessonViewer
        subjectId="arabic"
        unit={unit}
        lesson={importedLesson}
        sources={sources}
        prevHref="/subjects/arabic/prev"
        nextHref="/subjects/arabic/next"
      />,
    );
    expect(screen.getByRole("link", { name: /الدرس السابق/ })).toHaveAttribute(
      "href",
      "/subjects/arabic/prev",
    );
    expect(screen.getByRole("link", { name: /الدرس التالي/ })).toHaveAttribute(
      "href",
      "/subjects/arabic/next",
    );
  });
});
