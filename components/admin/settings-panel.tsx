"use client";

import { type FormEvent, useEffect, useState } from "react";
import { FiArchive, FiEye, FiMail, FiSave, FiTrash2 } from "react-icons/fi";

import type {
  AdminProfileSettings,
  ContactMessage,
  MessageAction,
} from "@/lib/cms-types";

import {
  adminApiError,
  type AdminRequest,
  parseAdminProfile,
  readJsonObject,
} from "./admin-api";
import { AssetFieldInput } from "./asset-field-input";
import { imageMimeTypes } from "./cms-field-input";

type SettingsPanelProps = {
  initialEmail?: string;
  messages: ContactMessage[];
  pendingMessageId: string | null;
  messageStatus: string;
  request: AdminRequest;
  onMessageAction: (id: string, action: MessageAction) => Promise<void>;
  onMessageDelete: (message: ContactMessage) => Promise<void>;
};

const emptyProfile: AdminProfileSettings = {
  displayName: "",
  jobTitle: "",
  phone: "",
  avatarUrl: "",
  timezone: "",
  language: "",
};

const inputClass = "w-full rounded-lg border border-white/10 bg-[#151030] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60 read-only:cursor-not-allowed read-only:text-gray-400";

const formatDateTime = (value: string | null) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function SettingsPanel({
  initialEmail,
  messages,
  pendingMessageId,
  messageStatus,
  request,
  onMessageAction,
  onMessageDelete,
}: SettingsPanelProps) {
  const [profile, setProfile] = useState<AdminProfileSettings>(emptyProfile);
  const [loginEmail, setLoginEmail] = useState(initialEmail ?? "");
  const [profileStatus, setProfileStatus] = useState("Loading admin profile...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await request("/api/admin/settings", { signal: controller.signal });
        const data = await readJsonObject(response);
        if (!response.ok || data.ok !== true) {
          setProfileStatus(adminApiError(data));
          return;
        }

        setProfile(parseAdminProfile(data.profile));
        setLoginEmail(typeof data.email === "string" ? data.email : initialEmail ?? "");
        setProfileStatus("");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setProfileStatus("Could not load the admin profile.");
        }
      }
    };

    void loadProfile();
    return () => controller.abort();
  }, [initialEmail, request]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setProfileStatus("Saving admin profile...");

    try {
      const response = await request("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await readJsonObject(response);
      if (!response.ok || data.ok !== true) {
        setProfileStatus(adminApiError(data));
        return;
      }

      setProfile(parseAdminProfile(data.profile));
      if (typeof data.email === "string") setLoginEmail(data.email);
      setProfileStatus("Admin profile saved. These details remain private to the CMS.");
    } catch {
      setProfileStatus("The admin profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const archivedMessages = messages
    .filter((message) => message.status === "archived")
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));

  const updateProfile = (key: keyof AdminProfileSettings, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setProfileStatus("");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      <p className="mt-2 text-sm text-gray-400">Private CMS preferences and archived contact messages. Nothing on this page is added to the public portfolio.</p>

      <section aria-labelledby="admin-profile-heading" className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <div>
          <h3 id="admin-profile-heading" className="text-xl font-semibold text-white">Admin Profile</h3>
          <p className="mt-1 text-sm text-gray-400">Profile details for this authenticated admin account only.</p>
        </div>

        <form onSubmit={saveProfile} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-gray-300">
            <span>Display name</span>
            <input value={profile.displayName} onChange={(event) => updateProfile("displayName", event.target.value)} className={inputClass} maxLength={120} />
          </label>
          <label className="grid gap-2 text-sm text-gray-300">
            <span>Job title</span>
            <input value={profile.jobTitle} onChange={(event) => updateProfile("jobTitle", event.target.value)} className={inputClass} maxLength={160} />
          </label>
          <label className="grid gap-2 text-sm text-gray-300">
            <span>Phone</span>
            <input type="tel" value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} className={inputClass} maxLength={40} />
          </label>
          <label className="grid gap-2 text-sm text-gray-300">
            <span>Login email</span>
            <input type="email" value={loginEmail} readOnly className={inputClass} aria-describedby="login-email-note" />
            <span id="login-email-note" className="text-xs text-gray-500">Read-only. Authentication email changes are not managed here.</span>
          </label>
          <label className="grid gap-2 text-sm text-gray-300">
            <span>Timezone</span>
            <input value={profile.timezone} onChange={(event) => updateProfile("timezone", event.target.value)} className={inputClass} placeholder="Europe/Paris" maxLength={80} />
          </label>
          <label className="grid gap-2 text-sm text-gray-300">
            <span>Language</span>
            <input value={profile.language} onChange={(event) => updateProfile("language", event.target.value)} className={inputClass} placeholder="en" maxLength={40} />
          </label>

          <AssetFieldInput
            label="Avatar"
            value={profile.avatarUrl}
            kind="image"
            bucket="public-assets"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            allowedMimeTypes={imageMimeTypes}
            request={request}
            onChange={(value) => updateProfile("avatarUrl", value)}
          />

          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="button-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
            >
              <FiSave aria-hidden="true" />
              {saving ? "Saving..." : "Save admin profile"}
            </button>
            <p className="text-sm text-cyan-100" aria-live="polite">{profileStatus}</p>
          </div>
        </form>
      </section>

      <section aria-labelledby="archived-messages-heading" className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="archived-messages-heading" className="flex items-center gap-2 text-xl font-semibold text-white">
              <FiArchive aria-hidden="true" />
              Archived Messages
            </h3>
            <p className="mt-1 text-sm text-gray-400">Restore a message to the Inbox or permanently delete it.</p>
          </div>
          <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1 text-sm text-purple-100">
            {archivedMessages.length} archived
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          {archivedMessages.map((message) => {
            const isPending = pendingMessageId === message.id;
            return (
              <article key={message.id} aria-busy={isPending} className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white">{message.name || "Unknown sender"}</h4>
                    <a href={`mailto:${message.email}`} className="break-all text-sm text-cyan-200 hover:text-cyan-100">{message.email}</a>
                  </div>
                  <div className="shrink-0 text-xs text-gray-500 sm:text-right">
                    <p>Received {formatDateTime(message.created_at)}</p>
                    <p className="mt-1">Archived {formatDateTime(message.archived_at)}</p>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-300">{message.message}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void onMessageAction(message.id, "restore_read")}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                  >
                    <FiEye aria-hidden="true" />
                    Restore as read
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void onMessageAction(message.id, "restore_unread")}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-400/15 disabled:cursor-wait disabled:opacity-50"
                  >
                    <FiMail aria-hidden="true" />
                    Restore as unread
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void onMessageDelete(message)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50"
                  >
                    <FiTrash2 aria-hidden="true" />
                    Delete permanently
                  </button>
                </div>
              </article>
            );
          })}

          {!archivedMessages.length && (
            <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-400">No archived messages.</p>
          )}
        </div>
        <p className="mt-4 min-h-5 text-sm text-cyan-100" aria-live="polite">{messageStatus}</p>
      </section>
    </div>
  );
}
