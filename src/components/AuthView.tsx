"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { useLocale } from "@/lib/locale";
import { useAuth } from "@/lib/auth-context";
import { maskContact } from "@/lib/auth/validation";
import type { AuthChannel } from "@/lib/auth/types";

const ERROR_KEY: Record<string, string> = {
  invalid_name: "auth.errorName",
  invalid_father_name: "auth.errorFatherName",
  invalid_channel: "auth.errorContact",
  invalid_contact: "auth.errorContact",
  invalid_code: "auth.errorCode",
  code_expired: "auth.errorCodeExpired",
  missing_code: "auth.errorCode",
  no_pending: "auth.errorSession",
  auth_not_configured: "auth.errorSend",
  send_failed: "auth.errorSend",
  invalid_json: "auth.errorGeneric",
  network: "auth.errorGeneric",
};

export default function AuthView() {
  const { t } = useLocale();
  const { ready, configured, devMode, profile, requestOtp, verifyOtp, signOut } = useAuth();

  const [step, setStep] = useState<"details" | "code">("details");
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [channel, setChannel] = useState<AuthChannel>("whatsapp");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const message = (codeKey: string) => (ERROR_KEY[codeKey] ? t(ERROR_KEY[codeKey]) : t("auth.errorGeneric"));

  async function onSendCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await requestOtp({ fullName, fatherName, channel, contact });
    setBusy(false);
    if (!result.ok) {
      setError(message(result.error));
      return;
    }
    setSentTo(result.sentTo);
    setDevCode(result.devCode);
    setStep("code");
    setCode("");
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await verifyOtp(code);
    setBusy(false);
    if (!result.ok) {
      setError(message(result.error));
      return;
    }
    setDevCode(undefined);
  }

  if (!ready) {
    return <p className="py-10 text-center text-sm text-slate-500">{t("common.loading")}</p>;
  }

  if (profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold text-slate-900">{t("auth.signedInTitle")}</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <dl className="space-y-3 text-sm">
            <Row label={t("auth.profileName")} value={profile.fullName} />
            <Row label={t("auth.profileFather")} value={profile.fatherName} />
            <Row
              label={t("auth.profileMethod")}
              value={profile.channel === "whatsapp" ? t("auth.whatsapp") : t("auth.email")}
            />
            <Row
              label={t("auth.profileContact")}
              value={maskContact(profile.channel, profile.contact)}
            />
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{t("auth.profileNote")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/progress"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t("auth.goToProgress")}
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-extrabold text-slate-900">{t("auth.title")}</h1>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">{t("auth.notConfigured")}</p>
          <p className="mt-2 leading-relaxed">{t("auth.notConfiguredHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">{t("auth.title")}</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{t("auth.subtitle")}</p>
      </div>

      <form
        onSubmit={step === "details" ? onSendCode : onVerify}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
      >
        {step === "details" ? (
          <>
            <Field label={t("auth.fullName")} htmlFor="auth-name">
              <input
                id="auth-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("auth.fullNamePlaceholder")}
                autoComplete="name"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </Field>

            <Field label={t("auth.fatherName")} htmlFor="auth-father">
              <input
                id="auth-father"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder={t("auth.fatherNamePlaceholder")}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </Field>

            <fieldset>
              <legend className="mb-2 block text-sm font-semibold text-slate-700">
                {t("auth.method")}
              </legend>
              <div className="flex gap-2">
                {(["whatsapp", "email"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={channel === option}
                    onClick={() => {
                      setChannel(option);
                      setContact("");
                      setError("");
                    }}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      channel === option
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {option === "whatsapp" ? t("auth.whatsapp") : t("auth.email")}
                  </button>
                ))}
              </div>
            </fieldset>

            <Field
              label={channel === "whatsapp" ? t("auth.contactWhatsapp") : t("auth.contactEmail")}
              htmlFor="auth-contact"
            >
              <input
                id="auth-contact"
                dir="ltr"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={
                  channel === "whatsapp" ? t("auth.whatsappPlaceholder") : t("auth.emailPlaceholder")
                }
                inputMode={channel === "whatsapp" ? "tel" : "email"}
                autoComplete={channel === "whatsapp" ? "tel" : "email"}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </Field>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              {t("auth.sentTo")} <span dir="ltr" className="font-semibold">{sentTo}</span>
            </p>
            {devCode ? (
              <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700">
                {t("auth.devMode")} <span className="font-mono font-bold">{devCode}</span>
              </p>
            ) : null}
            <Field label={t("auth.codeLabel")} htmlFor="auth-code">
              <input
                id="auth-code"
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder={t("auth.codePlaceholder")}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-lg font-bold tracking-[0.3em] outline-none focus:border-brand-500"
              />
            </Field>
            <button
              type="button"
              onClick={() => {
                setStep("details");
                setError("");
                setDevCode(undefined);
              }}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              {t("auth.changeDetails")}
            </button>
          </>
        )}

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {busy
            ? step === "details"
              ? t("auth.sending")
              : t("auth.verifying")
            : step === "details"
              ? t("auth.sendCode")
              : t("auth.verify")}
        </button>

        {devMode ? (
          <p className="text-[11px] leading-relaxed text-slate-400">{t("auth.devModeNote")}</p>
        ) : null}
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
