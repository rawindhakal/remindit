import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate days remaining until a date (positive = future, negative = past)
 */
export function getDaysRemaining(expiryDate: Date | string, timezone = "Asia/Kathmandu"): number {
  const expiry = new Date(expiryDate);
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  const today = new Date(todayStr + "T00:00:00");
  const expiryLocal = new Date(expiry.toISOString().split("T")[0] + "T00:00:00");
  const diff = expiryLocal.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export type ReminderStatus = "active" | "due_soon" | "today" | "expired";

/**
 * Get the computed status from days remaining
 */
export function computeStatus(daysRemaining: number): ReminderStatus {
  if (daysRemaining < 0) return "expired";
  if (daysRemaining === 0) return "today";
  if (daysRemaining <= 30) return "due_soon";
  return "active";
}

/**
 * Format a date for display: "25 October 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Format a date as YYYY-MM-DD for input fields
 */
export function toInputDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Get status badge class
 */
export function getStatusConfig(status: ReminderStatus | string) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        className: "bg-green-100 text-green-800",
        dotColor: "bg-green-500",
      };
    case "due_soon":
      return {
        label: "Due Soon",
        className: "bg-yellow-100 text-yellow-800",
        dotColor: "bg-yellow-500",
      };
    case "today":
      return {
        label: "Expiring Today",
        className: "bg-red-100 text-red-800",
        dotColor: "bg-red-500",
      };
    case "expired":
      return {
        label: "Expired",
        className: "bg-gray-100 text-gray-700",
        dotColor: "bg-gray-400",
      };
    case "renewed":
      return {
        label: "Renewed",
        className: "bg-blue-100 text-blue-800",
        dotColor: "bg-blue-500",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-700",
        dotColor: "bg-gray-400",
      };
  }
}

/**
 * Format days remaining as a human-readable string
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} day${days !== 1 ? "s" : ""}`;
}

/**
 * Generate a secure random token
 */
export function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
