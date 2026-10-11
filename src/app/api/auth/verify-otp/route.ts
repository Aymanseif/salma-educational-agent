import { NextResponse } from "next/server";
import { checkVerification, resolveOtpConfig } from "@/lib/auth/otp";
import {
  PENDING_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSessionToken,
  getAuthSecret,
  verifyPendingToken,
} from "@/lib/auth/session";
import { parseCookies, secureCookieOptions } from "@/lib/auth/cookies";
import type { AuthProfile } from "@/lib/auth/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Step 2 of sign-in: check the code against the pending profile and, on
 * success, issue the signed session cookie.
 */
export async function POST(request: Request) {
  const config = resolveOtpConfig();
  if (!config.configured) {
    return NextResponse.json(
      { authenticated: false, error: "auth_not_configured", provider: config.provider, reason: config.reason },
      { status: 501 },
    );
  }

  const secret = getAuthSecret();
  if (!secret) {
    return NextResponse.json(
      { authenticated: false, error: "auth_not_configured", reason: "missing_secret" },
      { status: 501 },
    );
  }

  const pending = verifyPendingToken(
    parseCookies(request.headers.get("cookie"))[PENDING_COOKIE],
    secret,
  );
  if (!pending) {
    return NextResponse.json({ authenticated: false, error: "no_pending" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ authenticated: false, error: "invalid_json" }, { status: 400 });
  }

  const code =
    body && typeof (body as { code?: unknown }).code === "string"
      ? (body as { code: string }).code.trim()
      : "";
  if (!/^\d{4,8}$/.test(code)) {
    return NextResponse.json({ authenticated: false, error: "missing_code" }, { status: 400 });
  }

  const check = await checkVerification({
    channel: pending.channel,
    contact: pending.contact,
    code,
  });
  if (!check.ok) {
    const error = check.reason === "expired" ? "code_expired" : "invalid_code";
    return NextResponse.json({ authenticated: false, error }, { status: 401 });
  }

  const profile: AuthProfile = {
    fullName: pending.fullName,
    fatherName: pending.fatherName,
    channel: pending.channel,
    contact: pending.contact,
    verifiedAt: Date.now(),
  };

  const response = NextResponse.json({ authenticated: true, profile });
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(profile, secret),
    secureCookieOptions(Math.floor(SESSION_TTL_MS / 1000)),
  );
  response.cookies.set(PENDING_COOKIE, "", secureCookieOptions(0));
  return response;
}
