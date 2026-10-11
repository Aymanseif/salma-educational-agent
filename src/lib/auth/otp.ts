import { randomInt, timingSafeEqual } from "node:crypto";
import type { AuthChannel, AuthConfig, OtpProviderId } from "./types";
import { isProduction } from "./session";

/**
 * One-time-password delivery, pluggable and honest.
 *
 *  - `twilio`  — Twilio Verify sends AND checks the code (no code is ever
 *                stored by us), supporting WhatsApp and email. Enabled by
 *                TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_VERIFY_SERVICE_SID.
 *  - `dev`     — local console provider (never in production): generates a
 *                6-digit code, logs it, and keeps it in memory so the flow is
 *                testable end-to-end without a paid provider.
 *  - `none`    — nothing configured; the API returns 501 and the UI explains.
 *
 * The exact same shapes are returned regardless of provider so the routes and
 * tests stay provider-agnostic.
 */

type Env = Record<string, string | undefined>;
type FetchLike = typeof fetch;

const DEV_TTL_MS = 10 * 60 * 1000;

type DevEntry = { code: string; channel: AuthChannel; expires: number };
const devStore = new Map<string, DevEntry>();

/** Test helper: clear the in-memory dev OTP store. */
export function resetDevStore(): void {
  devStore.clear();
}

export function resolveOtpConfig(env: Env = process.env): AuthConfig {
  const sid = env.TWILIO_ACCOUNT_SID?.trim();
  const token = env.TWILIO_AUTH_TOKEN?.trim();
  const service = env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (sid && token && service) {
    return { configured: true, provider: "twilio", devMode: false };
  }
  const devAllowed = !isProduction(env) || env.AUTH_DEV_OTP?.trim() === "1";
  if (devAllowed) {
    return {
      configured: true,
      provider: "dev",
      devMode: true,
      reason: "twilio_not_configured",
    };
  }
  return { configured: false, provider: "none", devMode: false, reason: "not_configured" };
}

export type StartResult =
  | { ok: true; provider: OtpProviderId; devCode?: string }
  | { ok: false; provider: OtpProviderId; reason: string };

export type CheckResult = { ok: true } | { ok: false; reason: string };

function twilioEndpoint(env: Env, path: "Verifications" | "VerificationCheck"): string {
  const service = env.TWILIO_VERIFY_SERVICE_SID?.trim();
  return `https://verify.twilio.com/v2/Services/${service}/${path}`;
}

function twilioAuthHeader(env: Env): string {
  const sid = env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const token = env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

function twilioTo(channel: AuthChannel, contact: string): string {
  return channel === "email" ? contact : `+${contact}`;
}

export async function startVerification(
  params: { channel: AuthChannel; contact: string; env?: Env; fetchImpl?: FetchLike },
): Promise<StartResult> {
  const env = params.env ?? process.env;
  const doFetch = params.fetchImpl ?? fetch;
  const config = resolveOtpConfig(env);

  if (config.provider === "none") {
    return { ok: false, provider: "none", reason: config.reason ?? "not_configured" };
  }

  if (config.provider === "dev") {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    devStore.set(params.contact, {
      code,
      channel: params.channel,
      expires: Date.now() + DEV_TTL_MS,
    });
    console.info(
      `[auth] DEV OTP for ${params.channel} ${params.contact}: ${code} (no provider configured)`,
    );
    return {
      ok: true,
      provider: "dev",
      devCode: isProduction(env) ? undefined : code,
    };
  }

  const body = new URLSearchParams({
    To: twilioTo(params.channel, params.contact),
    Channel: params.channel,
  });
  const response = await doFetch(twilioEndpoint(env, "Verifications"), {
    method: "POST",
    headers: {
      Authorization: twilioAuthHeader(env),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) {
    return { ok: false, provider: "twilio", reason: `twilio_${response.status}` };
  }
  return { ok: true, provider: "twilio" };
}

export async function checkVerification(
  params: { channel: AuthChannel; contact: string; code: string; env?: Env; fetchImpl?: FetchLike },
): Promise<CheckResult> {
  const env = params.env ?? process.env;
  const doFetch = params.fetchImpl ?? fetch;
  const config = resolveOtpConfig(env);

  if (config.provider === "none") {
    return { ok: false, reason: config.reason ?? "not_configured" };
  }

  if (config.provider === "dev") {
    const entry = devStore.get(params.contact);
    if (!entry || entry.channel !== params.channel) return { ok: false, reason: "no_code" };
    if (entry.expires < Date.now()) {
      devStore.delete(params.contact);
      return { ok: false, reason: "expired" };
    }
    const a = Buffer.from(entry.code);
    const b = Buffer.from(params.code);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "invalid_code" };
    }
    devStore.delete(params.contact);
    return { ok: true };
  }

  const body = new URLSearchParams({
    To: twilioTo(params.channel, params.contact),
    Code: params.code,
  });
  const response = await doFetch(twilioEndpoint(env, "VerificationCheck"), {
    method: "POST",
    headers: {
      Authorization: twilioAuthHeader(env),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) {
    return { ok: false, reason: `twilio_${response.status}` };
  }
  const json = (await response.json().catch(() => null)) as { status?: string } | null;
  if (json?.status === "approved") return { ok: true };
  return { ok: false, reason: "not_approved" };
}
