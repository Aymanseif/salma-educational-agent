import type { AuthChannel } from "./types";

/**
 * Pure validation + normalization for the sign-in form. No I/O, no Node APIs —
 * so it runs identically on the server and in tests.
 *
 * Error values are stable codes (not sentences): the UI maps them to localized
 * strings, keeping this module translation-agnostic.
 */

export type ProfileInput = {
  fullName?: unknown;
  fatherName?: unknown;
  channel?: unknown;
  contact?: unknown;
};

export type ValidatedProfile = {
  fullName: string;
  fatherName: string;
  channel: AuthChannel;
  contact: string;
};

export type ValidationError = "invalid_name" | "invalid_father_name" | "invalid_channel" | "invalid_contact";

export type ValidationResult =
  | { ok: true; value: ValidatedProfile }
  | { ok: false; error: ValidationError };

const NAME_MIN = 2;
const NAME_MAX = 80;

/**
 * Normalize a phone number to bare E.164 digits (no "+").
 *
 * Accepts local Egyptian formats (01006167293), international (+20…, 0020…),
 * and bare international (201006167293). `defaultCountry` is used when the
 * number is national. Returns "" when there is nothing usable.
 */
export function normalizePhone(input: string, defaultCountry = "20"): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (hasPlus) {
    return digits;
  }
  if (digits.startsWith("00")) {
    return digits.slice(2);
  }
  if (digits.startsWith("0")) {
    return defaultCountry + digits.replace(/^0+/, "");
  }
  if (digits.startsWith(defaultCountry)) {
    return digits;
  }
  // Bare national number without the trunk zero (e.g. 1006167293).
  if (digits.length <= 10) {
    return defaultCountry + digits;
  }
  return digits;
}

export function isValidPhone(normalized: string): boolean {
  return /^\d{8,15}$/.test(normalized);
}

export function normalizeEmail(input: string): string {
  return (input ?? "").trim().toLowerCase();
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input) && input.length <= 254;
}

function cleanName(input: unknown): string {
  return typeof input === "string" ? input.trim().replace(/\s+/g, " ") : "";
}

export function validateProfile(input: ProfileInput): ValidationResult {
  const fullName = cleanName(input.fullName);
  if (fullName.length < NAME_MIN || fullName.length > NAME_MAX) {
    return { ok: false, error: "invalid_name" };
  }

  const fatherName = cleanName(input.fatherName);
  if (fatherName.length < NAME_MIN || fatherName.length > NAME_MAX) {
    return { ok: false, error: "invalid_father_name" };
  }

  if (input.channel !== "whatsapp" && input.channel !== "email") {
    return { ok: false, error: "invalid_channel" };
  }
  const channel: AuthChannel = input.channel;

  const contactRaw = typeof input.contact === "string" ? input.contact : "";
  if (channel === "email") {
    const email = normalizeEmail(contactRaw);
    if (!isValidEmail(email)) return { ok: false, error: "invalid_contact" };
    return { ok: true, value: { fullName, fatherName, channel, contact: email } };
  }

  const phone = normalizePhone(contactRaw);
  if (!isValidPhone(phone)) return { ok: false, error: "invalid_contact" };
  return { ok: true, value: { fullName, fatherName, channel, contact: phone } };
}

/** Human-friendly masked contact for "sent to …" messages. */
export function maskContact(channel: AuthChannel, contact: string): string {
  if (channel === "email") {
    const [user, domain] = contact.split("@");
    if (!domain) return contact;
    const visible = user.slice(0, 1);
    return `${visible}${"•".repeat(Math.max(1, Math.min(6, user.length - 1)))}@${domain}`;
  }
  if (contact.length <= 4) return contact;
  return `${"•".repeat(contact.length - 4)}${contact.slice(-4)}`;
}
