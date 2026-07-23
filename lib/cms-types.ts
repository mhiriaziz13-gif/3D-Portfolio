import type {
  Experience as StaticExperience,
  Project as StaticProject,
  ResumeAsset as StaticResumeAsset,
  SkillCategory,
} from "@/constants/portfolio";

export type { SkillCategory };

export type NavLink = {
  title: string;
  href: string;
};

export type ProfileContent = {
  name: string;
  initials: string;
  avatarPath: string;
  location: string;
  email: string;
  linkedIn: string;
  linkedInLabel: string;
  github: string;
  githubLabel: string;
  availability: string;
  mainTitle: string;
  secondaryLine: string;
  tagline: string;
  shortProfile: string;
  about: string;
  aboutFocus: string[];
};

export type HeroContentData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  tagline: string;
  dynamicTitles: string[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type AboutContentData = {
  title: string;
  body: string;
  highlights: string[];
  avatarUrl: string;
};

export type ProjectSectionContent = {
  id?: string;
  projectSlug: string;
  title: string;
  body: string;
  bullets: string[];
  sortOrder: number;
  sectionType?: string;
  isVisible?: boolean;
};

export type ProjectContent = StaticProject & {
  slug: string;
  type?: string;
  tools?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  featured?: boolean;
  status?: "draft" | "preparation" | "published" | "archived";
  group?: string;
  homeFeaturedOrder?: number;
  projectsPageOrder?: number;
  demoUrl?: string;
  repositoryUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  openGraphImage?: string;
  sortOrder?: number;
  sections?: ProjectSectionContent[];
};

export type PageSectionContent = {
  id: string;
  pageKey: string;
  sectionType: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  displayOrder: number;
  layoutVariant: string;
};

export type PageContent = {
  id: string;
  pageKey: string;
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImage: string;
  sections: PageSectionContent[];
};

export type VolunteeringContent = {
  role: string;
  organisation: string;
  logoUrl: string;
  logoAlt: string;
  date: string;
  domain: string;
  summary: string;
  descriptionItems: string[];
  focusAreas: string[];
  certification?: CertificationContent;
  sortOrder: number;
};

export type ExperienceContent = StaticExperience & {
  tools?: string[];
  sortOrder?: number;
};

export type EducationContent = {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  status: string;
  location: string;
  sortOrder: number;
};

export type CertificationContent = {
  name: string;
  issuer: string;
  date: string;
  credentialUrl?: string;
  credentialId?: string;
  imageUrl?: string;
  description?: string;
  tags: string[];
  sortOrder: number;
};

export type ResumeContent = StaticResumeAsset & {
  variant: string;
  sortOrder: number;
};

export type SocialLinkContent = {
  label: string;
  url: string;
  iconKey?: string;
  sortOrder: number;
};

export type PortfolioContent = {
  profile: ProfileContent;
  hero: HeroContentData;
  about: AboutContentData;
  skillCategories: SkillCategory[];
  projects: ProjectContent[];
  projectSections: ProjectSectionContent[];
  experience: ExperienceContent[];
  education: EducationContent[];
  certifications: CertificationContent[];
  resumes: ResumeContent[];
  socialLinks: SocialLinkContent[];
  pages: PageContent[];
  volunteering: VolunteeringContent[];
  navLinks: NavLink[];
};

export type CmsTableName =
  | "profile"
  | "hero"
  | "about"
  | "skills"
  | "projects"
  | "project_sections"
  | "experience"
  | "education"
  | "certifications"
  | "resumes"
  | "social_links"
  | "site_settings"
  | "contact_messages"
  | "uploads"
  | "pages"
  | "page_sections"
  | "page_section_items"
  | "project_section_items"
  | "project_media"
  | "volunteering";

export type AdminContentSnapshot = Partial<Record<CmsTableName, unknown[]>>;

export type MessageStatus = "new" | "read" | "archived";

export type MessageAction =
  | "mark_read"
  | "mark_unread"
  | "archive"
  | "restore_read"
  | "restore_unread";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  source: string | null;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  read_at: string | null;
  archived_at: string | null;
};

export type UploadBucket =
  | "public-assets"
  | "project-images"
  | "resumes"
  | "uploads";

export type UploadRecord = {
  id: string;
  source: "storage" | "local";
  bucket: UploadBucket;
  path: string;
  public_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  original_name: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type AdminProfileSettings = {
  displayName: string;
  jobTitle: string;
  phone: string;
  avatarUrl: string;
  timezone: string;
  language: string;
};
