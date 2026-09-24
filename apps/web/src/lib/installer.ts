import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const DEFAULT_CATEGORIES = [
  // Documents
  { name: "Driving License", slug: "driving-license", icon: "🪪", color: "#3B82F6", group: "Documents", sortOrder: 1, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Passport", slug: "passport", icon: "📘", color: "#6366F1", group: "Documents", sortOrder: 2, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "National ID", slug: "national-id", icon: "🪪", color: "#8B5CF6", group: "Documents", sortOrder: 3, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Citizenship", slug: "citizenship", icon: "📄", color: "#EC4899", group: "Documents", sortOrder: 4, defaultSchedule: [90, 60, 30, 15, 7] },
  { name: "Visa", slug: "visa", icon: "✈️", color: "#F59E0B", group: "Documents", sortOrder: 5, defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0] },
  { name: "Work Permit", slug: "work-permit", icon: "💼", color: "#10B981", group: "Documents", sortOrder: 6, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },

  // Vehicle
  { name: "Bluebook", slug: "bluebook", icon: "📋", color: "#3B82F6", group: "Vehicle", sortOrder: 10, defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0] },
  { name: "Vehicle Tax", slug: "vehicle-tax", icon: "🚗", color: "#EF4444", group: "Vehicle", sortOrder: 11, defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0] },
  { name: "Vehicle Insurance", slug: "vehicle-insurance", icon: "🛡️", color: "#F97316", group: "Vehicle", sortOrder: 12, defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0] },
  { name: "Vehicle Fitness", slug: "vehicle-fitness", icon: "🔧", color: "#84CC16", group: "Vehicle", sortOrder: 13, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Pollution Certificate", slug: "pollution-certificate", icon: "🌿", color: "#22C55E", group: "Vehicle", sortOrder: 14, defaultSchedule: [60, 30, 15, 7, 3, 1] },

  // Insurance
  { name: "Health Insurance", slug: "health-insurance", icon: "🏥", color: "#EC4899", group: "Insurance", sortOrder: 20, defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0] },
  { name: "Life Insurance", slug: "life-insurance", icon: "❤️", color: "#F43F5E", group: "Insurance", sortOrder: 21, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Travel Insurance", slug: "travel-insurance", icon: "✈️", color: "#0EA5E9", group: "Insurance", sortOrder: 22, defaultSchedule: [30, 15, 7, 3, 1, 0] },
  { name: "Property Insurance", slug: "property-insurance", icon: "🏠", color: "#78716C", group: "Insurance", sortOrder: 23, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },

  // Subscription
  { name: "Internet Subscription", slug: "internet-subscription", icon: "🌐", color: "#6366F1", group: "Subscription", sortOrder: 30, defaultSchedule: [30, 7, 1] },
  { name: "Mobile Plan", slug: "mobile-plan", icon: "📱", color: "#8B5CF6", group: "Subscription", sortOrder: 31, defaultSchedule: [30, 7, 1] },
  { name: "OTT / Streaming", slug: "ott-streaming", icon: "📺", color: "#E11D48", group: "Subscription", sortOrder: 32, defaultSchedule: [30, 7, 1] },
  { name: "Software License", slug: "software-license", icon: "💻", color: "#0891B2", group: "Subscription", sortOrder: 33, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Domain", slug: "domain", icon: "🔗", color: "#D97706", group: "Subscription", sortOrder: 34, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Hosting", slug: "hosting", icon: "☁️", color: "#059669", group: "Subscription", sortOrder: 35, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Membership", slug: "membership", icon: "🏷️", color: "#7C3AED", group: "Subscription", sortOrder: 36, defaultSchedule: [30, 7, 1] },

  // Warranty
  { name: "Phone Warranty", slug: "phone-warranty", icon: "📱", color: "#6B7280", group: "Warranty", sortOrder: 40, defaultSchedule: [90, 60, 30, 15, 7] },
  { name: "Laptop Warranty", slug: "laptop-warranty", icon: "💻", color: "#374151", group: "Warranty", sortOrder: 41, defaultSchedule: [90, 60, 30, 15, 7] },
  { name: "Appliance Warranty", slug: "appliance-warranty", icon: "🏠", color: "#9CA3AF", group: "Warranty", sortOrder: 42, defaultSchedule: [90, 60, 30, 15, 7] },
  { name: "Electronics Warranty", slug: "electronics-warranty", icon: "🔌", color: "#4B5563", group: "Warranty", sortOrder: 43, defaultSchedule: [90, 60, 30, 15, 7] },

  // Business
  { name: "Company Registration", slug: "company-registration", icon: "🏢", color: "#1D4ED8", group: "Business", sortOrder: 50, defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0] },
  { name: "Business License", slug: "business-license", icon: "📃", color: "#2563EB", group: "Business", sortOrder: 51, defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0] },
  { name: "PAN / VAT", slug: "pan-vat", icon: "📊", color: "#0D9488", group: "Business", sortOrder: 52, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Contract", slug: "contract", icon: "📝", color: "#7C3AED", group: "Business", sortOrder: 53, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Employee Certificate", slug: "employee-certificate", icon: "👤", color: "#DC2626", group: "Business", sortOrder: 54, defaultSchedule: [90, 60, 30, 15, 7] },

  // Other
  { name: "Bank Card", slug: "bank-card", icon: "💳", color: "#0369A1", group: "Other", sortOrder: 60, defaultSchedule: [90, 60, 30, 15, 7, 3, 1] },
  { name: "Custom Reminder", slug: "custom", icon: "⭐", color: "#F59E0B", group: "Other", sortOrder: 99, defaultSchedule: [30, 7, 1] },
];

