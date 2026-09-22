"use client";

import { useEffect, useState } from "react";

export default function ProfileSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kathmandu");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setName(json.data.name || "");
          setEmail(json.data.email || "");
          setTimezone(json.data.timezone || "Asia/Kathmandu");
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-gray-400 text-sm">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Profile & Timezone</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Your personal information and regional timezone for accurate morning reminder delivery.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            disabled
            value={email}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed directly.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Timezone (Crucial for Reminder Schedules)
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Asia/Kathmandu">Asia/Kathmandu (Nepal Time, UTC+5:45)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4:00)</option>
            <option value="Asia/Qatar">Asia/Qatar (AST, UTC+3:00)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8:00)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST, UTC+10:00)</option>
            <option value="America/New_York">America/New_York (EST, UTC-5:00)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST, UTC-8:00)</option>
            <option value="Europe/London">Europe/London (GMT, UTC+0:00)</option>
          </select>
          <p className="text-[11px] text-gray-400 mt-1">
            Reminders are scheduled based on 08:00 AM in your selected timezone.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
