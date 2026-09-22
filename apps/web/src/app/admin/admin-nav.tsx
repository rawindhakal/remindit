"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Overview & Health", icon: "📊" },
  { href: "/admin/users", label: "User Management", icon: "👥" },
  { href: "/admin/email", label: "Email SMTP Settings", icon: "✉️" },
  { href: "/admin/google-login", label: "Google OAuth Login", icon: "🔐" },
  { href: "/admin/google-ads", label: "Google Ads & AdSense", icon: "📢" },
  { href: "/admin/push", label: "Push Notifications & Broadcast", icon: "🔔" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="p-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
