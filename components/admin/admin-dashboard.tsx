"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import type { AdminContentSnapshot, CmsTableName } from "@/lib/cms-types";

const sections: { table: CmsTableName; label: string; help: string }[] = [
  { table: "profile", label: "Profile", help: "Name, contact links, avatar and global positioning." },
  { table: "hero", label: "Hero", help: "Homepage hero copy, dynamic titles and CTAs." },
  { table: "about", label: "About", help: "About title, body and highlights." },
  { table: "skills", label: "Skills", help: "Skill badges grouped by category and ordered by sort_order." },
  { table: "projects", label: "Projects", help: "Project cards and project detail metadata." },
  { table: "project_sections", label: "Project Sections", help: "Detail sections linked to project_id." },
  { table: "experience", label: "Experience", help: "Timeline entries and company logos." },
  { table: "education", label: "Education", help: "Education records." },
  { table: "certifications", label: "Certifications", help: "Certifications and credential links." },
  { table: "resumes", label: "Resumes", help: "PDF/DOCX resume variants." },
  { table: "social_links", label: "Social Links", help: "Public social/contact links." },
  { table: "contact_messages", label: "Messages", help: "Recent contact form submissions." },
  { table: "uploads", label: "Uploads", help: "Uploaded file metadata." },
];

const emptyTemplates: Partial<Record<CmsTableName, Record<string, unknown>>> = {
  skills: { name: "", category: "", sort_order: 0, published: true },
  projects: { slug: "", title: "", summary: "", description: "", tags: [], tools: [], featured: false, published: true, sort_order: 0 },
  project_sections: { project_id: "", title: "", body: "", bullets: [], sort_order: 0 },
  experience: { company: "", role: "", location: "", start_date: "", end_date: "", logo_url: "", points: [], tools: [], sort_order: 0, published: true },
  education: { institution: "", degree: "", start_date: "", end_date: "", status: "", location: "", sort_order: 0, published: true },
  certifications: { name: "", issuer: "", date: "", credential_url: "", sort_order: 0, published: true },
  resumes: { label: "", variant: "", pdf_url: "", docx_url: "", sort_order: 0, published: true },
  social_links: { label: "", url: "", icon_key: "", sort_order: 0, published: true },
};

type AdminDashboardProps = {
  content: AdminContentSnapshot;
  email?: string;
};

const stringify = (value: unknown) => JSON.stringify(value ?? [], null, 2);

export const AdminDashboard = ({ content, email }: AdminDashboardProps) => {
  const [activeTable, setActiveTable] = useState<CmsTableName>("profile");
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(sections.map((section) => [section.table, stringify(content[section.table] ?? [])])),
  );
  const [deleteId, setDeleteId] = useState("");
  const [status, setStatus] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const active = sections.find((section) => section.table === activeTable) ?? sections[0];

  const rows = useMemo(() => {
    try {
      const parsed = JSON.parse(drafts[activeTable] ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [activeTable, drafts]);

  const saveRows = async () => {
    setStatus("Saving...");
    let parsedRows: unknown[];
    try {
      const parsed = JSON.parse(drafts[activeTable] ?? "[]");
      if (!Array.isArray(parsed)) throw new Error("Expected an array.");
      parsedRows = parsed;
    } catch {
      setStatus("JSON must be a valid array.");
      return;
    }

    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: activeTable, rows: parsedRows }),
    });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok && data.ok ? "Saved." : data.error ?? "Save failed.");
    if (data.rows) {
      setDrafts((current) => ({ ...current, [activeTable]: stringify(data.rows) }));
    }
  };

  const addTemplate = () => {
    const template = emptyTemplates[activeTable] ?? { published: true };
    const nextRows = [...rows, template];
    setDrafts((current) => ({ ...current, [activeTable]: stringify(nextRows) }));
  };

  const deleteRow = async () => {
    if (!deleteId.trim()) {
      setStatus("Enter an id or key to delete.");
      return;
    }

    const confirmed = window.confirm(`Delete ${deleteId}? This cannot be undone.`);
    if (!confirmed) return;

    const response = await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: activeTable, id: deleteId.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok && data.ok ? "Deleted. Refresh or reload section to sync." : data.error ?? "Delete failed.");
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadStatus("Uploading...");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    setUploadStatus(response.ok && data.ok ? `Uploaded: ${data.publicUrl ?? data.upload?.path}` : data.error ?? "Upload failed.");
  };

  return (
    <section className="relative z-[20] mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-28 text-gray-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="Welcome-text text-sm uppercase">CMS Admin</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Portfolio Dashboard</h1>
          <p className="mt-3 text-sm text-gray-400">Signed in as {email ?? "admin"}. Public design stays unchanged; this dashboard edits the CMS data behind it.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/security" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Security</Link>
          <Link href="/api/auth/logout" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Logout</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav className="flex flex-col gap-2 rounded-lg border border-white/10 bg-[#100b24]/80 p-3">
          {sections.map((section) => (
            <button key={section.table} type="button" onClick={() => setActiveTable(section.table)} className={`rounded-lg px-4 py-3 text-left text-sm transition ${activeTable === section.table ? "bg-cyan-300/15 text-cyan-100" : "hover:bg-white/10"}`}>
              {section.label}
            </button>
          ))}
        </nav>

        <div className="rounded-lg border border-white/10 bg-[#100b24]/90 p-5 shadow-xl shadow-[#2A0E61]/20">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{active.label}</h2>
              <p className="mt-2 text-sm text-gray-400">{active.help}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={addTemplate} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Add row</button>
              <button type="button" onClick={saveRows} className="button-primary rounded-lg px-4 py-2 font-semibold text-white">Save JSON</button>
            </div>
          </div>

          <textarea value={drafts[activeTable] ?? "[]"} onChange={(event) => setDrafts((current) => ({ ...current, [activeTable]: event.target.value }))} spellCheck={false} className="mt-5 min-h-[28rem] w-full rounded-lg border border-white/10 bg-[#08021c] p-4 font-mono text-xs leading-5 text-gray-100 outline-none focus:border-cyan-300/60" />

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input value={deleteId} onChange={(event) => setDeleteId(event.target.value)} placeholder="id/key to delete" className="rounded-lg border border-white/10 bg-[#151030] px-4 py-2 text-sm text-white outline-none focus:border-cyan-300/60" />
            <button type="button" onClick={deleteRow} className="rounded-lg border border-red-300/30 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/20">Delete row</button>
            <p className="min-h-6 text-sm text-cyan-100" aria-live="polite">{status}</p>
          </div>
        </div>
      </div>

      <form onSubmit={upload} className="rounded-lg border border-white/10 bg-[#100b24]/90 p-5 shadow-xl shadow-[#2A0E61]/20">
        <h2 className="text-2xl font-bold text-white">Uploads</h2>
        <p className="mt-2 text-sm text-gray-400">Allowed: JPG, PNG, WebP, GIF, PDF and DOCX. SVG is rejected.</p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <select name="bucket" className="rounded-lg border border-white/10 bg-[#151030] px-4 py-3 text-sm text-white">
            <option value="public-assets">public-assets</option>
            <option value="project-images">project-images</option>
            <option value="resumes">resumes</option>
            <option value="uploads">uploads</option>
          </select>
          <input name="file" type="file" required className="rounded-lg border border-white/10 bg-[#151030] px-4 py-3 text-sm text-white" />
          <button type="submit" className="button-primary rounded-lg px-5 py-3 font-semibold text-white">Upload</button>
        </div>
        <p className="mt-3 min-h-6 text-sm text-cyan-100" aria-live="polite">{uploadStatus}</p>
      </form>
    </section>
  );
};