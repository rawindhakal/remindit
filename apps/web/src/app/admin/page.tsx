import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    totalReminders,
    activeReminders,
    pushSubscribers,
    notificationLogsCount,
    failedLogsCount,
    recentUsers,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.reminder.count({ where: { status: { not: "deleted" } } }),
    prisma.reminder.count({ where: { status: "active" } }),
    prisma.pushSubscription.count(),
    prisma.notificationLog.count(),
    prisma.notificationLog.count({ where: { status: "failed" } }),
    prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { reminders: true } },
      },
    }),
    prisma.notificationLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        reminder: { select: { title: true, ownerName: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Super Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Global system health, user metrics, and platform operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/email"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            ✉️ Email Setup
          </Link>
          <Link
            href="/admin/push"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            🔔 Push Broadcast
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Registered Users", count: totalUsers, icon: "👥", color: "text-blue-400", href: "/admin/users" },
          { label: "Total Active Reminders", count: totalReminders, icon: "⏰", color: "text-green-400", href: "/admin/users" },
          { label: "Push Notification Subscribers", count: pushSubscribers, icon: "📲", color: "text-amber-400", href: "/admin/push" },
          {
            label: "Notification Logs (Failures)",
            count: `${notificationLogsCount} (${failedLogsCount} err)`,
            icon: "📨",
            color: failedLogsCount > 0 ? "text-red-400" : "text-slate-200",
            href: "/admin/email",
          },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-3 ${card.color}`}>
              {card.count}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Settings Shortcuts */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Super Admin Operations</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/users"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left group"
          >
            <span className="text-2xl block mb-2">👥</span>
            <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">Users & Roles</h3>
            <p className="text-xs text-slate-400 mt-1">Manage accounts, change roles, suspend users.</p>
          </Link>

          <Link
            href="/admin/email"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left group"
          >
            <span className="text-2xl block mb-2">✉️</span>
            <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">Gmail SMTP</h3>
            <p className="text-xs text-slate-400 mt-1">Configure email credentials and test delivery.</p>
          </Link>

          <Link
            href="/admin/google-login"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left group"
          >
            <span className="text-2xl block mb-2">🔐</span>
            <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">Google OAuth</h3>
            <p className="text-xs text-slate-400 mt-1">Setup Google Login Client ID and Secret.</p>
          </Link>

          <Link
            href="/admin/google-ads"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left group"
          >
            <span className="text-2xl block mb-2">📢</span>
            <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">Google Ads</h3>
            <p className="text-xs text-slate-400 mt-1">AdSense publisher ID, banner slots & toggles.</p>
          </Link>
        </div>
      </div>

      {/* Two columns: Recent Users & Recent Notification Logs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users Table */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-blue-400 hover:underline">
              View all ({totalUsers}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {recentUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{u.name || "Unnamed User"}</p>
                  <p className="text-slate-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                      u.role === "super_admin"
                        ? "bg-amber-500/20 text-amber-400"
                        : u.role === "admin"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {u.role}
                  </span>
                  <span className="text-slate-500 font-mono">{u._count.reminders} rem.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notification Activity */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent Delivery Logs</h2>
            <span className="text-xs text-slate-500">Last 5 logs</span>
          </div>

          {recentLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No delivery logs recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentLogs.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{l.reminder?.title || "Reminder"}</p>
                    <p className="text-slate-500">
                      Channel: {l.channel} · Type: {l.notificationType}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                        l.status === "sent" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {l.status}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">{formatDate(l.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
