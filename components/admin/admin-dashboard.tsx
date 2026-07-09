"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiUploadCloud } from "react-icons/fi";

import type { AdminContentSnapshot, CmsTableName } from "@/lib/cms-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Row = Record<string, unknown>;
type FieldKind = "text" | "url" | "email" | "textarea" | "list" | "number" | "checkbox" | "select";
type Field = { key: string; label: string; kind?: FieldKind; required?: boolean; options?: string[]; placeholder?: string };
type Section = { table: CmsTableName; label: string; description: string; fields: Field[]; singleton?: boolean };
type View = "overview" | CmsTableName;

const skillCategories = [
  "Data & Business Intelligence",
  "Marketing & Customer Growth",
  "Automation & Operations",
  "Technical Stack",
];

const sections: Section[] = [
  {
    table: "profile", label: "Profile", singleton: true, description: "Identity, positioning and public contact details.",
    fields: [
      { key: "full_name", label: "Full name", required: true }, { key: "headline", label: "Headline" },
      { key: "tagline", label: "Tagline" }, { key: "secondary_line", label: "Secondary line" },
      { key: "location", label: "Location" }, { key: "email", label: "Email", kind: "email" },
      { key: "linkedin_url", label: "LinkedIn URL", kind: "url" }, { key: "github_url", label: "GitHub URL", kind: "url" },
      { key: "avatar_url", label: "Avatar URL", kind: "url" }, { key: "availability", label: "Availability" },
      { key: "short_bio", label: "Short bio", kind: "textarea" }, { key: "about_text", label: "About text", kind: "textarea" },
      { key: "about_focus", label: "Focus points", kind: "list" }, { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "hero", label: "Hero", singleton: true, description: "Homepage copy and calls to action.",
    fields: [
      { key: "eyebrow", label: "Eyebrow" }, { key: "title", label: "Title" }, { key: "subtitle", label: "Subtitle" },
      { key: "tagline", label: "Tagline" }, { key: "dynamic_titles", label: "Dynamic titles", kind: "list" },
      { key: "primary_cta_label", label: "Primary CTA label" }, { key: "primary_cta_href", label: "Primary CTA link" },
      { key: "secondary_cta_label", label: "Secondary CTA label" }, { key: "secondary_cta_href", label: "Secondary CTA link" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "about", label: "About", singleton: true, description: "About page introduction and highlights.",
    fields: [
      { key: "title", label: "Title" }, { key: "body", label: "Body", kind: "textarea" },
      { key: "highlights", label: "Highlights", kind: "list" }, { key: "avatar_url", label: "Avatar URL", kind: "url" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "skills", label: "Skills", description: "Skills grouped by recruiter-friendly categories.",
    fields: [
      { key: "name", label: "Skill", required: true }, { key: "category", label: "Category", kind: "select", options: skillCategories, required: true },
      { key: "icon_key", label: "Icon key" }, { key: "description", label: "Description", kind: "textarea" },
      { key: "sort_order", label: "Sort order", kind: "number" }, { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "projects", label: "Projects", description: "Project cards and detail metadata.",
    fields: [
      { key: "title", label: "Title", required: true }, { key: "slug", label: "Slug", required: true }, { key: "type", label: "Type" },
      { key: "summary", label: "Summary", kind: "textarea" }, { key: "description", label: "Description", kind: "textarea" },
      { key: "cover_image_url", label: "Cover image URL", kind: "url" }, { key: "tags", label: "Tags", kind: "list" },
      { key: "tools", label: "Tools", kind: "list" }, { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "featured", label: "Featured", kind: "checkbox" }, { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "project_sections", label: "Project Sections", description: "Structured blocks used on project detail pages.",
    fields: [
      { key: "project_id", label: "Project ID", required: true }, { key: "title", label: "Title", required: true },
      { key: "body", label: "Body", kind: "textarea" }, { key: "bullets", label: "Bullets", kind: "list" },
      { key: "sort_order", label: "Sort order", kind: "number" },
    ],
  },
  {
    table: "experience", label: "Experience", description: "Career timeline, company logos and achievements.",
    fields: [
      { key: "company", label: "Company", required: true }, { key: "role", label: "Role", required: true }, { key: "location", label: "Location" },
      { key: "start_date", label: "Start date" }, { key: "end_date", label: "End date" }, { key: "logo_url", label: "Logo URL", kind: "url" },
      { key: "points", label: "Achievements", kind: "list" }, { key: "tools", label: "Tools", kind: "list" },
      { key: "sort_order", label: "Sort order", kind: "number" }, { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "education", label: "Education", description: "Education and training records.",
    fields: [
      { key: "institution", label: "Institution", required: true }, { key: "degree", label: "Degree", required: true },
      { key: "start_date", label: "Start date" }, { key: "end_date", label: "End date" }, { key: "status", label: "Status" },
      { key: "location", label: "Location" }, { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "certifications", label: "Certifications", description: "Credentials displayed on the CV page.",
    fields: [
      { key: "name", label: "Certification name", required: true }, { key: "issuer", label: "Issuer" }, { key: "date", label: "Date" },
      { key: "credential_url", label: "Credential URL", kind: "url" }, { key: "credential_id", label: "Credential ID" },
      { key: "image_url", label: "Image URL", kind: "url" }, { key: "description", label: "Description", kind: "textarea" },
      { key: "tags", label: "Skills and tags", kind: "list" }, { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "resumes", label: "Resumes", description: "PDF and DOCX variants available for download.",
    fields: [
      { key: "label", label: "Label", required: true }, { key: "variant", label: "Variant", required: true },
      { key: "pdf_url", label: "PDF URL", kind: "url" }, { key: "docx_url", label: "DOCX URL", kind: "url" },
      { key: "sort_order", label: "Sort order", kind: "number" }, { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  {
    table: "social_links", label: "Social Links", description: "LinkedIn, GitHub, email and future profiles.",
    fields: [
      { key: "label", label: "Label", required: true }, { key: "url", label: "URL", required: true },
      { key: "icon_key", label: "Icon key" }, { key: "sort_order", label: "Sort order", kind: "number" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
];

const emptyRow = (section: Section): Row => Object.fromEntries(section.fields.map((field) => [field.key, field.kind === "checkbox" ? field.key === "published" : field.kind === "number" ? 0 : field.kind === "list" ? [] : ""]));
const rowsFor = (snapshot: AdminContentSnapshot, table: CmsTableName): Row[] => (Array.isArray(snapshot[table]) ? snapshot[table] : []).filter((row): row is Row => Boolean(row) && typeof row === "object");
const inputClass = "w-full rounded-lg border border-white/10 bg-[#151030] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60";
const adminApiError = (data: { code?: string; error?: string }) => {
  switch (data.code) {
    case "not_authenticated":
      return "Your session expired. Please log in again.";
    case "not_admin":
      return "This account is not authorized to change CMS content.";
    case "mfa_required":
      return "MFA verification is required before this action.";
    case "validation_error":
      return data.error ?? "Please check the submitted fields.";
    case "origin_not_allowed":
      return "This request was blocked by the site origin check. Refresh and try again.";
    case "server_error":
      return "The server could not complete this CMS action.";
    default:
      return data.error ?? "The CMS action could not be completed.";
  }
};

const adminFetch = async (url: string, init: RequestInit, verifiedAccessToken?: string) => {
  const headers = new Headers(init.headers);
  let token = verifiedAccessToken;

  try {
    const supabaseClient = createSupabaseBrowserClient();
    const { data } = await supabaseClient.auth.getSession();
    let session = data.session;

    const expiresAt = session?.expires_at ?? 0;
    const expiresSoon = expiresAt > 0 && expiresAt < Math.floor(Date.now() / 1000) + 60;

    if (!session || expiresSoon) {
      const refreshed = await supabaseClient.auth.refreshSession();
      session = refreshed.data.session ?? session;
    }

    token = session?.access_token ?? token;
  } catch {
    // Keep cookie-based auth available if browser session lookup or refresh fails.
  }

  if (token && token !== "undefined" && token !== "null") {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });
};

const FieldInput = ({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: unknown) => void }) => {
  if (field.kind === "checkbox") {
    return <label className="flex items-center gap-3 text-sm text-gray-200"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-cyan-400" />{field.label}</label>;
  }
  if (field.kind === "select") {
    return <label className="grid gap-2 text-sm text-gray-300"><span>{field.label}</span><select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={inputClass} required={field.required}><option value="">Choose a category</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
  }
  if (field.kind === "textarea" || field.kind === "list") {
    const shown = field.kind === "list" && Array.isArray(value) ? value.join("\n") : String(value ?? "");
    return <label className="grid gap-2 text-sm text-gray-300 md:col-span-2"><span>{field.label}{field.kind === "list" ? " (one per line)" : ""}</span><textarea value={shown} onChange={(event) => onChange(field.kind === "list" ? event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) : event.target.value)} className={`${inputClass} min-h-28 resize-y`} required={field.required} /></label>;
  }
  return <label className="grid gap-2 text-sm text-gray-300"><span>{field.label}</span><input type={field.kind === "number" ? "number" : field.kind === "email" ? "email" : field.kind === "url" ? "url" : "text"} value={String(value ?? "")} onChange={(event) => onChange(field.kind === "number" ? Number(event.target.value) : event.target.value)} className={inputClass} required={field.required} placeholder={field.placeholder} /></label>;
};

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
  const [records, setRecords] = useState<Record<string, Row[]>>(() => Object.fromEntries([...sections.map((section) => section.table), "contact_messages", "uploads"].map((table) => [table, rowsFor(content, table as CmsTableName)])));
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Row>({});
  const [status, setStatus] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const active = sections.find((section) => section.table === view);

  const stats = useMemo(() => ({
    skills: records.skills?.length ?? 0, projects: records.projects?.length ?? 0,
    experience: records.experience?.length ?? 0, certifications: records.certifications?.length ?? 0,
    resumes: records.resumes?.length ?? 0,
    unread: (records.contact_messages ?? []).filter((row) => row.status === "new").length,
  }), [records]);

  const beginEdit = (section: Section, index: number) => { setEditing(index); setDraft({ ...(records[section.table]?.[index] ?? emptyRow(section)) }); setStatus(""); };
  const beginAdd = (section: Section) => { setEditing(-1); setDraft(emptyRow(section)); setStatus(""); };
  const cancelEdit = () => { setEditing(null); setDraft({}); setStatus(""); };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!active) return;

    setStatus("Saving...");

    const response = await adminFetch(
      "/api/admin/content",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: active.table,
          values: draft,
        }),
      },
      accessToken,
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("CMS save failed", {
          status: response.status,
          data,
        });
      }
      setStatus(adminApiError(data));
      return;
    }

    setRecords((current) => {
      const next = [...(current[active.table] ?? [])];

      if (editing === -1) {
        next.push(data.row);
      } else if (editing !== null) {
        next[editing] = data.row;
      }

      return {
        ...current,
        [active.table]: next,
      };
    });

    setStatus("Saved.");
    setEditing(null);
    setDraft({});
  };

  const remove = async (section: Section, index: number) => {
    const row = records[section.table]?.[index];
    if (!row) return;
    if (!row.id) { setRecords((current) => ({ ...current, [section.table]: current[section.table].filter((_, itemIndex) => itemIndex !== index) })); return; }
    if (!window.confirm(`Delete this ${section.label.toLowerCase()} entry?`)) return;
    const response = await adminFetch("/api/admin/content", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: section.table, id: row.id }) }, accessToken);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) { setStatus(adminApiError(data)); return; }
    setRecords((current) => ({ ...current, [section.table]: current[section.table].filter((_, itemIndex) => itemIndex !== index) }));
    setStatus("Deleted.");
  };

  const updateMessage = async (id: unknown, statusValue: "read" | "archived") => {
    const response = await adminFetch("/api/admin/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: statusValue }) }, accessToken);
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) setRecords((current) => ({ ...current, contact_messages: current.contact_messages.map((row) => row.id === id ? data.message : row) }));
    setStatus(response.ok && data.ok ? "Message updated." : adminApiError(data));
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setUploadStatus("Uploading...");
    const response = await adminFetch("/api/admin/upload", { method: "POST", body: new FormData(event.currentTarget) }, accessToken);
    const data = await response.json().catch(() => ({}));
    setUploadStatus(response.ok && data.ok ? `Uploaded: ${data.publicUrl ?? data.upload?.path}` : adminApiError(data));
  };

  const navButton = (target: View, label: string) => <button type="button" onClick={() => { setView(target); cancelEdit(); }} className={`rounded-lg px-4 py-3 text-left text-sm transition ${view === target ? "bg-cyan-300/15 text-cyan-100" : "text-gray-300 hover:bg-white/10"}`}>{label}</button>;

  return (
    <section className="relative z-[20] mx-auto w-full max-w-7xl px-6 py-28 text-gray-200">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="Welcome-text text-sm uppercase">CMS Admin</p><h1 className="mt-3 text-4xl font-bold text-white">Portfolio Dashboard</h1><p className="mt-3 text-sm text-gray-400">Signed in as {email ?? "admin"}. Edit content through simple forms.</p></div><div className="flex gap-3 text-sm"><Link href="/admin/security" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Security</Link><Link href="/api/auth/logout" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Logout</Link></div></header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav className="flex h-fit flex-col gap-1 rounded-lg border border-white/10 bg-[#100b24]/80 p-3">{navButton("overview", "Overview")}{sections.map((section) => <span key={section.table}>{navButton(section.table, section.label)}</span>)}{navButton("contact_messages", "Contact Messages")}{navButton("uploads", "Uploads")}</nav>

        <div className="min-w-0 rounded-lg border border-white/10 bg-[#100b24]/90 p-5 shadow-xl shadow-[#2A0E61]/20">
          {view === "overview" && <div><h2 className="text-2xl font-bold text-white">Overview</h2><p className="mt-2 text-sm text-gray-400">Current CMS content at a glance.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[["Profile", records.profile?.length ? "Ready" : "Needs content"], ["Hero", records.hero?.length ? "Ready" : "Needs content"], ["Skills", stats.skills], ["Projects", stats.projects], ["Experience", stats.experience], ["Certifications", stats.certifications], ["CV files", stats.resumes], ["Unread messages", stats.unread]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4"><p className="text-sm text-gray-400">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>)}</div></div>}

          {active && <div><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-bold text-white">{active.label}</h2><p className="mt-2 text-sm text-gray-400">{active.description}</p></div>{editing === null && (!active.singleton || !(records[active.table]?.length)) && <button type="button" onClick={() => beginAdd(active)} className="button-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"><FiPlus />Add</button>}</div>
            {editing !== null ? <form onSubmit={save} className="mt-6"><div className="grid gap-4 md:grid-cols-2">{active.fields.map((field) => <FieldInput key={field.key} field={field} value={draft[field.key]} onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} />)}</div><div className="mt-6 flex flex-wrap items-center gap-3"><button type="submit" className="button-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white"><FiSave />Save</button><button type="button" onClick={cancelEdit} className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10">Cancel</button><p className="text-sm text-cyan-100" aria-live="polite">{status}</p></div></form>
            : <div className="mt-6 grid gap-3">{(records[active.table] ?? []).map((row, index) => <article key={String(row.id ?? `${active.table}-${index}`)} className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="truncate font-semibold text-white">{String(row.full_name ?? row.title ?? row.name ?? row.company ?? row.institution ?? row.label ?? `Entry ${index + 1}`)}</h3><p className="mt-1 line-clamp-2 text-sm text-gray-400">{String(row.headline ?? row.summary ?? row.role ?? row.issuer ?? row.degree ?? row.url ?? row.body ?? "")}</p></div><div className="flex shrink-0 gap-2"><button type="button" title="Edit" onClick={() => beginEdit(active, index)} className="rounded-lg border border-white/10 bg-white/5 p-2.5 hover:bg-white/10"><FiEdit2 /></button><button type="button" title="Delete" onClick={() => void remove(active, index)} className="rounded-lg border border-red-300/20 bg-red-500/10 p-2.5 text-red-100 hover:bg-red-500/20"><FiTrash2 /></button></div></article>)}{!(records[active.table]?.length) && <p className="py-8 text-center text-sm text-gray-400">No entries yet.</p>}<p className="text-sm text-cyan-100" aria-live="polite">{status}</p></div>}
          </div>}

          {view === "contact_messages" && <div><h2 className="text-2xl font-bold text-white">Contact Messages</h2><div className="mt-6 grid gap-4">{(records.contact_messages ?? []).map((message) => <article key={String(message.id)} className="rounded-lg border border-white/10 bg-white/5 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{String(message.name)}</h3><a href={`mailto:${String(message.email)}`} className="text-sm text-cyan-200">{String(message.email)}</a></div><span className="text-xs uppercase text-gray-400">{String(message.status ?? "new")}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-300">{String(message.message)}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => void updateMessage(message.id, "read")} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Mark read</button><button type="button" onClick={() => void updateMessage(message.id, "archived")} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Archive</button></div></article>)}{!(records.contact_messages?.length) && <p className="text-sm text-gray-400">No messages yet.</p>}</div><p className="mt-4 text-sm text-cyan-100">{status}</p></div>}

          {view === "uploads" && <div><h2 className="text-2xl font-bold text-white">Uploads</h2><p className="mt-2 text-sm text-gray-400">Images, certification artwork, CV PDF and DOCX files.</p><form onSubmit={upload} className="mt-6 grid gap-4 sm:grid-cols-[12rem_1fr_auto]"><select name="bucket" className={inputClass}><option value="public-assets">Public assets</option><option value="project-images">Project images</option><option value="resumes">Resumes</option><option value="uploads">Uploads</option></select><input name="file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx" required className={inputClass} /><button type="submit" className="button-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold text-white"><FiUploadCloud />Upload</button></form><p className="mt-4 break-all text-sm text-cyan-100" aria-live="polite">{uploadStatus}</p></div>}
        </div>
      </div>
    </section>
  );
};
