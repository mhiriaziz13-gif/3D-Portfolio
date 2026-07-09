"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type LoginFormProps = {
  nextPath: string;
  initialMfaRequired?: boolean;
  initialError?: string;
  resetSuccess?: boolean;
};

type MfaFactor = {
  id: string;
  friendly_name?: string;
};

const loginErrorMessage = (error?: string) => ({
  unauthorized: "This account is not authorized for portfolio administration.",
  callback: "The authentication callback could not be completed.",
  github: "GitHub login is not configured or unavailable.",
  session: "The login session is missing or expired.",
}[error ?? ""] ?? (error ? "Login could not be completed." : ""));

export const LoginForm = ({ nextPath, initialMfaRequired = false, initialError, resetSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState(initialMfaRequired);
  const [status, setStatus] = useState(initialError ? loginErrorMessage(initialError) : resetSuccess ? "Password updated. Please log in again." : "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!initialMfaRequired) return;

    const loadMfa = async () => {
      const response = await fetch("/api/auth/mfa/status", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const factor = data.factors?.totp?.[0] as MfaFactor | undefined;
      if (factor?.id) setFactorId(factor.id);
    };

    void loadMfa();
  }, [initialMfaRequired]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setStatus("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, next: nextPath }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok || !data.ok) {
      setStatus(data.error ?? "Invalid email or password.");
      return;
    }

    if (data.mfaRequired) {
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }
      setFactorId(data.factorId);
      setMfaStep(true);
      setStatus("Enter your Google Authenticator code.");
      return;
    }

    window.location.href = data.redirectTo ?? "/admin";
  };

  const submitMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!factorId) {
      setStatus("No authenticator factor found. Open Security to enroll MFA.");
      return;
    }

    setPending(true);
    setStatus("");
    const response = await fetch("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factorId, code, rememberDevice }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok || !data.ok) {
      setStatus(data.error ?? "Invalid authenticator code.");
      return;
    }

    window.location.href = nextPath || data.redirectTo || "/admin";
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-[#100b24]/90 p-6 text-gray-200 shadow-xl shadow-[#2A0E61]/25 backdrop-blur-md">
      <p className="Welcome-text text-sm uppercase">Admin</p>
      <h1 className="mt-3 text-3xl font-bold text-white">Secure login</h1>
      <p className="mt-3 text-sm leading-6 text-gray-400">Use Ahmed&apos;s approved admin account. GitHub users still need explicit admin access.</p>

      {!mfaStep ? (
        <form onSubmit={submitLogin} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm">
            Email
            <input className="rounded-lg border border-white/10 bg-[#151030] px-4 py-3 text-white outline-none focus:border-cyan-300/60" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Password
            <input className="rounded-lg border border-white/10 bg-[#151030] px-4 py-3 text-white outline-none focus:border-cyan-300/60" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="submit" disabled={pending} className="button-primary rounded-lg px-5 py-3 font-bold text-white disabled:opacity-60">{pending ? "Checking..." : "Log in"}</button>
        </form>
      ) : (
        <form onSubmit={submitMfa} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm">
            6-digit authenticator code
            <input className="rounded-lg border border-white/10 bg-[#151030] px-4 py-3 text-white outline-none focus:border-cyan-300/60" inputMode="numeric" pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value)} required />
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-300">
            <input type="checkbox" checked={rememberDevice} onChange={(event) => setRememberDevice(event.target.checked)} />
            Remember this device for 10 days
          </label>
          <button type="submit" disabled={pending || !factorId} className="button-primary rounded-lg px-5 py-3 font-bold text-white disabled:opacity-60">{pending ? "Verifying..." : "Verify code"}</button>
        </form>
      )}

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <Link href={`/api/auth/oauth/github?next=${encodeURIComponent(nextPath)}`} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10">Continue with GitHub</Link>
        <Link href="/admin/forgot-password" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10">Forgot password</Link>
        {mfaStep && <Link href="/admin/security?setup=mfa" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10">MFA setup</Link>}
      </div>

      <p className="mt-5 min-h-6 text-sm text-cyan-100" aria-live="polite">{status}</p>
    </div>
  );
};