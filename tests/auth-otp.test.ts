import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkVerification,
  resetDevStore,
  resolveOtpConfig,
  startVerification,
} from "@/lib/auth/otp";

const TWILIO_ENV = {
  NODE_ENV: "production",
  TWILIO_ACCOUNT_SID: "AC123",
  TWILIO_AUTH_TOKEN: "token",
  TWILIO_VERIFY_SERVICE_SID: "VA123",
};

describe("otp provider resolution", () => {
  it("is not configured in production without Twilio", () => {
    const config = resolveOtpConfig({ NODE_ENV: "production" });
    expect(config).toMatchObject({ configured: false, provider: "none" });
  });

  it("uses Twilio Verify when all three values are present", () => {
    const config = resolveOtpConfig(TWILIO_ENV);
    expect(config).toMatchObject({ configured: true, provider: "twilio", devMode: false });
  });

  it("falls back to the dev console provider outside production", () => {
    const config = resolveOtpConfig({ NODE_ENV: "test" });
    expect(config).toMatchObject({ configured: true, provider: "dev", devMode: true });
  });
});

describe("dev console provider", () => {
  beforeEach(() => resetDevStore());

  it("sends a 6-digit code and verifies it once", async () => {
    const env = { NODE_ENV: "test" };
    const started = await startVerification({ channel: "whatsapp", contact: "201006167293", env });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.provider).toBe("dev");
    expect(started.devCode).toMatch(/^\d{6}$/);

    const wrong = await checkVerification({
      channel: "whatsapp",
      contact: "201006167293",
      code: "000000",
      env,
    });
    // Only a real mismatch is "invalid_code" (a lucky 000000 would approve).
    if (started.devCode !== "000000") {
      expect(wrong).toEqual({ ok: false, reason: "invalid_code" });
    }

    const good = await checkVerification({
      channel: "whatsapp",
      contact: "201006167293",
      code: started.devCode!,
      env,
    });
    expect(good).toEqual({ ok: true });

    // Codes are single-use.
    const again = await checkVerification({
      channel: "whatsapp",
      contact: "201006167293",
      code: started.devCode!,
      env,
    });
    expect(again.ok).toBe(false);
  });
});

describe("twilio verify provider", () => {
  it("sends to Twilio Verify and approves a good code", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      void init;
      if (String(url).endsWith("/Verifications")) {
        return new Response(JSON.stringify({ status: "pending" }), { status: 201 });
      }
      return new Response(JSON.stringify({ status: "approved" }), { status: 200 });
    });

    const started = await startVerification({
      channel: "whatsapp",
      contact: "201006167293",
      env: TWILIO_ENV,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    expect(started).toEqual({ ok: true, provider: "twilio" });

    const firstCall = fetchMock.mock.calls[0];
    expect(String(firstCall[0])).toContain("/Services/VA123/Verifications");
    expect(String((firstCall[1] as RequestInit).body)).toContain("To=%2B201006167293");
    expect(String((firstCall[1] as RequestInit).body)).toContain("Channel=whatsapp");
    expect((firstCall[1] as RequestInit).headers).toMatchObject({
      Authorization: `Basic ${Buffer.from("AC123:token").toString("base64")}`,
    });

    const checked = await checkVerification({
      channel: "whatsapp",
      contact: "201006167293",
      code: "123456",
      env: TWILIO_ENV,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    expect(checked).toEqual({ ok: true });
  });

  it("reports a non-approved code", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ status: "pending" }), { status: 200 }),
    );
    const checked = await checkVerification({
      channel: "email",
      contact: "a@b.co",
      code: "000000",
      env: TWILIO_ENV,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    expect(checked).toEqual({ ok: false, reason: "not_approved" });
  });
});
