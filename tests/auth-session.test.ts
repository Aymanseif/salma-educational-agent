import { describe, it, expect } from "vitest";
import {
  SESSION_TTL_MS,
  createPendingToken,
  createSessionToken,
  getAuthSecret,
  verifyPendingToken,
  verifySessionToken,
} from "@/lib/auth/session";
import type { AuthProfile } from "@/lib/auth/types";

const SECRET = "test-secret";
const profile: AuthProfile = {
  fullName: "سلمى",
  fatherName: "أحمد",
  channel: "whatsapp",
  contact: "201006167293",
  verifiedAt: 1_700_000_000_000,
};

describe("auth session tokens", () => {
  it("round-trips a signed session", () => {
    const token = createSessionToken(profile, SECRET);
    expect(verifySessionToken(token, SECRET)).toEqual(profile);
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken(profile, SECRET);
    const tampered = `${token.slice(0, -1)}${token.slice(-1) === "A" ? "B" : "A"}`;
    expect(verifySessionToken(tampered, SECRET)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken(profile, SECRET);
    expect(verifySessionToken(token, "other-secret")).toBeNull();
  });

  it("rejects an expired session", () => {
    const token = createSessionToken(profile, SECRET, 0);
    expect(verifySessionToken(token, SECRET, SESSION_TTL_MS + 1)).toBeNull();
  });

  it("keeps pending tokens distinct from sessions", () => {
    const pending = createPendingToken(
      { fullName: "Salma", fatherName: "Ahmed", channel: "email", contact: "a@b.co" },
      SECRET,
    );
    const decoded = verifyPendingToken(pending, SECRET);
    expect(decoded).toEqual({
      fullName: "Salma",
      fatherName: "Ahmed",
      channel: "email",
      contact: "a@b.co",
    });
    // A pending token must not be usable as a session.
    expect(verifySessionToken(pending, SECRET)).toBeNull();
  });

  it("resolves the signing secret honestly by environment", () => {
    expect(getAuthSecret({ NODE_ENV: "production" })).toBeNull();
    expect(getAuthSecret({ NODE_ENV: "production", AUTH_SECRET: "real" })).toBe("real");
    expect(getAuthSecret({ NODE_ENV: "test" })).toBeTruthy();
  });
});
