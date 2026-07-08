import {
  dynamicTitles,
  experiences,
  navLinks,
  profile,
  projects,
  resumes,
  skillCategories,
} from "@/constants/portfolio";
import type { PortfolioContent, ProjectContent, ResumeContent } from "@/lib/cms-types";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const fallbackProjects: ProjectContent[] = projects.map((project, index) => ({
  ...project,
  slug: slugify(project.title),
  featured: index < 3,
  sortOrder: index,
  sections: [
    {
      projectSlug: slugify(project.title),
      title: "Overview",
      body: project.description,
      bullets: project.tags,
      sortOrder: 0,
    },
  ],
}));

const fallbackResumes: ResumeContent[] = resumes.map((resume, index) => ({
  ...resume,
  variant: resume.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  sortOrder: index,
}));

export const fallbackPortfolioContent: PortfolioContent = {
  profile: { ...profile, aboutFocus: [...profile.aboutFocus] },
  hero: {
    eyebrow: profile.mainTitle,
    title: profile.name,
    subtitle: profile.secondaryLine,
    tagline: profile.tagline,
    dynamicTitles: [...dynamicTitles],
    primaryCtaLabel: "Contact Me",
    primaryCtaHref: "/#contact",
    secondaryCtaLabel: "View Projects",
    secondaryCtaHref: "/#projects",
  },
  about: {
    title: "Data, commercial context and automation in one working view.",
    body: profile.about,
    highlights: [...profile.aboutFocus],
    avatarUrl: profile.avatarPath,
  },
  skillCategories: skillCategories.map((category) => ({
    title: category.title,
    skills: [...category.skills],
  })),
  projects: fallbackProjects,
  projectSections: fallbackProjects.flatMap((project) => project.sections ?? []),
  experience: experiences.map((experience, index) => ({ ...experience, sortOrder: index })),
  education: [
    {
      institution: "Private Higher School of Engineering and Technology",
      degree: "Master's student in Big Data Analytics & E-Commerce",
      startDate: "2025",
      endDate: "2027",
      status: "In progress",
      location: "Tunisia",
      sortOrder: 0,
    },
    {
      institution: "Business Intelligence Background",
      degree: "Business Intelligence and data-oriented studies",
      startDate: "",
      endDate: "",
      status: "Completed background",
      location: "Tunisia",
      sortOrder: 1,
    },
  ],
  certifications: [],
  resumes: fallbackResumes,
  socialLinks: [
    {
      label: "LinkedIn",
      url: profile.linkedIn,
      iconKey: "linkedin",
      sortOrder: 0,
    },
    {
      label: "GitHub",
      url: profile.github,
      iconKey: "github",
      sortOrder: 1,
    },
    {
      label: "Email",
      url: `mailto:${profile.email}`,
      iconKey: "email",
      sortOrder: 2,
    },
  ],
  navLinks: navLinks.map((link) => ({ ...link })),
};