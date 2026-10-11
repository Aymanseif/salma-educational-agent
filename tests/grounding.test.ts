import { describe, it, expect } from "vitest";
import { aiGuidance, buildLessonBrief, buildSystemPrompt } from "@/lib/grounding";
import { getLesson } from "@/lib/data";

describe("AI grounding", () => {
  it("carries a positive guidance version and bilingual global rules", () => {
    expect(aiGuidance.version).toBeGreaterThan(0);
    expect(aiGuidance.rules.global.ar.length).toBeGreaterThan(0);
    expect(aiGuidance.rules.global.en.length).toBeGreaterThan(0);
  });

  it("builds a bilingual lesson brief anchored to the named lesson", () => {
    const found = getLesson("arabic", "ar-u1-l1");
    expect(found).not.toBeNull();
    const brief = buildLessonBrief("arabic", "ar-u1-l1", "ar");
    expect(brief).toBeTruthy();
    expect(brief).toContain(found!.lesson.title.en);
    expect(brief).toContain(found!.lesson.title.ar);
    expect(brief).toContain("Grade 2");
  });

  it("returns null for a lesson outside the verified registry", () => {
    expect(buildLessonBrief("arabic", "does-not-exist", "ar")).toBeNull();
  });

  it("injects honesty + locale style + curated rules into the system prompt", () => {
    const ar = buildSystemPrompt("arabic", "ar");
    expect(ar).toContain("AI-generated");
    expect(ar).toContain("قواعد إضافية ملزمة");
    // Subject-specific Arabic rule (iʿrāb).
    expect(ar).toContain("الإعراب");

    const en = buildSystemPrompt("english", "en");
    expect(en).toContain("Additional binding rules");
    expect(en).toContain("Present Perfect");
  });

  it("never instructs the model to quote the textbook", () => {
    const prompt = buildSystemPrompt("history", "ar");
    expect(prompt).toContain("لا تنقل نص الكتاب");
  });
});
