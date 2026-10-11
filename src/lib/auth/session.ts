import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthProfile } from "./types";

/**
 * Stateless, tamper-evident sessions.
 *
 * A session is a base64url(JSON payload) + "." + HMAC-SHA256 signature, stored
 * in an httpOnly cookie. The server keeps no session store, so it works on
 * serverless hosts (Vercel) with no database. The signing key comes from
 * `AUTH_SECRET`; outside production a fixed dev key is used so local runs and
 * tests work without configuration (production refuses to issue sessions
 * without a real secret — see `getAuthSecret`).
 */

export const SESSION_COOKIE = "salma_session";
export const PENDING_COOKIE = "salma_pending";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const PENDING_TTL_MS = 15 * 60 * 1000; // 15 minutes

const DEV_SECRET = "dev-insecure-auth-secret-change-me";

type Env = Record<string, string | undefined>;

export function isProduction(env: Env = process.env): boolean {
  return (env.NODE_ENV ?? "development") === "production";
}

/** The signing secret, or null when production is missing AUTH_SECRET. */
export function getAuthSecret(env: Env = process.env): string | null {
  const secret = env.AUTH_SECRET?.trim();
  if (secret) return secret;
  return isProduction(env) ? null : DEV_SECRET;
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function encode(prefix: string, obj: unknown, secret: string): string {
  const payloadB64 = Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
  return `${prefix}${payloadB64}.${sign(payloadB64, secret)}`;
}

function decode(token: string | null | undefined, secret: string): Record<string, unknown> | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0 || idx === token.length - 1) return null;
  const payloadB64 = token.slice(0, idx);
  const provided = token.slice(idx + 1);
  const expected = sign(payloadB64, secret);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// --- Session tokens --------------------------------------------------------

export function createSessionToken(
  profile: AuthProfile,
  secret: string,
  now: number = Date.now(),
): string {
  return encode("", { ...profile, kind: "session", exp: now + SESSION_TTL_MS }, secret);
}

export function verifySessionToken(
  token: string | null | undefined,
  secret: string,
  now: number = Date.now(),
): AuthProfile | null {
  const data = decode(token, secret);
  if (!data) return null;
  if (data.kind !== "session") return null;
  if (typeof data.exp !== "number" || data.exp < now) return null;
  if (typeof data.fullName !== "string" || typeof data.contact !== "string") return null;
  return {
    fullName: data.fullName,
    fatherName: typeof data.fatherName === "string" ? data.fatherName : "",
    channel: data.channel === "email" ? "email" : "whatsapp",
    contact: data.contact,
    verifiedAt: typeof data.verifiedAt === "number" ? data.verifiedAt : 0,
  };
}

// --- Pending tokens (between "send code" and "verify code") ----------------

export type PendingProfile = {
  fullName: string;
  fatherName: string;
  channel: AuthProfile["channel"];
  contact: string;
};

export function createPendingToken(
  profile: PendingProfile,
  secret: string,
  now: number = Date.now(),
): string {
  return encode("", { ...profile, kind: "pending", exp: now + PENDING_TTL_MS }, secret);
}

export function verifyPendingToken(
  token: string | null | undefined,
  secret: string,
  now: number = Date.now(),
): PendingProfile | null {
  const data = decode(token, secret);
  if (!data) return null;
  if (data.kind !== "pending") return null;
  if (typeof data.exp !== "number" || data.exp < now) return null;
  if (
    typeof data.fullName !== "string" ||
    typeof data.fatherName !== "string" ||
    typeof data.contact !== "string"
  ) {
    return null;
  }
  return {
    fullName: data.fullName,
    fatherName: data.fatherName,
    channel: data.channel === "email" ? "email" : "whatsapp",
    contact: data.contact,
  };
}
