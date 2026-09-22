"use client";

import { useEffect, useState } from "react";

export default function AdminGoogleLoginPage() {
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setEnabled(d["google_auth.enabled"]?.value === "true");
          setClientId(d["google_auth.client_id"]?.value || "");
          setClientSecret(d["google_auth.client_secret"]?.value || "");
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            "google_auth.enabled": enabled ? "true" : "false",
            "google_auth.client_id": clientId,
            "google_auth.client_secret": clientSecret,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setMessage({ type: "success", text: "Google OAuth configuration saved." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save Google settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-500 text-sm">Loading Google OAuth settings...</div>;
  }

  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback/google` : "http://localhost:3006/api/auth/callback/google";

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Google OAuth Login Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure Google Cloud OAuth credentials for single sign-on (SSO).
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

      <form onSubmit={handleSave} className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Google Sign-In</h2>
            <p className="text-xs text-slate-400">Allow users to sign in and register with their Google accounts.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-400 font-semibold">Enable Google Login</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded-sm cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Google OAuth Client ID
            </label>
            <input
              type="text"
              placeholder="e.g. 1234567890-abc.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Google OAuth Client Secret
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••••••••••••••••••"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-white">Authorized Redirect URI for Google Cloud Console:</p>
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300">
              <span className="select-all">{redirectUri}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Add this exact URI under: Google Cloud Console → APIs & Services → Credentials → Authorized redirect URIs.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Google OAuth Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
