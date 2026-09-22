"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toInputDate } from "@/lib/utils";
import { getBikramSambatDate } from "@/lib/nepali-date";

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

export default function EditReminderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [providerName, setProviderName] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("yearly");
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/reminders/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const r = json.data;
          setTitle(r.title);
          setOwnerName(r.ownerName || "");
          setExpiryDate(toInputDate(r.expiryDate));
          if (r.startDate) setStartDate(toInputDate(r.startDate));
          setReferenceNumber(r.referenceNumber || "");
          setProviderName(r.providerName || "");
          setDescription(r.description || "");
          setIsRecurring(r.isRecurring || false);
          setRecurrenceType(r.recurrenceType || "yearly");
          const scheds = r.reminderSchedules
            ? r.reminderSchedules.filter((s: any) => s.enabled).map((s: any) => s.daysBefore)
            : [];
          setSelectedSchedules(scheds);
        } else {
          setError(json.error?.message || "Failed to load reminder");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

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
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        throw new Error(json.error?.message || "Failed to update reminder");
      }

      router.push(`/reminders/${id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-3xl mx-auto p-8 text-center text-gray-400">Loading reminder...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/reminders/${id}`}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Reminder</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">{error}</div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Reference / ID Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
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
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Recurrence */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm"
              />
              <span className="text-sm font-medium text-gray-700">Recurring item</span>
            </label>

            {isRecurring && (
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value)}
                aria-label="Recurrence Frequency"
                className="text-xs border border-gray-200 rounded-lg p-1.5 bg-white"
              >
                <option value="yearly">Yearly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>

          {/* Email Schedules */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Email Reminder Schedule
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SCHEDULE_OPTIONS.map((opt) => {
                const checked = selectedSchedules.includes(opt.days);
                return (
                  <label
                    key={opt.days}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      checked ? "border-blue-300 bg-blue-50/50 text-blue-900" : "border-gray-200 text-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSchedule(opt.days)}
                      className="w-3.5 h-3.5 text-blue-600 rounded-xs"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-6 flex justify-between">
            <Link
              href={`/reminders/${id}`}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
