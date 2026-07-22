"use client";

import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiEdit2, FiPlus, FiSave, FiTrash2 } from "react-icons/fi";

import type {
  AdminContentSnapshot,
  CmsTableName,
  ContactMessage,
  MessageAction,
} from "@/lib/cms-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  adminApiError,
  adminFetch,
  type AdminRequest,
  isRecord,
  parseContactMessages,
  parseUploads,
  readJsonObject,
} from "./admin-api";
import {
  type CmsField,
  CmsFieldInput,
  docxMimeTypes,
  imageMimeTypes,
  pdfMimeTypes,
} from "./cms-field-input";
import { ContactMessagesPanel } from "./contact-messages-panel";
import { MediaLibrary } from "./media-library";
import { SettingsPanel } from "./settings-panel";

type Row = Record<string, unknown>;
type EditableTable = Exclude<CmsTableName, "site_settings" | "contact_messages" | "uploads">;
type Section = {
  table: EditableTable;
  label: string;
  description: string;
  fields: CmsField[];
  singleton?: boolean;
};
type View = "overview" | EditableTable | "contact_messages" | "uploads" | "settings";

const imageAccept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const pdfAccept = ".pdf,application/pdf";
const docxAccept = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const skillCategories = [
  "Data & Business Intelligence",
  "Marketing & Customer Growth",
  "Automation & Operations",
  "Technical Stack",
] as const;

