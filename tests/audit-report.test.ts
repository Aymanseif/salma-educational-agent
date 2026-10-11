import { describe, it, expect } from "vitest";
import { auditReport, flattenLessons } from "@/lib/data";

/**
 * Guards the self-audit loop: if content is added or changed without
 * re-running `npm run audit`, the committed report falls out of sync and the
 * counts no longer match — which fails here and forces a refresh.
 */
describe("self-audit report", () => {
  it("is present, well-formed and consistent with the live content", () => {
    expect(typeof auditReport.generatedOn).toBe("string");
    expect(auditReport.integrity.ok).toBe(true);
    expect(auditReport.integrity.counts.lessons).toBe(flattenLessons().length);
    expect(auditReport.summary.total).toBe(auditReport.links.length);
    expect(
      auditReport.summary.ok +
        auditReport.summary.blocked +
        auditReport.summary.broken +
        auditReport.summary.unchecked,
    ).toBe(auditReport.summary.total);
  });

  it("reports no broken links and no regressions", () => {
    expect(auditReport.links.filter((l) => l.status === "broken")).toEqual([]);
    expect(auditReport.summary.regressions).toBe(0);
  });
});
