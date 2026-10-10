import { describe, it, expect } from "vitest";
import { dictionaries, translate } from "@/lib/i18n";

describe("i18n dictionaries", () => {
  it("define exactly the same keys in Arabic and English", () => {
    const arKeys = Object.keys(dictionaries.ar).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(enKeys).toEqual(arKeys);
  });

  it("has no empty strings in either language", () => {
    for (const [locale, dict] of Object.entries(dictionaries)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `${locale}:${key}`).not.toBe("");
      }
    }
  });

  it("falls back to the provided key when the translation is missing", () => {
    expect(translate("ar", "this.key.does.not.exist")).toBe(
      "this.key.does.not.exist",
    );
  });

  it("returns real Arabic and English strings", () => {
    expect(translate("ar", "nav.home")).toBe("الرئيسية");
    expect(translate("en", "nav.home")).toBe("Home");
  });
});
