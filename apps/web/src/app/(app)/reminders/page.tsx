"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatDate, formatDaysRemaining, getStatusConfig, ReminderStatus } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  group: string | null;
}

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  ownerName: string | null;
  referenceNumber: string | null;
  providerName: string | null;
  expiryDate: string;
  daysRemaining: number;
  computedStatus: ReminderStatus;
  category: Category | null;
}

function RemindersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const currentStatus = searchParams.get("status") || "all";
  const currentCategory = searchParams.get("categoryId") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sortBy") || "expiry_date";

  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    // Fetch categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (currentStatus !== "all") params.set("status", currentStatus);
    if (currentCategory) params.set("categoryId", currentCategory);
    if (currentSearch) params.set("search", currentSearch);
    if (currentSort) params.set("sortBy", currentSort);
    params.set("pageSize", "100");

    fetch(`/api/reminders?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setReminders(json.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentStatus, currentCategory, currentSearch, currentSort]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`/reminders?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", search);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all your tracked documents, policies, and renewals
          </p>
        </div>
        <Link
          href="/reminders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Reminder
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              placeholder="Search reminders by title, owner, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {/* Category Dropdown */}
          <select
            value={currentCategory}
            onChange={(e) => updateParam("categoryId", e.target.value)}
            aria-label="Filter by Category"
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon || "📄"} {c.name}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={currentSort}
            onChange={(e) => updateParam("sortBy", e.target.value)}
            aria-label="Sort Reminders By"
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="expiry_date">Sort: Expiry Date</option>
            <option value="created_at">Sort: Recently Added</option>
            <option value="title">Sort: Alphabetical</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-sm border-t border-gray-100 pt-3">
          {[
            { id: "all", label: "All" },
            { id: "due_soon", label: "Due Soon" },
            { id: "today", label: "Today" },
            { id: "expired", label: "Expired" },
            { id: "active", label: "Active" },
          ].map((tab) => {
            const isActive = currentStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => updateParam("status", tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-5 rounded-2xl border border-gray-100 animate-pulse h-36" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-semibold text-gray-900 mt-3">No reminders found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
            {currentSearch || currentCategory || currentStatus !== "all"
              ? "Try adjusting your filters or search terms."
              : "You haven't created any reminders yet."}
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
          {reminders.map((r) => {
            const statusCfg = getStatusConfig(r.computedStatus);
            return (
              <Link
                key={r.id}
                href={`/reminders/${r.id}`}
                className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0 p-2 bg-gray-50 rounded-xl">
                        {r.category?.icon || "📄"}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {r.title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {r.category?.name || "General"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${statusCfg.className} shrink-0`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {(r.ownerName || r.referenceNumber || r.providerName) && (
                    <div className="mt-3 space-y-1 text-xs text-gray-500 bg-gray-50/50 p-2.5 rounded-lg">
                      {r.ownerName && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">For:</span>
                          <span className="font-medium text-gray-700">{r.ownerName}</span>
                        </div>
                      )}
                      {r.referenceNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ref/No:</span>
                          <span className="font-medium text-gray-700">{r.referenceNumber}</span>
                        </div>
                      )}
                      {r.providerName && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Provider:</span>
                          <span className="font-medium text-gray-700">{r.providerName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold ${
                      r.daysRemaining < 0
                        ? "text-red-600"
                        : r.daysRemaining <= 7
                        ? "text-red-600"
                        : r.daysRemaining <= 30
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatDaysRemaining(r.daysRemaining)}
                  </span>
                  <span className="text-gray-400">{formatDate(r.expiryDate)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RemindersPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-8 text-center text-gray-400">Loading reminders...</div>}>
      <RemindersListContent />
    </Suspense>
  );
}
