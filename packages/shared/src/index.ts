// ─── Status ───────────────────────────────────────────────────────────────────

export type ReminderStatus = "active" | "due_soon" | "today" | "expired" | "renewed";

export const REMINDER_STATUS = {
  ACTIVE: "active" as ReminderStatus,
  DUE_SOON: "due_soon" as ReminderStatus,
  TODAY: "today" as ReminderStatus,
  EXPIRED: "expired" as ReminderStatus,
  RENEWED: "renewed" as ReminderStatus,
} as const;

/** Thresholds for status calculation */
export const STATUS_THRESHOLDS = {
  DUE_SOON_DAYS: 30, // ≤ 30 days → due_soon
  TODAY_DAYS: 0,     // = 0 days → today
} as const;

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationChannel = "email" | "push" | "sms";
export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export const NOTIFICATION_STATUS = {
  PENDING: "pending" as NotificationStatus,
  SENT: "sent" as NotificationStatus,
  FAILED: "failed" as NotificationStatus,
  SKIPPED: "skipped" as NotificationStatus,
} as const;

// ─── Default Reminder Schedules ───────────────────────────────────────────────

/** Days before expiry to send a reminder */
export const DEFAULT_REMINDER_SCHEDULE = [90, 60, 30, 15, 7, 3, 1, 0] as const;

export const DEFAULT_SUBSCRIPTION_SCHEDULE = [30, 7, 1] as const;

// ─── Recurrence ───────────────────────────────────────────────────────────────

export type RecurrenceType = "monthly" | "quarterly" | "half_yearly" | "yearly" | "custom";

// ─── Category Groups ─────────────────────────────────────────────────────────

export type CategoryGroup = "Documents" | "Vehicle" | "Insurance" | "Subscription" | "Warranty" | "Business" | "Other";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  "Documents",
  "Vehicle",
  "Insurance",
  "Subscription",
  "Warranty",
  "Business",
  "Other",
];

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Date Utilities ──────────────────────────────────────────────────────────

/**
 * Calculate days remaining from today until expiryDate.
 * Positive = future, 0 = today, negative = expired.
 */
export function getDaysRemaining(expiryDate: Date, timezone = "Asia/Kathmandu"): number {
  const now = new Date();
  // Get current date in user's timezone
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
  const today = new Date(todayStr);
  const expiry = new Date(expiryDate.toISOString().split("T")[0]);
  const diff = expiry.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the status from days remaining.
 */
export function getStatus(daysRemaining: number): ReminderStatus {
  if (daysRemaining < 0) return REMINDER_STATUS.EXPIRED;
  if (daysRemaining === 0) return REMINDER_STATUS.TODAY;
  if (daysRemaining <= STATUS_THRESHOLDS.DUE_SOON_DAYS) return REMINDER_STATUS.DUE_SOON;
  return REMINDER_STATUS.ACTIVE;
}

/**
 * Format a date for display (e.g. "25 October 2026")
 */
export function formatDate(date: Date | string, locale = "en-NP"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Get user's local date as a YYYY-MM-DD string
 */
export function getUserLocalDate(timezone = "Asia/Kathmandu"): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}