const sections: Section[] = [
  {
    table: "profile",
    label: "Profile",
    singleton: true,
    description: "Identity, positioning and public contact details.",
    fields: [
      { key: "full_name", label: "Full name", required: true },
      { key: "headline", label: "Headline" },
      { key: "tagline", label: "Tagline" },
      { key: "secondary_line", label: "Secondary line" },
      { key: "location", label: "Location" },
      { key: "email", label: "Email", kind: "email" },
      { key: "linkedin_url", label: "LinkedIn URL", kind: "external-url" },
      { key: "github_url", label: "GitHub URL", kind: "external-url" },
      {
        key: "avatar_url",
        label: "Avatar",
        kind: "asset-image",
        bucket: "public-assets",
        accept: imageAccept,
        allowedMimeTypes: imageMimeTypes,
      },
      { key: "availability", label: "Availability" },
      { key: "short_bio", label: "Short bio", kind: "textarea" },
      { key: "about_text", label: "About text", kind: "textarea" },
      { key: "about_focus", label: "Focus points", kind: "list" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "hero",
    label: "Hero",
    singleton: true,
    description: "Homepage copy and calls to action.",
    fields: [
      { key: "eyebrow", label: "Eyebrow" },
      { key: "title", label: "Title" },
      { key: "subtitle", label: "Subtitle" },
      { key: "tagline", label: "Tagline" },
      { key: "dynamic_titles", label: "Dynamic titles", kind: "list" },
      { key: "primary_cta_label", label: "Primary CTA label" },
      { key: "primary_cta_href", label: "Primary CTA link" },
      { key: "secondary_cta_label", label: "Secondary CTA label" },
      { key: "secondary_cta_href", label: "Secondary CTA link" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "about",
    label: "About",
    singleton: true,
    description: "About page introduction and highlights.",
    fields: [
      { key: "title", label: "Title" },
      { key: "body", label: "Body", kind: "textarea" },
      { key: "highlights", label: "Highlights", kind: "list" },
      {
        key: "avatar_url",
        label: "Avatar",
        kind: "asset-image",
        bucket: "public-assets",
        accept: imageAccept,
        allowedMimeTypes: imageMimeTypes,
      },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "skills",
    label: "Skills",
    description: "Skills grouped by recruiter-friendly categories.",
    fields: [
      { key: "name", label: "Skill", required: true },
      { key: "category", label: "Category", kind: "select", options: skillCategories, required: true },
      { key: "icon_key", label: "Icon key" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "projects",
    label: "Projects",
    description: "Project cards and detail metadata.",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "type", label: "Type" },
      { key: "summary", label: "Summary", kind: "textarea" },
      { key: "description", label: "Description", kind: "textarea" },
      {
        key: "cover_image_url",
        label: "Cover image",
        kind: "asset-image",
        bucket: "project-images",
        accept: imageAccept,
        allowedMimeTypes: imageMimeTypes,
      },
      { key: "tags", label: "Tags", kind: "list" },
      { key: "tools", label: "Tools", kind: "list" },
      { key: "github_url", label: "GitHub URL", kind: "external-url" },
      { key: "linkedin_url", label: "LinkedIn URL", kind: "external-url" },
      { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "featured", label: "Featured", kind: "checkbox" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "project_sections",
    label: "Project Sections",
    description: "Editable case-study blocks displayed on project detail pages. Their order, titles and content all come from the CMS.",
    fields: [
      { key: "project_id", label: "Project", kind: "select", required: true },
      { key: "title", label: "Title", required: true },
      { key: "body", label: "Body", kind: "textarea" },
      { key: "bullets", label: "Bullets", kind: "list" },
      { key: "sort_order", label: "Sort order", kind: "number" },
    ],
  },
  {
    table: "experience",
    label: "Experience",
    description: "Career timeline, company logos and achievements.",
    fields: [
      { key: "company", label: "Company", required: true },
      { key: "role", label: "Role", required: true },
      { key: "location", label: "Location" },
      { key: "start_date", label: "Start date" },
      { key: "end_date", label: "End date" },
      {
        key: "logo_url",
        label: "Company logo",
        kind: "asset-image",
        bucket: "public-assets",
        accept: imageAccept,
        allowedMimeTypes: imageMimeTypes,
      },
      { key: "points", label: "Achievements", kind: "list" },
      { key: "tools", label: "Tools", kind: "list" },
      { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "education",
    label: "Education",
    description: "Education and training records.",
    fields: [
      { key: "institution", label: "Institution", required: true },
      { key: "degree", label: "Degree", required: true },
      { key: "start_date", label: "Start date" },
      { key: "end_date", label: "End date" },
      { key: "status", label: "Status" },
      { key: "location", label: "Location" },
      { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "certifications",
    label: "Certifications",
    description: "Credentials displayed on the CV page.",
    fields: [
      { key: "name", label: "Certification name", required: true },
      { key: "issuer", label: "Issuer" },
      { key: "date", label: "Date" },
      { key: "credential_url", label: "Credential URL", kind: "external-url" },
      { key: "credential_id", label: "Credential ID" },
      {
        key: "image_url",
        label: "Certification image",
        kind: "asset-image",
        bucket: "public-assets",
        accept: imageAccept,
        allowedMimeTypes: imageMimeTypes,
      },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "tags", label: "Skills and tags", kind: "list" },
      { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "resumes",
    label: "Resumes",
    description: "PDF and DOCX variants available for download.",
    fields: [
      { key: "label", label: "Label", required: true },
      { key: "variant", label: "Variant", required: true },
      {
        key: "pdf_url",
        label: "PDF file",
        kind: "asset-document",
        bucket: "resumes",
        accept: pdfAccept,
        allowedMimeTypes: pdfMimeTypes,
      },
      {
        key: "docx_url",
        label: "DOCX file",
        kind: "asset-document",
        bucket: "resumes",
        accept: docxAccept,
        allowedMimeTypes: docxMimeTypes,
      },
      { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "social_links",
    label: "Social Links",
    description: "LinkedIn, GitHub, email and future profiles.",
    fields: [
      { key: "label", label: "Label", required: true },
      { key: "url", label: "URL", kind: "external-url", required: true },
      { key: "icon_key", label: "Icon key" },
      { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
];

const emptyRow = (section: Section): Row => Object.fromEntries(section.fields.map((field) => [
  field.key,
  field.kind === "checkbox"
    ? field.key === "published"
    : field.kind === "number"
      ? 0
      : field.kind === "list"
        ? []
        : "",
]));

const rowsFor = (snapshot: AdminContentSnapshot, table: CmsTableName): Row[] =>
  (Array.isArray(snapshot[table]) ? snapshot[table] : []).filter(isRecord);

const sortAndDedupeMessages = (messages: ContactMessage[]) => {
  const byId = new Map(messages.map((message) => [message.id, message]));
  return [...byId.values()].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
};

const actionSuccessMessage: Record<MessageAction, string> = {
  mark_read: "Message marked as read.",
  mark_unread: "Message marked as unread.",
  archive: "Message archived.",
  restore_read: "Message restored to the Inbox as read.",
  restore_unread: "Message restored to the Inbox as unread.",
};

const inputCardTitle = (row: Row, index: number) => String(
  row.full_name
  ?? row.title
  ?? row.name
  ?? row.company
  ?? row.institution
  ?? row.label
  ?? `Entry ${index + 1}`,
);

export const AdminDashboard = ({
  content,
  email,
  accessToken,
}: {
  content: AdminContentSnapshot;
  email?: string;
  accessToken?: string;
}) => {
  const [view, setView] = useState<View>("overview");
  const [records, setRecords] = useState<Record<string, Row[]>>(() =>
    Object.fromEntries(sections.map((section) => [section.table, rowsFor(content, section.table)])),
  );
  const [messages, setMessages] = useState<ContactMessage[]>(() =>
    sortAndDedupeMessages(parseContactMessages(content.contact_messages)),
  );
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Row>({});
  const [contentStatus, setContentStatus] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const messageRefreshIdRef = useRef(0);
  const initialUploads = useMemo(() => parseUploads(content.uploads), [content.uploads]);

  const request = useCallback<AdminRequest>(
    (url, init = {}) => adminFetch(url, init, accessToken),
    [accessToken],
  );

  const active = sections.find((section) => section.table === view);
  const activeFields = useMemo(() => {
    if (!active || active.table !== "project_sections") return active?.fields ?? [];

    return active.fields.map((field) => field.key === "project_id"
      ? {
          ...field,
          options: (records.projects ?? []).map((project) => ({
            label: String(project.title ?? project.slug ?? "Untitled project"),
            value: String(project.id ?? ""),
          })).filter((option) => option.value),
        }
      : field);
  }, [active, records.projects]);
  const stats = useMemo(() => ({
    skills: records.skills?.length ?? 0,
    projects: records.projects?.length ?? 0,
    experience: records.experience?.length ?? 0,
    certifications: records.certifications?.length ?? 0,
    resumes: records.resumes?.length ?? 0,
    unread: messages.filter((message) => message.status === "new").length,
  }), [messages, records]);

  const refreshMessages = useCallback(async (reportErrors = false) => {
    const refreshId = ++messageRefreshIdRef.current;
    try {
      const response = await request("/api/admin/messages?view=all");
      const data = await readJsonObject(response);
      if (refreshId !== messageRefreshIdRef.current) return;
      if (!response.ok || data.ok !== true) {
        if (reportErrors) setMessageStatus(adminApiError(data));
        return;
      }
      setMessages(sortAndDedupeMessages(parseContactMessages(data.messages)));
    } catch {
      if (refreshId === messageRefreshIdRef.current && reportErrors) {
        setMessageStatus("Could not refresh contact messages.");
      }
    }
  }, [request]);

  useEffect(() => {
    let stopped = false;
    const refreshFromServer = () => {
      if (!stopped) void refreshMessages();
    };

    void refreshMessages(true);
    const intervalId = window.setInterval(refreshFromServer, 30_000);
    const handleFocus = () => refreshFromServer();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshFromServer();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let removeRealtime: (() => void) | undefined;
    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel("admin-contact-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "contact_messages" },
          refreshFromServer,
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "contact_messages" },
          refreshFromServer,
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "contact_messages" },
          refreshFromServer,
        )
        .subscribe();
      removeRealtime = () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      // The 30-second and focus refreshes remain active if Realtime is unavailable.
    }

    return () => {
      stopped = true;
      messageRefreshIdRef.current += 1;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      removeRealtime?.();
    };
  }, [refreshMessages]);

  const beginEdit = (section: Section, index: number) => {
    setEditing(index);
    setDraft({ ...(records[section.table]?.[index] ?? emptyRow(section)) });
    setContentStatus("");
  };

  const beginAdd = (section: Section) => {
    setEditing(-1);
    setDraft(emptyRow(section));
    setContentStatus("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft({});
    setContentStatus("");
  };

  const selectView = (target: View) => {
    setView(target);
    cancelEdit();
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active) return;
    setContentStatus("Saving...");

    const response = await request("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: active.table, values: draft }),
    });
    const data = await readJsonObject(response);
    const savedRow = isRecord(data.row) ? data.row : null;

    if (!response.ok || data.ok !== true || !savedRow) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("CMS save failed", { status: response.status, data });
      }
      setContentStatus(adminApiError(data));
      return;
    }

    setRecords((current) => {
      const next = [...(current[active.table] ?? [])];
      if (editing === -1) next.push(savedRow);
      else if (editing !== null) next[editing] = savedRow;
      return { ...current, [active.table]: next };
    });
    setContentStatus("Saved.");
    setEditing(null);
    setDraft({});
  };

  const remove = async (section: Section, index: number) => {
    const row = records[section.table]?.[index];
    if (!row) return;
    if (!row.id) {
      setRecords((current) => ({
        ...current,
        [section.table]: current[section.table].filter((_, itemIndex) => itemIndex !== index),
      }));
      return;
    }
    if (!window.confirm(`Delete this ${section.label.toLowerCase()} entry?`)) return;

    const response = await request("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: section.table, id: row.id }),
    });
    const data = await readJsonObject(response);
    if (!response.ok || data.ok !== true) {
      setContentStatus(adminApiError(data));
      return;
    }

    setRecords((current) => ({
      ...current,
      [section.table]: current[section.table].filter((_, itemIndex) => itemIndex !== index),
    }));
    setContentStatus("Deleted.");
  };

  const updateMessage = async (id: string, action: MessageAction) => {
    setPendingMessageId(id);
    setMessageStatus("Updating message...");
    try {
      const response = await request("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await readJsonObject(response);
      const updated = parseContactMessages([data.message])[0];
      if (!response.ok || data.ok !== true || !updated) {
        setMessageStatus(adminApiError(data));
        return;
      }

      setMessages((current) => sortAndDedupeMessages([
        updated,
        ...current.filter((message) => message.id !== updated.id),
      ]));
      setMessageStatus(actionSuccessMessage[action]);
    } catch {
      setMessageStatus("The message could not be updated.");
    } finally {
      setPendingMessageId(null);
    }
  };

  const deleteMessage = async (message: ContactMessage) => {
    const sender = message.name || message.email || "this sender";
    if (!window.confirm(`Permanently delete the message from ${sender}? This cannot be undone.`)) return;

    setPendingMessageId(message.id);
    setMessageStatus("Deleting message...");
    try {
      const response = await request("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: message.id }),
      });
      const data = await readJsonObject(response);
      if (!response.ok || data.ok !== true || data.deletedId !== message.id) {
        setMessageStatus(adminApiError(data));
        return;
      }

      setMessages((current) => current.filter((item) => item.id !== message.id));
      setMessageStatus("Message permanently deleted.");
    } catch {
      setMessageStatus("The message could not be deleted.");
    } finally {
      setPendingMessageId(null);
    }
  };

  const navButton = (target: View, label: string, badge = 0) => (
    <button
      type="button"
      onClick={() => selectView(target)}
      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
        view === target ? "bg-cyan-300/15 text-cyan-100" : "text-gray-300 hover:bg-white/10"
      }`}
    >
      <span>{label}</span>
      {badge > 0 && (
        <span className="min-w-6 rounded-full bg-cyan-300 px-1.5 py-0.5 text-center text-[0.65rem] font-bold text-[#100b24]" aria-label={`${badge} unread`}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <section className="relative z-[20] mx-auto w-full max-w-7xl px-6 py-28 text-gray-200">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="Welcome-text text-sm uppercase">CMS Admin</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Portfolio Dashboard</h1>
          <p className="mt-3 text-sm text-gray-400">Signed in as {email ?? "admin"}. Edit content through simple forms.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/security" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Security</Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Logout</button>
          </form>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="CMS sections" className="flex h-fit flex-col gap-1 rounded-lg border border-white/10 bg-[#100b24]/80 p-3">
          {navButton("overview", "Overview")}
          {sections.map((section) => <span key={section.table} className="contents">{navButton(section.table, section.label)}</span>)}
          {navButton("contact_messages", "Contact Messages", stats.unread)}
          {navButton("uploads", "Media Library")}
          {navButton("settings", "Settings")}
        </nav>

        <div className="min-w-0 rounded-lg border border-white/10 bg-[#100b24]/90 p-5 shadow-xl shadow-[#2A0E61]/20">
          {view === "overview" && (
            <div>
              <h2 className="text-2xl font-bold text-white">Overview</h2>
              <p className="mt-2 text-sm text-gray-400">Current CMS content at a glance.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Profile", records.profile?.length ? "Ready" : "Needs content"],
                  ["Hero", records.hero?.length ? "Ready" : "Needs content"],
                  ["Skills", stats.skills],
                  ["Projects", stats.projects],
                  ["Experience", stats.experience],
                  ["Certifications", stats.certifications],
                  ["CV files", stats.resumes],
                  ["Unread messages", stats.unread],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active && (
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{active.label}</h2>
                  <p className="mt-2 text-sm text-gray-400">{active.description}</p>
                </div>
                {editing === null && (!active.singleton || !(records[active.table]?.length)) && (
                  <button type="button" onClick={() => beginAdd(active)} className="button-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white">
                    <FiPlus aria-hidden="true" />Add
                  </button>
                )}
              </div>

              {editing !== null ? (
                <form onSubmit={save} className="mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeFields.map((field) => (
                      <CmsFieldInput
                        key={field.key}
                        field={field}
                        value={draft[field.key]}
                        request={request}
                        onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                      />
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button type="submit" className="button-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white">
                      <FiSave aria-hidden="true" />Save
                    </button>
                    <button type="button" onClick={cancelEdit} className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10">Cancel</button>
                    <p className="text-sm text-cyan-100" aria-live="polite">{contentStatus}</p>
                  </div>
                </form>
              ) : (
                <div className="mt-6 grid gap-3">
                  {(records[active.table] ?? []).map((row, index) => (
                    <article key={String(row.id ?? `${active.table}-${index}`)} className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">{inputCardTitle(row, index)}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-400">{String(row.headline ?? row.summary ?? row.role ?? row.issuer ?? row.degree ?? row.url ?? row.body ?? "")}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" aria-label={`Edit ${inputCardTitle(row, index)}`} onClick={() => beginEdit(active, index)} className="rounded-lg border border-white/10 bg-white/5 p-2.5 hover:bg-white/10">
                          <FiEdit2 aria-hidden="true" />
                        </button>
                        <button type="button" aria-label={`Delete ${inputCardTitle(row, index)}`} onClick={() => void remove(active, index)} className="rounded-lg border border-red-300/20 bg-red-500/10 p-2.5 text-red-100 hover:bg-red-500/20">
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                  {!(records[active.table]?.length) && <p className="py-8 text-center text-sm text-gray-400">No entries yet.</p>}
                  <p className="text-sm text-cyan-100" aria-live="polite">{contentStatus}</p>
                </div>
              )}
            </div>
          )}

          {view === "contact_messages" && (
            <ContactMessagesPanel
              messages={messages}
              pendingMessageId={pendingMessageId}
              status={messageStatus}
              onAction={updateMessage}
              onDelete={deleteMessage}
            />
          )}

          {view === "uploads" && <MediaLibrary initialUploads={initialUploads} request={request} />}

          {view === "settings" && (
            <SettingsPanel
              initialEmail={email}
              messages={messages}
              pendingMessageId={pendingMessageId}
              messageStatus={messageStatus}
              request={request}
              onMessageAction={updateMessage}
              onMessageDelete={deleteMessage}
            />
          )}
        </div>
      </div>
    </section>
  );
};
