"use client";

import { EnvelopeIcon } from "@heroicons/react/24/solid";
import { type FormEvent, useState } from "react";

import { pushAnalyticsEvent } from "@/lib/analytics/events";

type ContactFormState = {
  name: string;
  email: string;
  message: string;
};

const initialForm: ContactFormState = {
  name: "",
  email: "",
  message: "",
};

const buildMailto = (form: ContactFormState, recipient: string) => {
  const subject = encodeURIComponent(`Portfolio contact from ${form.name}`);
  const body = encodeURIComponent(
    `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
  );

  return `mailto:${recipient}?subject=${subject}&body=${body}`;
};

export const ContactForm = ({ recipient }: { recipient: string }) => {
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
        pushAnalyticsEvent({ event: "contact_submit_success", form_name: "portfolio_contact", contact_method: "api", cta_location: "contact_page" });
        pushAnalyticsEvent({ event: "contact_submit", form_name: "portfolio_contact" });
        setForm(initialForm);
        setStatus(data.message ?? "Message sent. Thank you.");
        return;
      }

      if (data.fallback) {
        pushAnalyticsEvent({ event: "contact_fallback_mailto", form_name: "portfolio_contact", contact_method: "mailto_fallback", cta_location: "contact_page" });
        window.location.href = buildMailto(form, recipient);
        setStatus("Your email app should open with a drafted message.");
        return;
      }

      pushAnalyticsEvent({
        event: "contact_submit_error",
        form_name: "portfolio_contact",
        error_type: "api_error",
      });
      setStatus(data.error ?? "Message could not be sent right now.");
    } catch {
      pushAnalyticsEvent({
        event: "contact_submit_error",
        form_name: "portfolio_contact",
        error_type: "network_error",
      });
      pushAnalyticsEvent({ event: "contact_fallback_mailto", form_name: "portfolio_contact", contact_method: "mailto_fallback", cta_location: "contact_page" });
      window.location.href = buildMailto(form, recipient);
      setStatus("Your email app should open with a drafted message.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      data-clarity-mask="true"
      action="/api/contact"
      method="post"
      onSubmit={handleSubmit}
      className="mt-10 flex flex-col gap-6"
    >
      <label className="flex flex-col">
        <span className="mb-3 font-medium text-white">Name</span>
        <input
          required
          name="name"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
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
            setForm((current) => ({ ...current, email: event.target.value }))
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
            setForm((current) => ({ ...current, message: event.target.value }))
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
  );
};
