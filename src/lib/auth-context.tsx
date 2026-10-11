"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChannel, AuthProfile } from "@/lib/auth/types";

export type OtpRequestInput = {
  fullName: string;
  fatherName: string;
  channel: AuthChannel;
  contact: string;
};

export type RequestOtpResult =
  | { ok: true; sentTo: string; devCode?: string; provider: string; devMode: boolean }
  | { ok: false; error: string };

export type VerifyOtpResult =
  | { ok: true; profile: AuthProfile }
  | { ok: false; error: string };

type AuthContextValue = {
  /** True once the initial config + session fetch has finished. */
  ready: boolean;
  configured: boolean;
  devMode: boolean;
  provider: string;
  profile: AuthProfile | null;
  requestOtp: (input: OtpRequestInput) => Promise<RequestOtpResult>;
  verifyOtp: (code: string) => Promise<VerifyOtpResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [provider, setProvider] = useState("none");
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [configRes, sessionRes] = await Promise.all([
        fetch("/api/auth/config", { cache: "no-store" }),
        fetch("/api/auth/session", { cache: "no-store" }),
      ]);
      const configJson = await configRes.json().catch(() => null);
      const sessionJson = await sessionRes.json().catch(() => null);
      setConfigured(Boolean(configJson?.configured));
      setDevMode(Boolean(configJson?.devMode));
      setProvider(String(configJson?.provider ?? "none"));
      setProfile((sessionJson?.profile as AuthProfile | null) ?? null);
    } catch {
      /* offline or API unavailable — stay signed out */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestOtp = useCallback(async (input: OtpRequestInput): Promise<RequestOtpResult> => {
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.available) {
        return { ok: false, error: String(json?.error ?? "send_failed") };
      }
      return {
        ok: true,
        sentTo: String(json.sentTo ?? ""),
        devCode: typeof json.devCode === "string" ? json.devCode : undefined,
        provider: String(json.provider ?? ""),
        devMode: Boolean(json.devMode),
      };
    } catch {
      return { ok: false, error: "network" };
    }
  }, []);

  const verifyOtp = useCallback(async (code: string): Promise<VerifyOtpResult> => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.authenticated) {
        return { ok: false, error: String(json?.error ?? "invalid_code") };
      }
      const nextProfile = json.profile as AuthProfile;
      setProfile(nextProfile);
      return { ok: true, profile: nextProfile };
    } catch {
      return { ok: false, error: "network" };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ready, configured, devMode, provider, profile, requestOtp, verifyOtp, signOut, refresh }),
    [ready, configured, devMode, provider, profile, requestOtp, verifyOtp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback for isolated component tests / components rendered without provider.
    return {
      ready: false,
      configured: false,
      devMode: false,
      provider: "none",
      profile: null,
      requestOtp: async () => ({ ok: false, error: "not_available" }),
      verifyOtp: async () => ({ ok: false, error: "not_available" }),
      signOut: async () => undefined,
      refresh: async () => undefined,
    };
  }
  return ctx;
}
