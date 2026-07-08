import { z } from "zod";

export const emailSchema = z.string().trim().email().max(254);

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password is too long.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
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