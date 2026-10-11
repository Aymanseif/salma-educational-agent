import { NextResponse } from "next/server";
import { PENDING_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";
import { secureCookieOptions } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Clears the session (and any half-finished sign-in). */
export function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(SESSION_COOKIE, "", secureCookieOptions(0));
  response.cookies.set(PENDING_COOKIE, "", secureCookieOptions(0));
  return response;
}