export const DEFAULT_SETTINGS = [
  { key: "google_ads.enabled", value: "false", group: "google_ads", description: "Enable Google AdSense ads across the app" },
  { key: "google_ads.client_id", value: "", group: "google_ads", description: "Google AdSense Publisher ID (ca-pub-xxxxxxxxxx)" },
  { key: "google_ads.top_banner_slot", value: "", group: "google_ads", description: "Top banner ad unit slot ID" },
  { key: "google_ads.sidebar_slot", value: "", group: "google_ads", description: "Sidebar ad unit slot ID" },
  { key: "google_ads.bottom_slot", value: "", group: "google_ads", description: "Bottom / footer ad unit slot ID" },
  { key: "google_ads.auto_ads", value: "false", group: "google_ads", description: "Enable Google Auto Ads" },
  { key: "google_auth.enabled", value: "false", group: "google_auth", description: "Enable Google One-Tap / OAuth sign in" },
  { key: "google_auth.client_id", value: "", group: "google_auth", description: "Google OAuth Client ID" },
  { key: "google_auth.client_secret", value: "", group: "google_auth", description: "Google OAuth Client Secret" },
  { key: "email.provider", value: "gmail", group: "email", description: "Email delivery service (gmail, smtp)" },
  { key: "email.smtp_host", value: "smtp.gmail.com", group: "email", description: "SMTP host" },
  { key: "email.smtp_port", value: "587", group: "email", description: "SMTP port (587 or 465)" },
  { key: "email.smtp_user", value: "", group: "email", description: "SMTP / Gmail account email" },
  { key: "email.smtp_pass", value: "", group: "email", description: "SMTP / Gmail App Password" },
  { key: "email.from_name", value: "RenewIt", group: "email", description: "Sender display name" },
  { key: "email.from_address", value: "noreply@renewit.app", group: "email", description: "Sender email address" },
  { key: "push.enabled", value: "true", group: "push", description: "Enable PWA Web Push notifications" },
  { key: "push.public_key", value: "BPCP8QkDDz7Z1sWG9UDLLOLUfnSPaAdTjm4p6w5wlQWm3Bw_QSlnGaBAp1nvdIpxweH0FlcGwyqCm5Oy3wQ13H8", group: "push", description: "VAPID Public Key for web push" },
  { key: "push.private_key", value: "dR0F10ONJQ9ILKcSNoKWZDl3DbTVAegKYOiPm-arteA", group: "push", description: "VAPID Private Key for web push" },
  { key: "push.subject", value: "mailto:support@renewit.app", group: "push", description: "VAPID Subject mailto or URL" },
  { key: "system.installed", value: "true", group: "general", description: "System installation completed lock" },
];

