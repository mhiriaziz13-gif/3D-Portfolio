import { z } from "zod";

export const emailSchema = z.string().trim().email().max(254);

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password is too long.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const captchaTokenSchema = z.string().trim().min(1).max(4096);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256),
  next: z.string().optional(),
  captchaToken: captchaTokenSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  captchaToken: captchaTokenSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  message: z.string().trim().min(10).max(5000),
  company: z.string().max(0).optional().or(z.literal("")),
});

export const mfaVerifySchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
  rememberDevice: z.boolean().optional().default(false),
});

export const mfaRemoveSchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/).optional(),
});

export const mfaPreferenceSchema = z.object({
  mfaRequired: z.boolean(),
  rememberDeviceEnabled: z.boolean().optional().default(true),
});

export const contentMutationSchema = z.object({
  table: z.string().min(1),
  values: z.record(z.string(), z.unknown()).optional(),
  rows: z.array(z.record(z.string(), z.unknown())).optional(),
  id: z.string().optional(),
});

export const messageStatusSchema = z.enum(["new", "read", "archived"]);

export const messageActionSchema = z.enum([
  "mark_read",
  "mark_unread",
  "archive",
  "restore_read",
  "restore_unread",
]);

export const messageUpdateSchema = z.object({
  id: z.string().uuid(),
  action: messageActionSchema,
}).strict();

export const messageDeleteSchema = z.object({
  id: z.string().uuid(),
}).strict();

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const isInternalPath = (value: string) =>
  value.startsWith("/") && !value.startsWith("//");

export const assetUrlSchema = z.string().trim().max(2048).refine(
  (value) => !value || isInternalPath(value) || isHttpsUrl(value),
  "Enter an HTTPS URL or a site path beginning with /.",
);

export const externalUrlSchema = z.string().trim().max(2048).refine(
  (value) => !value || isHttpsUrl(value),
  "Enter a valid HTTPS URL.",
);

export const adminProfileSettingsSchema = z.object({
  displayName: z.string().trim().max(120).optional().default(""),
  jobTitle: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  avatarUrl: assetUrlSchema.optional().default(""),
  timezone: z.string().trim().max(100).optional().default(""),
  language: z.string().trim().max(50).optional().default(""),
}).strict();

const optionalText = (max = 5000) => z.string().trim().max(max).optional().default("");
const requiredText = (max = 500) => z.string().trim().min(1).max(max);
const stringList = z.array(z.string().trim().min(1).max(300)).max(100).optional().default([]);
const sortOrder = z.number().int().min(-10000).max(10000).optional().default(0);
const published = z.boolean().optional().default(true);
const id = z.string().uuid().optional();
const assetLink = assetUrlSchema.optional().default("");
const externalLink = externalUrlSchema.optional().default("");
const nullableExternalLink = z.preprocess(
  (value) => value == null ? "" : value,
  externalLink,
);
const socialLink = z.string().trim().max(2048).refine((value) => {
  if (isHttpsUrl(value)) return true;
  return value.startsWith("mailto:") && emailSchema.safeParse(value.slice(7)).success;
}, "Enter a valid HTTPS URL or email link.").optional().default("");
const siteLink = z.string().trim().max(2048).refine((value) => {
  if (!value || isInternalPath(value) || value.startsWith("#")) return true;
  if (value.startsWith("mailto:")) return emailSchema.safeParse(value.slice(7)).success;
  return isHttpsUrl(value);
}, "Enter a valid HTTPS URL, email link, or site path.").optional().default("");

const base = { id };

export const editableCmsTables = [
  "profile", "hero", "about", "skills", "projects", "project_sections", "experience",
  "education", "certifications", "resumes", "social_links",
] as const;

export type EditableCmsTable = (typeof editableCmsTables)[number];

export const isEditableCmsTable = (value: string): value is EditableCmsTable =>
  editableCmsTables.includes(value as EditableCmsTable);

const cmsRowSchemas: Record<EditableCmsTable, z.ZodType<Record<string, unknown>>> = {
  profile: z.object({ ...base, full_name: requiredText(), initials: optionalText(20), headline: optionalText(), secondary_line: optionalText(), tagline: optionalText(), location: optionalText(), email: z.union([emailSchema, z.literal("")]).optional().default(""), linkedin_url: externalLink, linkedin_label: optionalText(), github_url: externalLink, github_label: optionalText(), avatar_url: assetLink, availability: optionalText(), short_bio: optionalText(), about_text: optionalText(10000), about_focus: stringList, published }),
  hero: z.object({ ...base, eyebrow: optionalText(), title: optionalText(), subtitle: optionalText(), tagline: optionalText(), dynamic_titles: stringList, primary_cta_label: optionalText(), primary_cta_href: siteLink, secondary_cta_label: optionalText(), secondary_cta_href: siteLink, published }),
  about: z.object({ ...base, title: optionalText(), body: optionalText(10000), highlights: stringList, avatar_url: assetLink, published }),
  skills: z.object({ ...base, name: requiredText(), category: requiredText(), icon_key: optionalText(), description: optionalText(2000), sort_order: sortOrder, published }),
  projects: z.object({ ...base, slug: requiredText(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug."), title: requiredText(), type: optionalText(), summary: optionalText(5000), description: optionalText(20000), cover_image_url: assetLink, tags: stringList, tools: stringList, github_url: nullableExternalLink, linkedin_url: nullableExternalLink, featured: z.boolean().optional().default(false), published, sort_order: sortOrder }),
  project_sections: z.object({ ...base, project_id: z.string().uuid(), title: requiredText(), body: optionalText(20000), bullets: stringList, sort_order: sortOrder }),
  experience: z.object({ ...base, company: requiredText(), role: requiredText(), location: optionalText(), start_date: optionalText(), end_date: optionalText(), date_label: optionalText(), logo_url: assetLink, logo_alt: optionalText(), points: stringList, tools: stringList, sort_order: sortOrder, published }),
  education: z.object({ ...base, institution: requiredText(), degree: requiredText(), start_date: optionalText(), end_date: optionalText(), status: optionalText(), location: optionalText(), sort_order: sortOrder, published }),
  certifications: z.object({ ...base, name: requiredText(), issuer: optionalText(), date: optionalText(), credential_url: externalLink, credential_id: optionalText(), image_url: assetLink, description: optionalText(5000), tags: stringList, sort_order: sortOrder, published }),
  resumes: z.object({ ...base, label: requiredText(), variant: requiredText(), pdf_url: assetLink, docx_url: assetLink, sort_order: sortOrder, published }),
  social_links: z.object({ ...base, label: requiredText(), url: socialLink.refine((value) => Boolean(value), "URL is required."), icon_key: optionalText(), sort_order: sortOrder, published }),
};

export const validateCmsRow = (table: EditableCmsTable, value: unknown) => cmsRowSchemas[table].safeParse(value);
