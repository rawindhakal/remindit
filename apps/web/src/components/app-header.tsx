"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { NotificationCenter } from "./notification-center";

interface AppHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🔔</span>
          <span className="text-lg font-bold text-blue-600">RenewIt</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <h1 className="text-sm font-medium text-gray-500">
          Nepal Expiry & Renewal Tracking
        </h1>
        {isAdmin && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-purple-100 text-purple-700 border border-purple-200">
            {user.role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Admin Panel</span>
          </Link>
        )}

        {/* In-App Notification Center & Web Push Trigger */}
        <NotificationCenter />

        <Link
          href="/reminders/new"
          className="md:hidden flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Add Reminder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </Link>

        <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-500 hover:text-gray-900 md:hidden"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
