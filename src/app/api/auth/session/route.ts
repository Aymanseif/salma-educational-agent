import { NextResponse } from "next/server";
import { SESSION_COOKIE, getAuthSecret, verifySessionToken } from "@/lib/auth/session";
import { parseCookies } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Returns the signed-in profile (if any) so the UI can hydrate on load. */
export function GET(request: Request) {
  const secret = getAuthSecret();
  if (!secret) {
    return NextResponse.json({ authenticated: false, profile: null });
  }
  const profile = verifySessionToken(
    parseCookies(request.headers.get("cookie"))[SESSION_COOKIE],
    secret,
  );
  return NextResponse.json({ authenticated: Boolean(profile), profile: profile ?? null });
}
