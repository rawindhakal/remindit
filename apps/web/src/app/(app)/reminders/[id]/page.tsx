"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, formatDaysRemaining, getStatusConfig, toInputDate, ReminderStatus } from "@/lib/utils";
import { getBikramSambatDate } from "@/lib/nepali-date";
import { DocumentAttachments } from "@/components/document-attachments";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface ReminderSchedule {
  id: string;
  daysBefore: number;
  enabled: boolean;
  channel: string;
}

interface RenewalHistory {
  id: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  renewedAt: string;
  notes: string | null;
}

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  ownerName: string | null;
  referenceNumber: string | null;
  providerName: string | null;
  startDate: string | null;
  expiryDate: string;
  isRecurring: boolean;
  recurrenceType: string | null;
  daysRemaining: number;
  computedStatus: ReminderStatus;
  category: Category | null;
  reminderSchedules: ReminderSchedule[];
  renewalHistory: RenewalHistory[];
  metadata?: any;
}

export default function ReminderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Renewal
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [renewalNotes, setRenewalNotes] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReminder = () => {
    setIsLoading(true);
    fetch(`/api/reminders/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setReminder(json.data);
          // Suggest default next expiry (1 year from current)
          const current = new Date(json.data.expiryDate);
          current.setFullYear(current.getFullYear() + 1);
          setNewExpiryDate(toInputDate(current));
        } else {
          setError(json.error?.message || "Reminder not found");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchReminder();
  }, [id]);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpiryDate) return;

    setIsRenewing(true);
    try {
      const res = await fetch(`/api/reminders/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newExpiryDate,
          notes: renewalNotes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Renewal failed");
      }

      setShowRenewModal(false);
      setRenewalNotes("");
      fetchReminder();
    } catch (err: any) {
      alert(err.message || "Failed to renew");
    } finally {
      setIsRenewing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this reminder? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      router.push("/reminders");
    } catch (err: any) {
      alert(err.message || "Failed to delete reminder");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-gray-400">
        Loading reminder details...
      </div>
    );
  }

  if (error || !reminder) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 font-semibold">{error || "Reminder not found"}</p>
        <Link href="/reminders" className="text-blue-600 hover:underline text-sm">
          ← Back to reminders
        </Link>
      </div>
    );
  }

  const statusCfg = getStatusConfig(reminder.computedStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation and actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/reminders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to Reminders
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/reminders/${id}/edit`}
            className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => setShowRenewModal(true)}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            Mark as Renewed
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete reminder"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.67.028 2.488.083.21-.015.42-.033.632-.054V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.279c.212.021.422.039.632.054A34.42 34.42 0 0110 4zm-2.75 5.5a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6zm5 0a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-4xl p-3 bg-gray-50 rounded-2xl border border-gray-100">
              {reminder.category?.icon || "📄"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">{reminder.title}</h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Category: {reminder.category?.name || "General"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-xl">
            <div className="text-xs uppercase font-bold tracking-wider text-gray-400">Countdown</div>
            <div
              className={`text-2xl font-black mt-0.5 ${
                reminder.daysRemaining < 0
                  ? "text-red-600"
                  : reminder.daysRemaining <= 7
                  ? "text-red-600"
                  : reminder.daysRemaining <= 30
                  ? "text-amber-600"
                  : "text-green-600"
              }`}
            >
              {reminder.daysRemaining < 0
                ? `${Math.abs(reminder.daysRemaining)} DAYS EXPIRED`
                : reminder.daysRemaining === 0
                ? "EXPIRES TODAY"
                : `${reminder.daysRemaining} DAYS REMAINING`}
            </div>
            <div className="text-xs text-gray-500 mt-1 flex flex-col sm:items-end">
              <span>{formatDate(reminder.expiryDate)}</span>
              <span className="text-[11px] font-semibold text-blue-600">
                🇳🇵 {getBikramSambatDate(reminder.expiryDate).formattedEn} ({getBikramSambatDate(reminder.expiryDate).formattedNp})
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Fields Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          {reminder.ownerName && (
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">For (Person/Asset)</div>
              <div className="text-gray-900 font-medium mt-1">{reminder.ownerName}</div>
            </div>
          )}

          {reminder.referenceNumber && (
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Reference / ID Number</div>
              <div className="text-gray-900 font-medium mt-1">{reminder.referenceNumber}</div>
            </div>
          )}

          {reminder.providerName && (
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Provider / Issuer</div>
              <div className="text-gray-900 font-medium mt-1">{reminder.providerName}</div>
            </div>
          )}

          {reminder.startDate && (
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Issue / Start Date</div>
              <div className="text-gray-900 font-medium mt-1">
                {formatDate(reminder.startDate)}
                <span className="block text-[11px] text-gray-400 font-normal">
                  {getBikramSambatDate(reminder.startDate).formattedEn}
                </span>
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Expiry Date (AD & BS)</div>
            <div className="text-gray-900 font-medium mt-1">
              {formatDate(reminder.expiryDate)}
              <span className="block text-xs font-semibold text-blue-700">
                {getBikramSambatDate(reminder.expiryDate).formattedEn}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Recurrence</div>
            <div className="text-gray-900 font-medium mt-1">
              {reminder.isRecurring ? `Renews ${reminder.recurrenceType || "yearly"}` : "Non-recurring"}
            </div>
          </div>
        </div>

        {reminder.description && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Notes</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-xl">
              {reminder.description}
            </p>
          </div>
        )}
      </div>

      {/* Scanned Documents & Attachments */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <DocumentAttachments
          documents={reminder.metadata?.documents || []}
          onSave={async (updatedDocs) => {
            await fetch(`/api/reminders/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                metadata: {
                  ...(reminder.metadata || {}),
                  documents: updatedDocs,
                },
              }),
            });
            fetchReminder();
          }}
        />
      </div>

      {/* Reminder Schedule & Notifications */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>📧</span> EMAIL REMINDER SCHEDULE
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {reminder.reminderSchedules.map((s) => (
            <div
              key={s.id}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                s.enabled ? "bg-blue-50/50 border-blue-200 text-blue-900" : "bg-gray-50 border-gray-200 text-gray-400 line-through"
              }`}
            >
              <span>{s.daysBefore === 0 ? "Expiry Day" : `${s.daysBefore} days before`}</span>
              <span>{s.enabled ? "✓" : "✗"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Renewal History Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>🔄</span> RENEWAL HISTORY & AUDIT TRAIL
        </h2>

        {reminder.renewalHistory.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No past renewals recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {reminder.renewalHistory.map((hist) => (
              <div key={hist.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl text-sm">
                <div>
                  <div className="font-semibold text-gray-800">
                    Renewed on {formatDate(hist.renewedAt)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Previous Expiry: <span className="line-through">{formatDate(hist.previousExpiryDate)}</span> → New Expiry:{" "}
                    <span className="font-medium text-green-700">{formatDate(hist.newExpiryDate)}</span>
                  </div>
                  {hist.notes && <p className="text-xs text-gray-600 mt-1 italic">{hist.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mark as Renewed Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Mark as Renewed</h3>
              <button
                onClick={() => setShowRenewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Confirm renewal of <strong>{reminder.title}</strong>. Previous expiry was {formatDate(reminder.expiryDate)}.
            </p>

            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  New Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notes / Receipt Reference (Optional)
                </label>
                <textarea
                  rows={2}
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  placeholder="e.g. Paid via eSewa, Receipt #12345"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenewing}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {isRenewing ? "Saving..." : "Confirm Renewal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
