import { NextResponse } from "next/server";
import { resolveOtpConfig } from "@/lib/auth/otp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Lets the UI know whether OTP sign-in is ready, and in which mode. */
export function GET() {
  return NextResponse.json(resolveOtpConfig());
}
