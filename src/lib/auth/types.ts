/**
 * Shared auth types — intentionally free of any Node imports so they can be
 * imported by both server code (`session.ts`, route handlers) and client
 * components without pulling `node:crypto` into the browser bundle.
 */

export type AuthChannel = "whatsapp" | "email";

export type AuthProfile = {
  fullName: string;
  fatherName: string;
  channel: AuthChannel;
  /** Normalized phone digits (no "+") for WhatsApp, or the email address. */
  contact: string;
  /** Epoch ms when the contact was verified. */
  verifiedAt: number;
};

export type OtpProviderId = "twilio" | "dev" | "none";

export type AuthConfig = {
  /** True when OTPs can actually be sent (a real provider, or the dev console). */
  configured: boolean;
  provider: OtpProviderId;
  /** True when the local dev console provider is active (never in production). */
  devMode: boolean;
  reason?: string;
};
