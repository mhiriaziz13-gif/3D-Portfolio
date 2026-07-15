import fs from "node:fs";
import path from "node:path";

const parseEnv = (file) => {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, "utf8").split(/\r?\n/).filter((line) => line && !line.trimStart().startsWith("#") && line.includes("=")).map((line) => { const index=line.indexOf("="); return [line.slice(0,index).trim(), line.slice(index+1).trim().replace(/^['"]|['"]$/g,"")]; }));
};

const localEnv = parseEnv(path.resolve(".env.local"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tables = ["profile", "hero", "about", "skills", "projects", "project_sections", "experience", "education", "certifications", "resumes", "social_links"];
const failures = [];
const differences = [];

if (!url || !key) {
  console.log("Content audit: Supabase is not configured; repository fallback mode is active for local development.");
  process.exit(0);
}

console.log("Content audit: comparing published CMS structure with repository fallback expectations (read-only anon access).");
for (const table of tables) {
  const filter = table === "project_sections" ? "" : "&published=eq.true";
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=500${filter}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) {
    failures.push(`${table}: public published read failed with HTTP ${response.status}`);
    continue;
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) {
    failures.push(`${table}: response was not an array`);
    continue;
  }
  console.log(`${table}: ${rows.length} published/public row(s); CMS is authoritative${rows.length === 0 ? " and the public value is intentionally empty" : ""}.`);
  if (table === "projects") console.log(`projects: ${rows.map((row) => String(row.slug || row.title || "untitled")).join(", ") || "none"}`);
  if (table === "profile" && rows[0]?.full_name !== "Ahmed Aziz Mhiri") differences.push(`profile.full_name is "${String(rows[0]?.full_name || "empty")}"; public mapping normalizes it to "Ahmed Aziz Mhiri" and the CMS row should be corrected manually.`);
  if (table === "education") {
    const serialized = JSON.stringify(rows.map((row) => ({ institution: row.institution, degree: row.degree, start_date: row.start_date, end_date: row.end_date, status: row.status, location: row.location })));
    if (!serialized.includes("Institut des Hautes") || !serialized.includes("Big Data Analytics") || !serialized.includes("Business Intelligence") || !serialized.includes("19.5")) differences.push("education rows do not yet contain the complete owner-confirmed IHEC Carthage, Business Intelligence, and Mention Excellent — 19.5/20 values; manual CMS update is required.");
  }
}

differences.forEach((difference) => console.warn(`DIFF ${difference}`));
console.log(`Content audit summary: ${failures.length} structural failure(s).`);
failures.forEach((failure) => console.error(`FAIL ${failure}`));
process.exitCode = failures.length ? 1 : 0;
