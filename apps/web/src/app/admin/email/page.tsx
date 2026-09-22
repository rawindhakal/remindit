"use client";

import { useEffect, useState } from "react";

export default function AdminEmailSettingsPage() {
  const [gmailUser, setGmailUser] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [fromName, setFromName] = useState("RenewIt");
  const [fromAddress, setFromAddress] = useState("noreply@renewit.app");
  const [emailEnabled, setEmailEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Test email state
  const [testRecipient, setTestRecipient] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setGmailUser(d["email.gmail_user"]?.value || "");
          setGmailAppPassword(d["email.gmail_app_password"]?.value || "");
          setFromName(d["email.from_name"]?.value || "RenewIt");
          setFromAddress(d["email.from_address"]?.value || "noreply@renewit.app");
          setEmailEnabled(d["email.enabled"]?.value !== "false");
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            "email.gmail_user": gmailUser,
            "email.gmail_app_password": gmailAppPassword,
            "email.from_name": fromName,
            "email.from_address": fromAddress,
            "email.enabled": emailEnabled ? "true" : "false",
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setMessage({ type: "success", text: "Email configuration saved successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save email settings." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testRecipient || undefined }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setTestResult(`Success: ${json.data.message}`);
    } catch (err: any) {
      setTestResult(`Failed: ${err.message || "Could not send test email"}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-500 text-sm">Loading email configuration...</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Email & SMTP Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure Gmail SMTP credentials, sender details, and verify email delivery.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-sm font-semibold border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Gmail SMTP Integration</h2>
            <p className="text-xs text-slate-400">Uses Gmail App Passwords for secure outgoing delivery.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-400 font-semibold">Enable Email</span>
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded-sm cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Gmail Address (GMAIL_USER)
            </label>
            <input
              type="email"
              placeholder="e.g. notifications@example.com"
              value={gmailUser}
              onChange={(e) => setGmailUser(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Gmail 16-Character App Password (GMAIL_APP_PASSWORD)
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={gmailAppPassword}
              onChange={(e) => setGmailAppPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Generated from: Google Account → Security → 2-Step Verification → App Passwords.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                Sender Display Name
              </label>
              <input
                type="text"
                placeholder="RenewIt Notifications"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                From Email Address
              </label>
              <input
                type="email"
                placeholder="noreply@renewit.app"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving Settings..." : "Save Email Settings"}
          </button>
        </div>
      </form>

      {/* Live Email Test Box */}
      <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🧪</span> Send Test Email
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Send an instant test email to verify your SMTP connection and credentials.
          </p>
        </div>

        <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Recipient email (defaults to your admin email)"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSendingTest}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {isSendingTest ? "Sending Test..." : "Send Test Now"}
          </button>
        </form>

        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              testResult.startsWith("Success")
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
}
