import { fallbackPortfolioContent } from "@/data/fallback-portfolio";
import type {
  AdminContentSnapshot,
  CmsTableName,
  ExperienceContent,
  PortfolioContent,
  ProjectContent,
  ProjectSectionContent,
  ResumeContent,
  SkillCategory,
} from "@/lib/cms-types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export const cmsTables: CmsTableName[] = [
  "profile",
  "hero",
  "about",
  "skills",
  "projects",
  "project_sections",
  "experience",
  "education",
  "certifications",
  "resumes",
  "social_links",
  "site_settings",
  "contact_messages",
  "uploads",
];

const publicTables: CmsTableName[] = [
  "profile",
  "hero",
  "about",
  "skills",
  "projects",
  "project_sections",
  "experience",
  "education",
  "certifications",
  "resumes",
  "social_links",
];

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type CmsRow = Record<string, unknown> & { sort_order?: number; sortOrder?: number };

const readRows = (data: unknown): CmsRow[] => Array.isArray(data) ? (data as CmsRow[]) : [];

const sortByOrder = <T extends { sort_order?: number; sortOrder?: number }>(rows: T[]) =>
  [...rows].sort((a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const localAssetAliases: Record<string, string> = {
  "/projects/project-placeholder-1.png": "/projects/project-1.png",
  "/projects/project-placeholder-2.png": "/projects/project-2.png",
  "/projects/project-placeholder-3.png": "/projects/project-3.png",
  "/projects/project-placeholder-4.png": "/projects/project-1.png",
  "/projects/project-placeholder-5.png": "/projects/project-2.png",
  "/companies/arabsoft.png": "/companies/arab-soft.png",
  "/companies/confidential-client.png": "/companies/chicchac.png",
};

const normalizeCmsAssetPath = (value: unknown, fallback: string) => {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  let path = value.trim();

  if (path.startsWith("public/")) {
    path = `/${path.slice("public/".length)}`;
  }

  if (!path.startsWith("/") && !path.startsWith("http://") && !path.startsWith("https://")) {
    path = `/${path}`;
  }

  return localAssetAliases[path] ?? path;
};

const emptyPublishedContent = (): PortfolioContent => ({
  profile: { name: "", initials: "", avatarPath: "", location: "", email: "", linkedIn: "", linkedInLabel: "", github: "", githubLabel: "", availability: "", mainTitle: "", secondaryLine: "", tagline: "", shortProfile: "", about: "", aboutFocus: [] },
  hero: { eyebrow: "", title: "", subtitle: "", tagline: "", dynamicTitles: [], primaryCtaLabel: "", primaryCtaHref: "/contact", secondaryCtaLabel: "", secondaryCtaHref: "/projects" },
  about: { title: "", body: "", highlights: [], avatarUrl: "" },
  skillCategories: [], projects: [], projectSections: [], experience: [], education: [], certifications: [], resumes: [], socialLinks: [],
  navLinks: fallbackPortfolioContent.navLinks,
});

const failClosedOnError = (error: unknown) => {
  const detail = error instanceof Error ? error.message.slice(0, 160) : "unknown public CMS error";
  console.warn(`Public CMS discovery failed; returning no uncertain published rows. ${detail}`);
  return emptyPublishedContent();
};

export const getPortfolioContent = async (): Promise<PortfolioContent> => {
  if (!isSupabaseConfigured()) {
    return fallbackPortfolioContent;
  }

  try {
    const supabase = createSupabasePublicClient();

    const [profileResult, heroResult, aboutResult, skillsResult, projectsResult, sectionsResult, experienceResult, educationResult, certificationsResult, resumesResult, socialLinksResult] =
      await Promise.all([
        supabase.from("profile").select("*").eq("published", true).order("updated_at", { ascending: false }).limit(1),
        supabase.from("hero").select("*").eq("published", true).order("updated_at", { ascending: false }).limit(1),
        supabase.from("about").select("*").eq("published", true).order("updated_at", { ascending: false }).limit(1),
        supabase.from("skills").select("*").eq("published", true).order("sort_order", { ascending: true }),
        supabase.from("projects").select("*").eq("published", true).order("sort_order", { ascending: true }),
        supabase.from("project_sections").select("*" ).order("sort_order", { ascending: true }),
        supabase.from("experience").select("*").eq("published", true).order("sort_order", { ascending: true }),
        supabase.from("education").select("*").eq("published", true).order("sort_order", { ascending: true }),
        supabase.from("certifications").select("*").eq("published", true).order("sort_order", { ascending: true }),
        supabase.from("resumes").select("*").eq("published", true).order("sort_order", { ascending: true }),
        supabase.from("social_links").select("*").eq("published", true).order("sort_order", { ascending: true }),
      ]);

    const results = [profileResult, heroResult, aboutResult, skillsResult, projectsResult, sectionsResult, experienceResult, educationResult, certificationsResult, resumesResult, socialLinksResult];
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      throw failed.error;
    }

    const profileRows = readRows(profileResult.data);
    const heroRows = readRows(heroResult.data);
    const aboutRows = readRows(aboutResult.data);
    const skillsRows = readRows(skillsResult.data);
    const projectsRows = readRows(projectsResult.data);
    const sectionRows = readRows(sectionsResult.data);
    const experienceRows = readRows(experienceResult.data);
    const educationRows = readRows(educationResult.data);
    const certificationRows = readRows(certificationsResult.data);
    const resumeRows = readRows(resumesResult.data);
    const socialLinkRows = readRows(socialLinksResult.data);

    const profileRow = profileRows[0];
    const heroRow = heroRows[0];
    const aboutRow = aboutRows[0];

    const profile = profileRow
      ? {
          ...fallbackPortfolioContent.profile,
          name: fallbackPortfolioContent.profile.name,
          initials: String(profileRow.initials ?? fallbackPortfolioContent.profile.initials),
          avatarPath: String(profileRow.avatar_url ?? fallbackPortfolioContent.profile.avatarPath),
          location: String(profileRow.location ?? fallbackPortfolioContent.profile.location),
          email: String(profileRow.email ?? fallbackPortfolioContent.profile.email),
          linkedIn: String(profileRow.linkedin_url ?? fallbackPortfolioContent.profile.linkedIn),
          linkedInLabel: String(profileRow.linkedin_label ?? fallbackPortfolioContent.profile.linkedInLabel),
          github: String(profileRow.github_url ?? fallbackPortfolioContent.profile.github),
          githubLabel: String(profileRow.github_label ?? fallbackPortfolioContent.profile.githubLabel),
          availability: String(profileRow.availability ?? fallbackPortfolioContent.profile.availability),
          mainTitle: String(profileRow.headline ?? fallbackPortfolioContent.profile.mainTitle),
          secondaryLine: String(profileRow.secondary_line ?? fallbackPortfolioContent.profile.secondaryLine),
          tagline: String(profileRow.tagline ?? fallbackPortfolioContent.profile.tagline),
          shortProfile: String(profileRow.short_bio ?? fallbackPortfolioContent.profile.shortProfile),
          about: String(profileRow.about_text ?? fallbackPortfolioContent.profile.about),
          aboutFocus: asStringArray(profileRow.about_focus).length ? asStringArray(profileRow.about_focus) : fallbackPortfolioContent.profile.aboutFocus,
        }
      : emptyPublishedContent().profile;

    const hero = heroRow
      ? {
          eyebrow: String(heroRow.eyebrow ?? profile.mainTitle),
          title: profile.name,
          subtitle: String(heroRow.subtitle ?? profile.secondaryLine),
          tagline: String(heroRow.tagline ?? profile.tagline),
          dynamicTitles: asStringArray(heroRow.dynamic_titles).length ? asStringArray(heroRow.dynamic_titles) : fallbackPortfolioContent.hero.dynamicTitles,
          primaryCtaLabel: String(heroRow.primary_cta_label ?? fallbackPortfolioContent.hero.primaryCtaLabel),
          primaryCtaHref: String(heroRow.primary_cta_href ?? fallbackPortfolioContent.hero.primaryCtaHref),
          secondaryCtaLabel: String(heroRow.secondary_cta_label ?? fallbackPortfolioContent.hero.secondaryCtaLabel),
          secondaryCtaHref: String(heroRow.secondary_cta_href ?? fallbackPortfolioContent.hero.secondaryCtaHref),
        }
      : emptyPublishedContent().hero;

    const about = aboutRow
      ? {
          title: String(aboutRow.title ?? fallbackPortfolioContent.about.title),
          body: String(aboutRow.body ?? profile.about),
          highlights: asStringArray(aboutRow.highlights).length ? asStringArray(aboutRow.highlights) : profile.aboutFocus,
          avatarUrl: String(aboutRow.avatar_url ?? profile.avatarPath),
        }
      : emptyPublishedContent().about;

    const groupedSkills = new Map<string, string[]>();
    sortByOrder(skillsRows).forEach((row) => {
      const category = String(row.category ?? "Skills");
      const current = groupedSkills.get(category) ?? [];
      current.push(String(row.name));
      groupedSkills.set(category, current);
    });

    const skillCategories: SkillCategory[] = groupedSkills.size
      ? Array.from(groupedSkills.entries()).map(([title, skills]) => ({ title, skills }))
      : [];

    const sectionsByProjectId = new Map<string, ProjectSectionContent[]>();
    sortByOrder(sectionRows).forEach((row) => {
      const projectId = String(row.project_id ?? "");
      if (!projectId) return;
      const section = {
        id: String(row.id ?? ""),
        projectSlug: "",
        title: String(row.title ?? "Section"),
        body: String(row.body ?? ""),
        bullets: asStringArray(row.bullets),
        sortOrder: Number(row.sort_order ?? 0),
      };
      sectionsByProjectId.set(projectId, [...(sectionsByProjectId.get(projectId) ?? []), section]);
    });

    const projects: ProjectContent[] = sortByOrder(projectsRows).map((row, index) => {
      const slug = String(row.slug ?? slugify(String(row.title ?? `project-${index + 1}`)));
      const sections = (sectionsByProjectId.get(String(row.id ?? "")) ?? []).map((section) => ({ ...section, projectSlug: slug }));

      return {
        slug,
        title: String(row.title ?? "Untitled project"),
        description: String(row.summary ?? row.description ?? ""),
        image: normalizeCmsAssetPath(
          row.cover_image_url ?? row.placeholder_image_url,
          fallbackPortfolioContent.projects[index]?.image ?? "/projects/project-1.png",
        ),
        tags: asStringArray(row.tags),
        tools: asStringArray(row.tools),
        type: String(row.type ?? ""),
        githubUrl: String(row.github_url ?? ""),
        linkedinUrl: String(row.linkedin_url ?? ""),
        featured: Boolean(row.featured),
        sortOrder: Number(row.sort_order ?? index),
        sections,
      };
    });

    const experience: ExperienceContent[] = sortByOrder(experienceRows).map((row, index) => ({
      company: String(row.company ?? ""),
      role: String(row.role ?? ""),
      location: String(row.location ?? ""),
      date: [row.start_date, row.end_date].filter(Boolean).join(" - ") || String(row.date_label ?? ""),
      iconBg: String(row.icon_bg ?? fallbackPortfolioContent.experience[index]?.iconBg ?? "#2a0e61"),
      logo: normalizeCmsAssetPath(
        row.logo_url,
        fallbackPortfolioContent.experience[index]?.logo ?? "",
      ) || undefined,
      logoAlt: String(row.logo_alt ?? `${row.company ?? "Company"} logo`),
      points: asStringArray(row.points),
      tools: asStringArray(row.tools),
      sortOrder: Number(row.sort_order ?? index),
    }));

    const resumes: ResumeContent[] = sortByOrder(resumeRows).map((row, index) => ({
      title: String(row.label ?? row.variant ?? "Resume"),
      variant: String(row.variant ?? slugify(String(row.label ?? `resume-${index + 1}`))),
      pdfPath: String(row.pdf_url ?? ""),
      docxPath: String(row.docx_url ?? ""),
      available: Boolean(row.pdf_url || row.docx_url),
      sortOrder: Number(row.sort_order ?? index),
    }));

    const content: PortfolioContent = {
      profile,
      hero,
      about,
      skillCategories,
      projects,
      projectSections: projects.flatMap((project) => project.sections ?? []),
      experience,
      education: sortByOrder(educationRows).map((row, index) => ({
        institution: String(row.institution ?? ""),
        degree: String(row.degree ?? ""),
        startDate: String(row.start_date ?? ""),
        endDate: String(row.end_date ?? ""),
        status: String(row.status ?? ""),
        location: String(row.location ?? ""),
        sortOrder: Number(row.sort_order ?? index),
      })),
      certifications: sortByOrder(certificationRows).map((row, index) => ({
        name: String(row.name ?? ""),
        issuer: String(row.issuer ?? ""),
        date: String(row.date ?? ""),
        credentialUrl: typeof row.credential_url === "string" ? row.credential_url : undefined,
        credentialId: typeof row.credential_id === "string" ? row.credential_id : undefined,
        imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
        description: typeof row.description === "string" ? row.description : undefined,
        tags: asStringArray(row.tags),
        sortOrder: Number(row.sort_order ?? index),
      })),
      resumes,
      socialLinks: sortByOrder(socialLinkRows).map((row, index) => ({
        label: String(row.label ?? ""),
        url: String(row.url ?? ""),
        iconKey: typeof row.icon_key === "string" ? row.icon_key : undefined,
        sortOrder: Number(row.sort_order ?? index),
      })),
      navLinks: fallbackPortfolioContent.navLinks,
    };

    return content;
  } catch (error) {
    return failClosedOnError(error);
  }
};

export const getProjectBySlug = async (slug: string) => {
  const content = await getPortfolioContent();
  return content.projects.find((project) => project.slug === slug) ?? null;
};

const fallbackAdminContentSnapshot = (): AdminContentSnapshot => ({
  profile: [{
    full_name: fallbackPortfolioContent.profile.name,
    initials: fallbackPortfolioContent.profile.initials,
    headline: fallbackPortfolioContent.profile.mainTitle,
    secondary_line: fallbackPortfolioContent.profile.secondaryLine,
    tagline: fallbackPortfolioContent.profile.tagline,
    location: fallbackPortfolioContent.profile.location,
    email: fallbackPortfolioContent.profile.email,
    linkedin_url: fallbackPortfolioContent.profile.linkedIn,
    linkedin_label: fallbackPortfolioContent.profile.linkedInLabel,
    github_url: fallbackPortfolioContent.profile.github,
    github_label: fallbackPortfolioContent.profile.githubLabel,
    avatar_url: fallbackPortfolioContent.profile.avatarPath,
    availability: fallbackPortfolioContent.profile.availability,
    short_bio: fallbackPortfolioContent.profile.shortProfile,
    about_text: fallbackPortfolioContent.profile.about,
    about_focus: fallbackPortfolioContent.profile.aboutFocus,
    published: true,
  }],
  hero: [{
    eyebrow: fallbackPortfolioContent.hero.eyebrow,
    title: fallbackPortfolioContent.hero.title,
    subtitle: fallbackPortfolioContent.hero.subtitle,
    tagline: fallbackPortfolioContent.hero.tagline,
    dynamic_titles: fallbackPortfolioContent.hero.dynamicTitles,
    primary_cta_label: fallbackPortfolioContent.hero.primaryCtaLabel,
    primary_cta_href: fallbackPortfolioContent.hero.primaryCtaHref,
    secondary_cta_label: fallbackPortfolioContent.hero.secondaryCtaLabel,
    secondary_cta_href: fallbackPortfolioContent.hero.secondaryCtaHref,
    published: true,
  }],
  about: [{
    title: fallbackPortfolioContent.about.title,
    body: fallbackPortfolioContent.about.body,
    highlights: fallbackPortfolioContent.about.highlights,
    avatar_url: fallbackPortfolioContent.about.avatarUrl,
    published: true,
  }],
  skills: fallbackPortfolioContent.skillCategories.flatMap((category, categoryIndex) =>
    category.skills.map((name, skillIndex) => ({ name, category: category.title, icon_key: name, description: "", sort_order: categoryIndex * 100 + skillIndex, published: true })),
  ),
  projects: fallbackPortfolioContent.projects.map((project, index) => ({
    slug: project.slug, title: project.title, type: project.type ?? "", summary: project.description,
    description: project.description, cover_image_url: project.image, tags: project.tags, tools: project.tools ?? project.tags,
    featured: project.featured ?? false, published: true, sort_order: project.sortOrder ?? index,
  })),
  project_sections: [],
  experience: fallbackPortfolioContent.experience.map((entry, index) => ({
    company: entry.company, role: entry.role, location: entry.location, date_label: entry.date,
    logo_url: entry.logo ?? "", logo_alt: entry.logoAlt ?? `${entry.company} logo`, points: entry.points,
    tools: entry.tools ?? [], sort_order: entry.sortOrder ?? index, published: true,
  })),
  education: fallbackPortfolioContent.education.map((entry) => ({
    institution: entry.institution, degree: entry.degree, start_date: entry.startDate, end_date: entry.endDate,
    status: entry.status, location: entry.location, sort_order: entry.sortOrder, published: true,
  })),
  certifications: fallbackPortfolioContent.certifications.map((entry) => ({
    name: entry.name, issuer: entry.issuer, date: entry.date, credential_url: entry.credentialUrl ?? "",
    credential_id: entry.credentialId ?? "", image_url: entry.imageUrl ?? "", description: entry.description ?? "",
    tags: entry.tags, sort_order: entry.sortOrder, published: true,
  })),
  resumes: fallbackPortfolioContent.resumes.map((entry) => ({
    label: entry.title, variant: entry.variant, pdf_url: entry.pdfPath, docx_url: entry.docxPath,
    sort_order: entry.sortOrder, published: true,
  })),
  social_links: fallbackPortfolioContent.socialLinks.map((entry) => ({
    label: entry.label, url: entry.url, icon_key: entry.iconKey ?? "", sort_order: entry.sortOrder, published: true,
  })),
  site_settings: [],
  contact_messages: [],
  uploads: [],
});
export const getAdminContentSnapshot = async (): Promise<AdminContentSnapshot> => {
  const fallback = fallbackAdminContentSnapshot();
  if (!isSupabaseAdminConfigured()) {
    return fallback;
  }

  const supabase = createSupabaseAdminClient();
  const entries = await Promise.all(
    publicTables.map(async (table) => {
      const query = supabase.from(table).select("*");
      const result = table === "contact_messages"
        ? await query.order("created_at", { ascending: false }).limit(100)
        : await query.limit(500);

      return [table, result.data ?? []] as const;
    }),
  );

  return Object.fromEntries(entries.map(([table, rows]) => [
    table,
    rows.length || table === "project_sections"
      ? rows
      : fallback[table] ?? [],
  ])) as AdminContentSnapshot;
};

export const isCmsTableName = (value: string): value is CmsTableName =>
  cmsTables.includes(value as CmsTableName);

export const isPublicCmsTableName = (value: string): value is CmsTableName =>
  publicTables.includes(value as CmsTableName);

export const sanitizeAdminRow = (value: unknown) => (isObject(value) ? value : {});
