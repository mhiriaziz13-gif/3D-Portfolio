"use client";

import {
  ArrowDownTrayIcon,
  EnvelopeIcon,
  LinkIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { FaGithub } from "react-icons/fa6";

import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type { ProfileContent } from "@/lib/cms-types";

const EarthCanvas = dynamic(
  () =>
    import("@/components/canvas/earth-canvas").then((mod) => mod.EarthCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-gray-400">
        Loading connection view...
      </div>
    ),
  },
);

type ContactFormState = {
  name: string;
  email: string;
  message: string;
};

const buildMailto = (form: ContactFormState, recipient: string) => {
  const subject = encodeURIComponent(`Portfolio contact from ${form.name}`);
  const body = encodeURIComponent(
    `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
  );

  return `mailto:${recipient}?subject=${subject}&body=${body}`;
};

const initialForm: ContactFormState = {
  name: "",
  email: "",
  message: "",
};

export const Contact = ({ profile = fallbackPortfolioContent.profile }: { profile?: ProfileContent }) => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setStatus("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, company: "" }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok && !data.fallback) {
        setForm(initialForm);
        setStatus(data.message ?? "Message sent. Thank you.");
        return;
      }

      if (data.fallback) {
        window.location.href = buildMailto(form, profile.email);
        setStatus("Your email app should open with a drafted message.");
        return;
      }

      setStatus(data.error ?? "Message could not be sent right now.");
    } catch {
      window.location.href = buildMailto(form, profile.email);
      setStatus("Your email app should open with a drafted message.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative z-[20] mx-auto flex w-full max-w-7xl flex-col-reverse gap-10 overflow-hidden px-6 py-24 xl:flex-row"
    >
      <motion.div
        initial={{ opacity: 0, x: -80 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-[0.85] rounded-lg border border-white/10 bg-[#100b24]/90 p-6 shadow-xl shadow-[#2A0E61]/25 backdrop-blur-md sm:p-8"
      >
        <p className="Welcome-text text-sm uppercase">Contact</p>
        <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
          Let&apos;s connect
        </h2>
        <p className="mt-4 text-base leading-7 text-gray-300">
          {profile.availability}.
        </p>
        <p className="mt-3 text-sm leading-7 text-gray-400">
          For marketing analytics, commercial analytics, business intelligence,
          automation or data operations conversations, reach out by email,
          LinkedIn, GitHub or the form below.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
          <label className="flex flex-col">
            <span className="mb-3 font-medium text-white">Name</span>
            <input
              required
              name="name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Your name"
              className="rounded-lg border border-white/10 bg-[#151030] px-5 py-4 font-medium text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-300/60"
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-3 font-medium text-white">Email</span>
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="your.email@example.com"
              className="rounded-lg border border-white/10 bg-[#151030] px-5 py-4 font-medium text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-300/60"
            />
          </label>

          <label className="hidden" aria-hidden="true">
            Company
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>

          <label className="flex flex-col">
            <span className="mb-3 font-medium text-white">Message</span>
            <textarea
              required
              name="message"
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              placeholder="How can I help?"
              rows={7}
              className="resize-none rounded-lg border border-white/10 bg-[#151030] px-5 py-4 font-medium text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-300/60"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="button-primary inline-flex w-fit items-center justify-center gap-2 rounded-lg px-6 py-3 font-bold text-white outline-none transition hover:scale-[1.02] focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <EnvelopeIcon className="h-5 w-5" />
            {pending ? "Sending..." : "Send Message"}
          </button>

          <p className="min-h-6 text-sm text-cyan-100" aria-live="polite">
            {status}
          </p>
        </form>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200 transition hover:bg-white/10"
          >
            <EnvelopeIcon className="h-4 w-4" />
            {profile.email}
          </Link>
          <Link
            href={profile.linkedIn}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200 transition hover:bg-white/10"
          >
            <LinkIcon className="h-4 w-4" />
            LinkedIn
          </Link>
          <Link
            href={profile.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200 transition hover:bg-white/10"
          >
            <FaGithub className="h-4 w-4" />
            GitHub
          </Link>
          <Link
            href="/resume"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200 transition hover:bg-white/10"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download CV
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 80 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-[360px] md:h-[560px] xl:h-auto xl:flex-1"
        aria-hidden="true"
      >
        <EarthCanvas />
      </motion.div>
    </section>
  );
};