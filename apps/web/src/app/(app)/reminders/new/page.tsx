"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEFAULT_REMINDER_SCHEDULE } from "@/app/api/reminders/constants";
import { getBikramSambatDate } from "@/lib/nepali-date";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  group: string | null;
  defaultSchedule: number[];
}

const SCHEDULE_OPTIONS = [
  { days: 90, label: "90 days before" },
  { days: 60, label: "60 days before" },
  { days: 30, label: "30 days before" },
  { days: 15, label: "15 days before" },
  { days: 7, label: "7 days before" },
  { days: 3, label: "3 days before" },
  { days: 1, label: "1 day before" },
  { days: 0, label: "On expiry day" },
];

export default function NewReminderPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [providerName, setProviderName] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("yearly");
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>(DEFAULT_REMINDER_SCHEDULE);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      })
      .catch(console.error)
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setTitle(cat.name);
    if (cat.defaultSchedule && cat.defaultSchedule.length > 0) {
      setSelectedSchedules(cat.defaultSchedule);
    }
    setStep(2);
  };

  const toggleSchedule = (days: number) => {
    if (selectedSchedules.includes(days)) {
      setSelectedSchedules(selectedSchedules.filter((d) => d !== days));
    } else {
      setSelectedSchedules([...selectedSchedules, days].sort((a, b) => b - a));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !expiryDate) {
      setError("Title and expiry date are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory?.id,
          title,
          ownerName: ownerName || undefined,
          expiryDate,
          startDate: startDate || undefined,
          referenceNumber: referenceNumber || undefined,
          providerName: providerName || undefined,
          description: description || undefined,
          isRecurring,
          recurrenceType: isRecurring ? recurrenceType : undefined,
          schedules: selectedSchedules.map((daysBefore) => ({ daysBefore, enabled: true })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create reminder");
      }

      router.push(`/reminders/${json.data.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  // Group categories
  const groupedCategories = categories.reduce<Record<string, Category[]>>((acc, cat) => {
    const group = cat.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/reminders"
            className="p-2 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add Reminder</h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <span className={`px-2.5 py-1 rounded-full ${step === 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>1</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-full ${step === 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>2</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-full ${step === 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>3</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Select Category */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">What do you want to track?</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose a category to get smart reminder defaults, or select Custom.
            </p>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCategories).map(([groupName, cats]) => (
                <div key={groupName} className="space-y-2.5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{groupName}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {cats.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50 hover:border-blue-200 text-left transition-all group"
                      >
                        <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                          {cat.icon || "📄"}
                        </span>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 truncate">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Reminder Details */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedCategory?.icon || "📄"}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Basic Details</h2>
                <p className="text-xs text-gray-500">{selectedCategory?.name || "General Reminder"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Change Category
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (title && expiryDate) setStep(3); else setError("Please fill in Title and Expiry Date."); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Reminder Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rabin Driving License, Toyota Insurance"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {expiryDate ? (
                  <div className="mt-2 p-2 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <span>🇳🇵</span> Bikram Sambat:
                    </span>
                    <span className="font-mono text-blue-700">
                      {getBikramSambatDate(expiryDate).formattedEn} ({getBikramSambatDate(expiryDate).formattedNp})
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">Select date to see Bikram Sambat (BS) date</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  For (Person or Asset)
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rabin Dhakal / BA 2 CHA 1234"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reference / Policy / ID Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Optional reference number"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Provider / Issuer
                </label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. Shikhar Insurance, DOTM"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Notes / Instructions
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes or renewal steps"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm"
                />
                <span className="text-sm font-medium text-gray-700">Recurs periodically (e.g. annual tax)</span>
              </label>

              {isRecurring && (
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value)}
                  aria-label="Recurrence Interval"
                  className="text-xs border border-gray-200 rounded-lg p-1.5 bg-white"
                >
                  <option value="yearly">Yearly</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Next: Reminder Schedule →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Reminder Schedule */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Email Reminder Schedule</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose when you want to receive email alerts before <strong className="text-gray-700">{title}</strong> expires.
            </p>
            {expiryDate && (
              <div className="mt-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs flex items-center justify-between text-blue-900 font-semibold">
                <span>Expiry: {expiryDate}</span>
                <span>🇳🇵 {getBikramSambatDate(expiryDate).formattedEn} ({getBikramSambatDate(expiryDate).formattedNp})</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {SCHEDULE_OPTIONS.map((opt) => {
              const checked = selectedSchedules.includes(opt.days);
              return (
                <label
                  key={opt.days}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer ${
                    checked ? "border-blue-300 bg-blue-50/50 text-blue-900" : "border-gray-100 bg-white text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSchedule(opt.days)}
                      className="w-4 h-4 text-blue-600 rounded-sm"
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {opt.days === 0 ? "Same day" : `${opt.days}d`}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving Reminder..." : "Save Reminder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
