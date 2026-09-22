import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus, formatDate, formatDaysRemaining, getStatusConfig } from "@/lib/utils";
import { getBikramSambatDate } from "@/lib/nepali-date";
import { GoogleAdBanner } from "@/components/google-ad-banner";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const timezone = user?.timezone || "Asia/Kathmandu";
  const todayBs = getBikramSambatDate(new Date());

  const reminders = await prisma.reminder.findMany({
    where: {
      userId: session.user.id,
      status: { not: "deleted" },
    },
    include: { category: true },
    orderBy: { expiryDate: "asc" },
  });

  // Calculate remaining days & statuses
  const enriched = reminders.map((r) => {
    const daysRemaining = getDaysRemaining(r.expiryDate, timezone);
    const status = computeStatus(daysRemaining);
    const bs = getBikramSambatDate(r.expiryDate);
    return { ...r, daysRemaining, computedStatus: status, bsDate: bs.formattedEn };
  });

  const counts = {
    active: enriched.filter((r) => r.computedStatus === "active").length,
    due_soon: enriched.filter((r) => r.computedStatus === "due_soon").length,
    today: enriched.filter((r) => r.computedStatus === "today").length,
    expired: enriched.filter((r) => r.computedStatus === "expired").length,
  };

  const upcoming = enriched.filter((r) => r.computedStatus !== "expired");
  const expired = enriched.filter((r) => r.computedStatus === "expired");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = session.user.name ? session.user.name.split(" ")[0] : "there";
  const attentionCount = counts.due_soon + counts.today;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
              <span>🇳🇵</span> Today: {todayBs.formattedEn} ({todayBs.formattedNp})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {attentionCount > 0
              ? `You have ${attentionCount} renewal${attentionCount === 1 ? "" : "s"} coming up soon that need attention.`
              : "All clear! None of your reminders are expiring in the next 30 days."}
          </p>
        </div>
        <div>
          <Link
            href="/reminders/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-xs transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Reminder
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active", count: counts.active, color: "text-green-600", bg: "bg-green-50", href: "/reminders?status=active" },
          { label: "Due Soon", count: counts.due_soon, color: "text-amber-600", bg: "bg-amber-50", href: "/reminders?status=due_soon" },
          { label: "Expiring Today", count: counts.today, color: "text-red-600", bg: "bg-red-50", href: "/reminders?status=today" },
          { label: "Expired", count: counts.expired, color: "text-gray-600", bg: "bg-gray-100", href: "/reminders?status=expired" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-blue-200 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${card.bg}`} />
            </div>
            <div className={`text-3xl sm:text-4xl font-extrabold mt-3 ${card.color} group-hover:scale-105 transition-transform`}>
              {card.count}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Add Presets (Nepal Essentials) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Quick Add Essentials (Nepal)
          </h3>
          <span className="text-xs text-blue-600 font-medium">Smart Nepal defaults</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { icon: "🪪", label: "Driving License" },
            { icon: "🚗", label: "Bluebook / Tax" },
            { icon: "🛡️", label: "Vehicle Insurance" },
            { icon: "📘", label: "Passport" },
            { icon: "🏢", label: "PAN / Company" },
          ].map((preset) => (
            <Link
              key={preset.label}
              href="/reminders/new"
              className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all text-xs font-semibold text-gray-800 hover:text-blue-700 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{preset.icon}</span>
              <span className="truncate">{preset.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Needs Attention / Expired Items */}
      {expired.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <span>⚠️</span> EXPIRED (NEEDS ACTION)
            </h2>
            <Link href="/reminders?status=expired" className="text-xs font-semibold text-blue-600 hover:underline">
              View all ({expired.length})
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expired.slice(0, 6).map((r) => {
              return (
                <Link
                  key={r.id}
                  href={`/reminders/${r.id}`}
                  className="bg-white p-4 rounded-xl border border-red-100 hover:border-red-300 transition-colors shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{r.category?.icon || "📄"}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{r.title}</h3>
                          {r.ownerName && <p className="text-xs text-gray-500 truncate">{r.ownerName}</p>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-100 text-red-700 shrink-0">
                        Expired
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="text-red-600 font-medium">
                      Expired {Math.abs(r.daysRemaining)} day{Math.abs(r.daysRemaining) !== 1 ? "s" : ""} ago
                    </span>
                    <span>{formatDate(r.expiryDate)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">UPCOMING RENEWALS</h2>
          <Link href="/reminders" className="text-xs font-semibold text-blue-600 hover:underline">
            View all ({upcoming.length})
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <span className="text-4xl">🎉</span>
            <h3 className="text-lg font-semibold text-gray-900 mt-3">Nothing to renew yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
              Add your first reminder and we'll automatically notify you before it expires.
            </p>
            <div className="mt-6">
              <Link
                href="/reminders/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Reminder
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 9).map((r) => {
              const statusCfg = getStatusConfig(r.computedStatus);
              return (
                <Link
                  key={r.id}
                  href={`/reminders/${r.id}`}
                  className="bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-all shadow-xs flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{r.category?.icon || "📄"}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {r.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            {r.ownerName && <span>{r.ownerName}</span>}
                            {r.ownerName && r.referenceNumber && <span>•</span>}
                            {r.referenceNumber && <span>{r.referenceNumber}</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusCfg.className} shrink-0`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${r.daysRemaining <= 7 ? "text-red-600" : r.daysRemaining <= 30 ? "text-amber-600" : "text-green-600"}`}>
                      {formatDaysRemaining(r.daysRemaining)}
                    </span>
                    <div className="text-right">
                      <span className="text-gray-700 font-medium block">{formatDate(r.expiryDate)}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">{r.bsDate}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Google AdSense Banner (renders if enabled in admin) */}
      <GoogleAdBanner format="horizontal" />
    </div>
  );
}