export async function checkInstallationStatus(): Promise<{
  installed: boolean;
  dbConnected: boolean;
  hasSuperAdmin: boolean;
  categoriesCount: number;
  error?: string;
}> {
  try {
    // 1. Check if database responds
    const superAdmin = await prisma.user.findFirst({
      where: { role: { in: ["super_admin", "admin"] } },
      select: { id: true, email: true },
    });

    const categoriesCount = await prisma.category.count();

    const installLock = await prisma.systemSetting.findUnique({
      where: { key: "system.installed" },
    });

    const isInstalled = Boolean(installLock?.value === "true" || superAdmin);

    return {
      installed: isInstalled,
      dbConnected: true,
      hasSuperAdmin: Boolean(superAdmin),
      categoriesCount,
    };
  } catch (err: any) {
    return {
      installed: false,
      dbConnected: false,
      hasSuperAdmin: false,
      categoriesCount: 0,
      error: err?.message || "Failed to connect to database",
    };
  }
}

export async function executeInstallation(params: {
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  timezone?: string;
  appName?: string;
  smtpEmail?: string;
  smtpPass?: string;
}) {
  const {
    adminName,
    adminEmail,
    adminPassword,
    timezone = "Asia/Kathmandu",
    appName = "RenewIt",
    smtpEmail,
    smtpPass,
  } = params;

  // 1. Seed or update system settings
  for (const s of DEFAULT_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value,
        group: s.group,
        description: s.description,
      },
    });
  }

  // 2. Set custom app and email settings if provided
  if (appName) {
    await prisma.systemSetting.upsert({
      where: { key: "email.from_name" },
      update: { value: appName },
      create: { key: "email.from_name", value: appName, group: "email", description: "Sender display name" },
    });
  }

  if (smtpEmail && smtpPass) {
    await prisma.systemSetting.upsert({
      where: { key: "email.smtp_user" },
      update: { value: smtpEmail },
      create: { key: "email.smtp_user", value: smtpEmail, group: "email" },
    });
    await prisma.systemSetting.upsert({
      where: { key: "email.smtp_pass" },
      update: { value: smtpPass },
      create: { key: "email.smtp_pass", value: smtpPass, group: "email" },
    });
    await prisma.systemSetting.upsert({
      where: { key: "email.from_address" },
      update: { value: smtpEmail },
      create: { key: "email.from_address", value: smtpEmail, group: "email" },
    });
  }

  // 3. Seed Categories
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        group: cat.group,
        sortOrder: cat.sortOrder,
        defaultSchedule: cat.defaultSchedule as any,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        group: cat.group,
        sortOrder: cat.sortOrder,
        defaultSchedule: cat.defaultSchedule as any,
      },
    });
  }

  // 4. Create Super Admin User
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase().trim() },
    update: {
      name: adminName.trim(),
      passwordHash,
      role: "super_admin",
      status: "active",
      emailVerifiedAt: new Date(),
      timezone,
    },
    create: {
      name: adminName.trim(),
      email: adminEmail.toLowerCase().trim(),
      passwordHash,
      role: "super_admin",
      status: "active",
      emailVerifiedAt: new Date(),
      timezone,
    },
  });

  // Ensure notification preferences exist for Super Admin
  await prisma.notificationPreference.upsert({
    where: { userId: admin.id },
    update: { emailEnabled: true },
    create: {
      userId: admin.id,
      emailEnabled: true,
      pushEnabled: true,
      expiryDayEnabled: true,
      weeklySummaryEnabled: true,
    },
  });

  // 5. Finalize installation lock
  await prisma.systemSetting.upsert({
    where: { key: "system.installed" },
    update: { value: "true" },
    create: {
      key: "system.installed",
      value: "true",
      group: "general",
      description: "Installation completed lock",
    },
  });

  return { success: true, adminEmail: admin.email };
}
