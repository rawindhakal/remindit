"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function DataSettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `renewit-reminders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      "Are you absolutely sure? This will permanently delete all your reminders, history, and settings.\n\nType 'DELETE' to confirm:"
    );

    if (confirmation !== "DELETE") {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete account");

      signOut({ callbackUrl: "/" });
    } catch (err: any) {
      alert(err.message || "Error deleting account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Export Section */}
      <div className="space-y-3 pb-8 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Export Your Data</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Download a full CSV copy of all your active, expired, and historical renewals.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            {isExporting ? "Generating CSV..." : "Download Reminders CSV"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Once you delete your account, there is no going back. Please be certain.
          </p>
        </div>

        <div className="p-5 border border-red-200 bg-red-50/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Delete this account</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently remove your account, profile, all reminders, and scheduled emails.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shrink-0 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
