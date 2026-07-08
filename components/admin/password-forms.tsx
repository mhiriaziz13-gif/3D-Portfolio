"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    setStatus(data.message ?? "If this email is allowed, a recovery message has been sent.");
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-[#100b24]/90 p-6 text-gray-200 shadow-xl shadow-[#2A0E61]/25 backdrop-blur-md">
      <h1 className="text-3xl font-bold text-white">Forgot password</h1>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm">
          Admin email
          <input className="rounded-lg border border-white/10 bg-[#151030] px-4 py-3 text-white outline-none focus:border-cyan-300/60" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <button type="submit" disabled={pending} className="button-primary rounded-lg px-5 py-3 font-bold text-white disabled:opacity-60">{pending ? "Sending..." : "Send recovery link"}</button>
      </form>
      <p className="mt-5 min-h-6 text-sm text-cyan-100" aria-live="polite">{status}</p>
      <Link href="/admin/login" className="mt-4 inline-flex text-sm text-gray-300 hover:text-cyan-100">Back to login</Link>
    </div>
  );
};

export const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok || !data.ok) {
      setStatus(data.error ?? "Password could not be updated.");
      return;
    }

    window.location.href = data.redirectTo ?? "/admin/login?reset=success";
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-[#100b24]/90 p-6 text-gray-200 shadow-xl shadow-[#2A0E61]/25 backdrop-blur-md">
      <h1 className="text-3xl font-bold text-white">Reset password</h1>
      <p className="mt-3 text-sm leading-6 text-gray-400">Use at least 12 characters with uppercase, lowercase and a number.</p>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm">
          New password
          <input className="rounded-lg border border-white/10 bg-[#151030] px-4 py-3 text-white outline-none focus:border-cyan-300/60" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button type="submit" disabled={pending} className="button-primary rounded-lg px-5 py-3 font-bold text-white disabled:opacity-60">{pending ? "Updating..." : "Update password"}</button>
      </form>
      <p className="mt-5 min-h-6 text-sm text-cyan-100" aria-live="polite">{status}</p>
    </div>
  );
};