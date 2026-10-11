import { NextResponse } from "next/server";
import { maskContact, validateProfile } from "@/lib/auth/validation";
import { resolveOtpConfig, startVerification } from "@/lib/auth/otp";
import {
  PENDING_COOKIE,
  PENDING_TTL_MS,
  createPendingToken,
  getAuthSecret,
} from "@/lib/auth/session";
import { secureCookieOptions } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Step 1 of sign-in: validate the student's details, send a one-time code to
 * the chosen WhatsApp number or email, and remember the pending profile in a
 * short-lived signed cookie until it is verified.
 */
export async function POST(request: Request) {
  const config = resolveOtpConfig();
  if (!config.configured) {
    return NextResponse.json(
      { available: false, error: "auth_not_configured", provider: config.provider, reason: config.reason },
      { status: 501 },
    );
  }

  const secret = getAuthSecret();
  if (!secret) {
    return NextResponse.json(
      { available: true, error: "auth_not_configured", reason: "missing_secret" },
      { status: 501 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ available: true, error: "invalid_json" }, { status: 400 });
  }

  const validated = validateProfile((body ?? {}) as Record<string, unknown>);
  if (!validated.ok) {
    return NextResponse.json({ available: true, error: validated.error }, { status: 400 });
  }

  const { fullName, fatherName, channel, contact } = validated.value;
  const started = await startVerification({ channel, contact });
  if (!started.ok) {
    return NextResponse.json(
      { available: true, error: "send_failed", reason: started.reason },
      { status: 502 },
    );
  }

  const response = NextResponse.json({
    available: true,
    provider: started.provider,
    devMode: config.devMode,
    sentTo: maskContact(channel, contact),
    devCode: started.devCode,
  });
  response.cookies.set(
    PENDING_COOKIE,
    createPendingToken({ fullName, fatherName, channel, contact }, secret),
    secureCookieOptions(Math.floor(PENDING_TTL_MS / 1000)),
  );
  return response;
}
