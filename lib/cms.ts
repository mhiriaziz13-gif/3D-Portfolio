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

const sortByOrder = <T extends { sort_order?: number; sortOrder?: number }>(rows: T[]) =>
  [...rows].sort((a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const fallbackOnError = (error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("CMS fallback used:", error);
  }
  return fallbackPortfolioContent;
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

    const profileRow = profileResult.data?.[0];
    const heroRow = heroResult.data?.[0];
    const aboutRow = aboutResult.data?.[0];

    const profile = profileRow
      ? {
          ...fallbackPortfolioContent.profile,
          name: String(profileRow.full_name ?? fallbackPortfolioContent.profile.name),
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
      : fallbackPortfolioContent.profile;

    const hero = heroRow
      ? {
          eyebrow: String(heroRow.eyebrow ?? profile.mainTitle),
          title: String(heroRow.title ?? profile.name),
          subtitle: String(heroRow.subtitle ?? profile.secondaryLine),
          tagline: String(heroRow.tagline ?? profile.tagline),
          dynamicTitles: asStringArray(heroRow.dynamic_titles).length ? asStringArray(heroRow.dynamic_titles) : fallbackPortfolioContent.hero.dynamicTitles,
          primaryCtaLabel: String(heroRow.primary_cta_label ?? fallbackPortfolioContent.hero.primaryCtaLabel),
          primaryCtaHref: String(heroRow.primary_cta_href ?? fallbackPortfolioContent.hero.primaryCtaHref),
          secondaryCtaLabel: String(heroRow.secondary_cta_label ?? fallbackPortfolioContent.hero.secondaryCtaLabel),
          secondaryCtaHref: String(heroRow.secondary_cta_href ?? fallbackPortfolioContent.hero.secondaryCtaHref),
        }
      : { ...fallbackPortfolioContent.hero, eyebrow: profile.mainTitle, title: profile.name, subtitle: profile.secondaryLine, tagline: profile.tagline };

    const about = aboutRow
      ? {
          title: String(aboutRow.title ?? fallbackPortfolioContent.about.title),
          body: String(aboutRow.body ?? profile.about),
          highlights: asStringArray(aboutRow.highlights).length ? asStringArray(aboutRow.highlights) : profile.aboutFocus,
          avatarUrl: String(aboutRow.avatar_url ?? profile.avatarPath),
        }
      : { ...fallbackPortfolioContent.about, body: profile.about, highlights: profile.aboutFocus, avatarUrl: profile.avatarPath };

    const groupedSkills = new Map<string, string[]>();
    sortByOrder(skillsResult.data ?? []).forEach((row) => {
      const category = String(row.category ?? "Skills");
      const current = groupedSkills.get(category) ?? [];
      current.push(String(row.name));
      groupedSkills.set(category, current);
    });

    const skillCategories: SkillCategory[] = groupedSkills.size
      ? Array.from(groupedSkills.entries()).map(([title, skills]) => ({ title, skills }))
      : fallbackPortfolioContent.skillCategories;

    const sectionsByProjectId = new Map<string, ProjectSectionContent[]>();
    sortByOrder(sectionsResult.data ?? []).forEach((row) => {
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

    const projects: ProjectContent[] = sortByOrder(projectsResult.data ?? []).map((row, index) => {
      const slug = String(row.slug ?? slugify(String(row.title ?? `project-${index + 1}`)));
      const sections = (sectionsByProjectId.get(String(row.id ?? "")) ?? []).map((section) => ({ ...section, projectSlug: slug }));

      return {
        slug,
        title: String(row.title ?? "Untitled project"),
        description: String(row.summary ?? row.description ?? ""),
        image: String(row.cover_image_url ?? row.placeholder_image_url ?? fallbackPortfolioContent.projects[index]?.image ?? "/projects/project-1.png"),
        tags: asStringArray(row.tags),
        tools: asStringArray(row.tools),
        type: String(row.type ?? ""),
        featured: Boolean(row.featured),
        sortOrder: Number(row.sort_order ?? index),
        sections,
      };
    });

    const experience: ExperienceContent[] = sortByOrder(experienceResult.data ?? []).map((row, index) => ({
      company: String(row.company ?? ""),
      role: String(row.role ?? ""),
      location: String(row.location ?? ""),
      date: [row.start_date, row.end_date].filter(Boolean).join(" - ") || String(row.date_label ?? ""),
      iconBg: String(row.icon_bg ?? fallbackPortfolioContent.experience[index]?.iconBg ?? "#2a0e61"),
      logo: typeof row.logo_url === "string" && row.logo_url ? row.logo_url : undefined,
      logoAlt: String(row.logo_alt ?? `${row.company ?? "Company"} logo`),
      points: asStringArray(row.points),
      tools: asStringArray(row.tools),
      sortOrder: Number(row.sort_order ?? index),
    }));

    const resumes: ResumeContent[] = sortByOrder(resumesResult.data ?? []).map((row, index) => ({
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
      projects: projects.length ? projects : fallbackPortfolioContent.projects,
      projectSections: projects.flatMap((project) => project.sections ?? []),
      experience: experience.length ? experience : fallbackPortfolioContent.experience,
      education: sortByOrder(educationResult.data ?? []).map((row, index) => ({
        institution: String(row.institution ?? ""),
        degree: String(row.degree ?? ""),
        startDate: String(row.start_date ?? ""),
        endDate: String(row.end_date ?? ""),
        status: String(row.status ?? ""),
        location: String(row.location ?? ""),
        sortOrder: Number(row.sort_order ?? index),
      })),
      certifications: sortByOrder(certificationsResult.data ?? []).map((row, index) => ({
        name: String(row.name ?? ""),
        issuer: String(row.issuer ?? ""),
        date: String(row.date ?? ""),
        credentialUrl: typeof row.credential_url === "string" ? row.credential_url : undefined,
        sortOrder: Number(row.sort_order ?? index),
      })),
      resumes: resumes.length ? resumes : fallbackPortfolioContent.resumes,
      socialLinks: sortByOrder(socialLinksResult.data ?? []).map((row, index) => ({
        label: String(row.label ?? ""),
        url: String(row.url ?? ""),
        iconKey: typeof row.icon_key === "string" ? row.icon_key : undefined,
        sortOrder: Number(row.sort_order ?? index),
      })),
      navLinks: fallbackPortfolioContent.navLinks,
    };

    return content;
  } catch (error) {
    return fallbackOnError(error);
  }
};

export const getProjectBySlug = async (slug: string) => {
  const content = await getPortfolioContent();
  return content.projects.find((project) => project.slug === slug) ?? null;
};

export const getAdminContentSnapshot = async (): Promise<AdminContentSnapshot> => {
  if (!isSupabaseAdminConfigured()) {
    return {};
  }

  const supabase = createSupabaseAdminClient();
  const entries = await Promise.all(
    cmsTables.map(async (table) => {
      const query = supabase.from(table).select("*");
      const result = table === "contact_messages"
        ? await query.order("created_at", { ascending: false }).limit(100)
        : await query.limit(500);

      return [table, result.data ?? []] as const;
    }),
  );

  return Object.fromEntries(entries) as AdminContentSnapshot;
};

export const isCmsTableName = (value: string): value is CmsTableName =>
  cmsTables.includes(value as CmsTableName);

export const isPublicCmsTableName = (value: string): value is CmsTableName =>
  publicTables.includes(value as CmsTableName);

export const sanitizeAdminRow = (value: unknown) => (isObject(value) ? value : {});