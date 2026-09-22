import { z } from "zod";

// ─── Auth Schemas ──────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  timezone: z.string().default("Asia/Kathmandu"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── Reminder Schemas ─────────────────────────────────────────────────────────

export const ReminderScheduleSchema = z.object({
  daysBefore: z.number().int().min(0).max(3650),
  enabled: z.boolean().default(true),
  channel: z.enum(["email"]).default("email"),
  sendTime: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
});

export const CreateReminderSchema = z.object({
  categoryId: z.string().uuid("Invalid category"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional(),
  ownerName: z.string().max(150).optional(),
  referenceNumber: z.string().max(150).optional(),
  providerName: z.string().max(255).optional(),
  startDate: z.string().optional(), // ISO date string
  expiryDate: z.string().min(1, "Expiry date is required"), // ISO date string
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(["monthly", "quarterly", "half_yearly", "yearly", "custom"]).optional(),
  metadata: z.record(z.unknown()).default({}),
  schedules: z.array(ReminderScheduleSchema).default([]),
});

export const UpdateReminderSchema = CreateReminderSchema.partial().extend({
  status: z.enum(["active", "renewed"]).optional(),
});

export const RenewReminderSchema = z.object({
  newExpiryDate: z.string().min(1, "New expiry date is required"),
  notes: z.string().max(1000).optional(),
});

// ─── Filter / Query Schemas ───────────────────────────────────────────────────

export const ReminderQuerySchema = z.object({
  status: z.enum(["active", "due_soon", "today", "expired", "renewed"]).optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(["expiry_date", "created_at", "title", "category"]).default("expiry_date"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── User Schemas ─────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  timezone: z.string().optional(),
});

// ─── Notification Preference Schema ───────────────────────────────────────────

export const NotificationPreferenceSchema = z.object({
  emailEnabled: z.boolean().optional(),
  expiryDayEnabled: z.boolean().optional(),
  overdueEnabled: z.boolean().optional(),
  weeklySummaryEnabled: z.boolean().optional(),
  summaryDay: z.number().int().min(0).max(6).optional(),
  summaryTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>;
export type RenewReminderInput = z.infer<typeof RenewReminderSchema>;
export type ReminderQueryInput = z.infer<typeof ReminderQuerySchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type NotificationPreferenceInput = z.infer<typeof NotificationPreferenceSchema>;
