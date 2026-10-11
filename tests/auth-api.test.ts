import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET as configGET } from "@/app/api/auth/config/route";
import { POST as requestOtp } from "@/app/api/auth/request-otp/route";
import { POST as verifyOtp } from "@/app/api/auth/verify-otp/route";
import { GET as sessionGET } from "@/app/api/auth/session/route";
import { POST as logoutPOST } from "@/app/api/auth/logout/route";
import { PENDING_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";
import { resetDevStore } from "@/lib/auth/otp";

const VALID = {
  fullName: "سلمى",
  fatherName: "أحمد",
  channel: "whatsapp" as const,
  contact: "01006167293",
};

function postRequest(body: unknown, cookie?: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers.cookie = cookie;
  return new Request("http://localhost/api/auth", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function getRequest(cookie?: string): Request {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  return new Request("http://localhost/api/auth/session", { headers });
}

function getSetCookies(res: Response): string[] {
  const h = res.headers as unknown as { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookiePair(res: Response, name: string): string {
  for (const cookie of getSetCookies(res)) {
    const pair = cookie.split(";")[0];
    if (pair.startsWith(`${name}=`)) return pair;
  }
  return "";
}

const TWILIO_KEYS = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID", "AUTH_DEV_OTP", "AUTH_SECRET"];
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

function setEnv(key: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

describe("/api/auth", () => {
  beforeEach(() => {
    resetDevStore();
    setEnv("NODE_ENV", "test");
    for (const key of TWILIO_KEYS) delete process.env[key];
  });
  afterEach(() => {
    setEnv("NODE_ENV", ORIGINAL_NODE_ENV);
    for (const key of TWILIO_KEYS) delete process.env[key];
  });

  it("reports the dev provider outside production", async () => {
    const json = await configGET().json();
    expect(json.configured).toBe(true);
    expect(json.provider).toBe("dev");
    expect(json.devMode).toBe(true);
  });

  it("requests a code, remembering the pending profile in a signed cookie", async () => {
    const response = await requestOtp(postRequest(VALID));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.available).toBe(true);
    expect(json.devCode).toMatch(/^\d{6}$/);
    expect(json.sentTo).toBe("••••••••7293");
    expect(cookiePair(response, PENDING_COOKIE)).toMatch(/^salma_pending=/);
  });

  it("verifies the code and issues a session cookie", async () => {
    const started = await requestOtp(postRequest(VALID));
    const { devCode } = await started.json();
    const pending = cookiePair(started, PENDING_COOKIE);

    const verified = await verifyOtp(postRequest({ code: devCode }, pending));
    expect(verified.status).toBe(200);
    const json = await verified.json();
    expect(json.authenticated).toBe(true);
    expect(json.profile.fullName).toBe("سلمى");
    expect(json.profile.fatherName).toBe("أحمد");
    expect(json.profile.contact).toBe("201006167293");

    const session = cookiePair(verified, SESSION_COOKIE);
    expect(session).toMatch(/^salma_session=/);

    const sessionJson = await sessionGET(getRequest(session)).json();
    expect(sessionJson.authenticated).toBe(true);
    expect(sessionJson.profile.fullName).toBe("سلمى");
  });

  it("rejects a wrong code", async () => {
    const started = await requestOtp(postRequest(VALID));
    const json = await started.json();
    const pending = cookiePair(started, PENDING_COOKIE);
    const wrong = json.devCode === "000000" ? "000001" : "000000";
    const response = await verifyOtp(postRequest({ code: wrong }, pending));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("invalid_code");
  });

  it("rejects verification without a pending cookie", async () => {
    const response = await verifyOtp(postRequest({ code: "123456" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("no_pending");
  });

  it("rejects invalid input with stable codes", async () => {
    const bad = await requestOtp(postRequest({ ...VALID, fullName: "س" }));
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toBe("invalid_name");

    const badContact = await requestOtp(postRequest({ ...VALID, contact: "abc" }));
    expect(badContact.status).toBe(400);
    expect((await badContact.json()).error).toBe("invalid_contact");
  });

  it("clears cookies on logout", async () => {
    const response = logoutPOST();
    const json = await response.json();
    expect(json.authenticated).toBe(false);
    const session = getSetCookies(response).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
    expect(session).toBeTruthy();
    expect(session).toContain("Max-Age=0");
  });

  it("returns a friendly 501 when nothing is configured in production", async () => {
    setEnv("NODE_ENV", "production");
    const config = await configGET().json();
    expect(config.configured).toBe(false);
    expect(config.provider).toBe("none");

    const response = await requestOtp(postRequest(VALID));
    expect(response.status).toBe(501);
    expect((await response.json()).error).toBe("auth_not_configured");
  });
});
