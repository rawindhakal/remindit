"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const settingsNav = [
  { href: "/settings/profile", label: "Profile & Timezone" },
  { href: "/settings/notifications", label: "Notification Preferences" },
  { href: "/settings/security", label: "Password & Security" },
  { href: "/settings/data", label: "Data Export & Danger Zone" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account, preferences, and notifications</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <aside className="md:col-span-1 space-y-1">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Content Area */}
        <div className="md:col-span-3 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
