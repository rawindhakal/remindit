"use client";

import { useEffect, useState } from "react";

export default function AdminPushSettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [subject, setSubject] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Broadcast state
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastUrl, setBroadcastUrl] = useState("/dashboard");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Fetch settings
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setEnabled(d["push.enabled"]?.value !== "false");
          setPublicKey(d["push.vapid_public_key"]?.value || "");
          setPrivateKey(d["push.vapid_private_key"]?.value || "");
          setSubject(d["push.subject"]?.value || "");
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));

    // Fetch subscriber count
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.subscribersCount !== undefined) {
          setSubscriberCount(json.data.subscribersCount);
        }
      })
      .catch(console.error);
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
            "push.enabled": enabled ? "true" : "false",
            "push.vapid_public_key": publicKey.trim(),
            "push.vapid_private_key": privateKey.trim(),
            "push.subject": subject.trim(),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setMessage({ type: "success", text: "Push notification configuration saved successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save push settings." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateKeys = async () => {
    if (!confirm("Generating a new VAPID keypair will require users to re-subscribe to push notifications. Are you sure?")) {
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/vapid-generate", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setPublicKey(json.data.publicKey);
      setPrivateKey(json.data.privateKey);
      setMessage({ type: "success", text: "New VAPID keypair generated! Click 'Save Push Settings' below to apply." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to generate VAPID keys." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;

    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await fetch("/api/admin/push-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          body: broadcastBody,
          url: broadcastUrl || "/dashboard",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setBroadcastResult({
        type: "success",
        text: json.data?.message || "Broadcast sent successfully.",
      });
      setBroadcastTitle("");
      setBroadcastBody("");
    } catch (err: any) {
      setBroadcastResult({
        type: "error",
        text: err.message || "Failed to broadcast notification.",
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-500 text-sm">Loading Push Notification settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Push Notifications & Broadcast</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure Web Push VAPID credentials, subscriber endpoints, and broadcast announcements.
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">
            📲
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Active Push Subscribers</p>
            <p className="text-2xl font-black text-white">{subscriberCount}</p>
            <p className="text-[11px] text-slate-500">Registered browser service worker endpoints</p>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">
            ⚡
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Push Gateway Status</p>
            <p className="text-2xl font-black text-white">{enabled ? "Operational" : "Disabled"}</p>
            <p className="text-[11px] text-slate-500">
              {publicKey && privateKey ? "VAPID keypair configured" : "Missing keys"}
            </p>
          </div>
        </div>
      </div>

      {/* VAPID Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🔑</span> VAPID Credentials
            </h2>
            <p className="text-xs text-slate-400">Voluntary Application Server Identification for Web Push.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleGenerateKeys}
              disabled={isGenerating}
              className="text-[11px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-blue-400 font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              {isGenerating ? "Generating..." : "⚡ Generate New Keys"}
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-400 font-semibold">Enable Push</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-sm cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              VAPID Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY)
            </label>
            <textarea
              rows={2}
              placeholder="Base64-encoded URL-safe public key"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px] resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              VAPID Private Key (VAPID_PRIVATE_KEY)
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••••••••••••••••••"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              VAPID Contact Subject (Email or URL)
            </label>
            <input
              type="text"
              placeholder="mailto:admin@example.com"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Required by push services (Mozilla, Google, Apple) to contact the server operator.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving Settings..." : "Save Push Settings"}
          </button>
        </div>
      </form>

      {/* Live Push Notification Broadcast Box */}
      <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📢</span> Instant Broadcast to All Devices
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dispatch an immediate push alert to all registered PWA browsers and mobile devices.
          </p>
        </div>

        {broadcastResult && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold border ${
              broadcastResult.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {broadcastResult.text}
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Notification Title
            </label>
            <input
              type="text"
              placeholder="e.g. 🔔 RenewIt System Maintenance or Feature Update"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Notification Message Body
            </label>
            <textarea
              rows={3}
              placeholder="e.g. A new update has been deployed. Check your renewal dashboard now!"
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Target Click URL
            </label>
            <input
              type="text"
              placeholder="/dashboard"
              value={broadcastUrl}
              onChange={(e) => setBroadcastUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[11px] text-slate-500">
              Will broadcast to {subscriberCount} registered subscriber{subscriberCount === 1 ? "" : "s"}.
            </span>
            <button
              type="submit"
              disabled={isBroadcasting || !broadcastTitle || !broadcastBody}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isBroadcasting ? (
                <>
                  <span className="animate-spin text-sm">↻</span> Broadcasting...
                </>
              ) : (
                <>
                  <span>🚀</span> Send Broadcast Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
