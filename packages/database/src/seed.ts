import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding categories...");

  const categories = [
    // Documents
    {
      name: "Driving License",
      slug: "driving-license",
      icon: "🪪",
      color: "#3B82F6",
      group: "Documents",
      sortOrder: 1,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Passport",
      slug: "passport",
      icon: "📘",
      color: "#6366F1",
      group: "Documents",
      sortOrder: 2,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "National ID",
      slug: "national-id",
      icon: "🪪",
      color: "#8B5CF6",
      group: "Documents",
      sortOrder: 3,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Citizenship",
      slug: "citizenship",
      icon: "📄",
      color: "#EC4899",
      group: "Documents",
      sortOrder: 4,
      defaultSchedule: [90, 60, 30, 15, 7],
    },
    {
      name: "Visa",
      slug: "visa",
      icon: "✈️",
      color: "#F59E0B",
      group: "Documents",
      sortOrder: 5,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0],
    },
    {
      name: "Work Permit",
      slug: "work-permit",
      icon: "💼",
      color: "#10B981",
      group: "Documents",
      sortOrder: 6,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },

    // Vehicle
    {
      name: "Bluebook",
      slug: "bluebook",
      icon: "📋",
      color: "#3B82F6",
      group: "Vehicle",
      sortOrder: 10,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0],
    },
    {
      name: "Vehicle Tax",
      slug: "vehicle-tax",
      icon: "🚗",
      color: "#EF4444",
      group: "Vehicle",
      sortOrder: 11,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0],
    },
    {
      name: "Vehicle Insurance",
      slug: "vehicle-insurance",
      icon: "🛡️",
      color: "#F97316",
      group: "Vehicle",
      sortOrder: 12,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0],
    },
    {
      name: "Vehicle Fitness",
      slug: "vehicle-fitness",
      icon: "🔧",
      color: "#84CC16",
      group: "Vehicle",
      sortOrder: 13,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Pollution Certificate",
      slug: "pollution-certificate",
      icon: "🌿",
      color: "#22C55E",
      group: "Vehicle",
      sortOrder: 14,
      defaultSchedule: [60, 30, 15, 7, 3, 1],
    },

    // Insurance
    {
      name: "Health Insurance",
      slug: "health-insurance",
      icon: "🏥",
      color: "#EC4899",
      group: "Insurance",
      sortOrder: 20,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0],
    },
    {
      name: "Life Insurance",
      slug: "life-insurance",
      icon: "❤️",
      color: "#F43F5E",
      group: "Insurance",
      sortOrder: 21,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Travel Insurance",
      slug: "travel-insurance",
      icon: "✈️",
      color: "#0EA5E9",
      group: "Insurance",
      sortOrder: 22,
      defaultSchedule: [30, 15, 7, 3, 1, 0],
    },
    {
      name: "Property Insurance",
      slug: "property-insurance",
      icon: "🏠",
      color: "#78716C",
      group: "Insurance",
      sortOrder: 23,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },

    // Subscription
    {
      name: "Internet Subscription",
      slug: "internet-subscription",
      icon: "🌐",
      color: "#6366F1",
      group: "Subscription",
      sortOrder: 30,
      defaultSchedule: [30, 7, 1],
    },
    {
      name: "Mobile Plan",
      slug: "mobile-plan",
      icon: "📱",
      color: "#8B5CF6",
      group: "Subscription",
      sortOrder: 31,
      defaultSchedule: [30, 7, 1],
    },
    {
      name: "OTT / Streaming",
      slug: "ott-streaming",
      icon: "📺",
      color: "#E11D48",
      group: "Subscription",
      sortOrder: 32,
      defaultSchedule: [30, 7, 1],
    },
    {
      name: "Software License",
      slug: "software-license",
      icon: "💻",
      color: "#0891B2",
      group: "Subscription",
      sortOrder: 33,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Domain",
      slug: "domain",
      icon: "🔗",
      color: "#D97706",
      group: "Subscription",
      sortOrder: 34,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Hosting",
      slug: "hosting",
      icon: "☁️",
      color: "#059669",
      group: "Subscription",
      sortOrder: 35,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Membership",
      slug: "membership",
      icon: "🏷️",
      color: "#7C3AED",
      group: "Subscription",
      sortOrder: 36,
      defaultSchedule: [30, 7, 1],
    },

    // Warranty
    {
      name: "Phone Warranty",
      slug: "phone-warranty",
      icon: "📱",
      color: "#6B7280",
      group: "Warranty",
      sortOrder: 40,
      defaultSchedule: [90, 60, 30, 15, 7],
    },
    {
      name: "Laptop Warranty",
      slug: "laptop-warranty",
      icon: "💻",
      color: "#374151",
      group: "Warranty",
      sortOrder: 41,
      defaultSchedule: [90, 60, 30, 15, 7],
    },
    {
      name: "Appliance Warranty",
      slug: "appliance-warranty",
      icon: "🏠",
      color: "#9CA3AF",
      group: "Warranty",
      sortOrder: 42,
      defaultSchedule: [90, 60, 30, 15, 7],
    },
    {
      name: "Electronics Warranty",
      slug: "electronics-warranty",
      icon: "🔌",
      color: "#4B5563",
      group: "Warranty",
      sortOrder: 43,
      defaultSchedule: [90, 60, 30, 15, 7],
    },

    // Business
    {
      name: "Company Registration",
      slug: "company-registration",
      icon: "🏢",
      color: "#1D4ED8",
      group: "Business",
      sortOrder: 50,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0],
    },
    {
      name: "Business License",
      slug: "business-license",
      icon: "📃",
      color: "#2563EB",
      group: "Business",
      sortOrder: 51,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1, 0],
    },
    {
      name: "PAN / VAT",
      slug: "pan-vat",
      icon: "📊",
      color: "#0D9488",
      group: "Business",
      sortOrder: 52,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Contract",
      slug: "contract",
      icon: "📝",
      color: "#7C3AED",
      group: "Business",
      sortOrder: 53,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Employee Certificate",
      slug: "employee-certificate",
      icon: "👤",
      color: "#DC2626",
      group: "Business",
      sortOrder: 54,
      defaultSchedule: [90, 60, 30, 15, 7],
    },

    // Other
    {
      name: "Bank Card",
      slug: "bank-card",
      icon: "💳",
      color: "#0369A1",
      group: "Other",
      sortOrder: 60,
      defaultSchedule: [90, 60, 30, 15, 7, 3, 1],
    },
    {
      name: "Custom Reminder",
      slug: "custom",
      icon: "⭐",
      color: "#F59E0B",
      group: "Other",
      sortOrder: 99,
      defaultSchedule: [30, 7, 1],
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    console.log(`  ✓ ${category.name}`);
  }

  console.log(`\n✅ Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
