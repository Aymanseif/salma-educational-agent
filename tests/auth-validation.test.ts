import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPhone,
  maskContact,
  normalizeEmail,
  normalizePhone,
  validateProfile,
} from "@/lib/auth/validation";

describe("auth validation", () => {
  it("normalizes Egyptian and international phone numbers to E.164 digits", () => {
    expect(normalizePhone("01006167293")).toBe("201006167293");
    expect(normalizePhone("+20 100 616 7293")).toBe("201006167293");
    expect(normalizePhone("00201006167293")).toBe("201006167293");
    expect(normalizePhone("201006167293")).toBe("201006167293");
    expect(normalizePhone("1006167293")).toBe("201006167293");
    expect(normalizePhone("+1 415 555 2671")).toBe("14155552671");
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone("abc")).toBe("");
  });

  it("validates phone/email formats", () => {
    expect(isValidPhone("201006167293")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidEmail("student@example.com")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(normalizeEmail("  Stu@Example.COM ")).toBe("stu@example.com");
  });

  it("accepts a valid WhatsApp profile and normalizes the number", () => {
    const result = validateProfile({
      fullName: "  سلمى  ",
      fatherName: "أحمد",
      channel: "whatsapp",
      contact: "01006167293",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fullName).toBe("سلمى");
      expect(result.value.contact).toBe("201006167293");
    }
  });

  it("accepts a valid email profile and lowercases the email", () => {
    const result = validateProfile({
      fullName: "Salma",
      fatherName: "Ahmed",
      channel: "email",
      contact: "Student@Example.com",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.contact).toBe("student@example.com");
  });

  it("rejects bad names, channels and contacts with stable error codes", () => {
    expect(validateProfile({ fullName: "س", fatherName: "أحمد", channel: "whatsapp", contact: "01006167293" })).toEqual({
      ok: false,
      error: "invalid_name",
    });
    expect(validateProfile({ fullName: "سلمى", fatherName: "", channel: "whatsapp", contact: "01006167293" })).toEqual({
      ok: false,
      error: "invalid_father_name",
    });
    expect(validateProfile({ fullName: "سلمى", fatherName: "أحمد", channel: "fax", contact: "x" })).toEqual({
      ok: false,
      error: "invalid_channel",
    });
    expect(validateProfile({ fullName: "سلمى", fatherName: "أحمد", channel: "whatsapp", contact: "abc" })).toEqual({
      ok: false,
      error: "invalid_contact",
    });
    expect(validateProfile({ fullName: "سلمى", fatherName: "أحمد", channel: "email", contact: "nope" })).toEqual({
      ok: false,
      error: "invalid_contact",
    });
  });

  it("masks contacts for display", () => {
    expect(maskContact("whatsapp", "201006167293")).toBe("••••••••7293");
    expect(maskContact("email", "student@example.com")).toBe("s••••••@example.com");
  });
});
