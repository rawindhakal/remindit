"use client";

import { useEffect, useState } from "react";

export default function AdminGoogleAdsPage() {
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState("");
  const [topBannerSlot, setTopBannerSlot] = useState("");
  const [sidebarSlot, setSidebarSlot] = useState("");
  const [bottomSlot, setBottomSlot] = useState("");
  const [autoAds, setAutoAds] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setEnabled(d["google_ads.enabled"]?.value === "true");
          setClientId(d["google_ads.client_id"]?.value || "");
          setTopBannerSlot(d["google_ads.top_banner_slot"]?.value || "");
          setSidebarSlot(d["google_ads.sidebar_slot"]?.value || "");
          setBottomSlot(d["google_ads.bottom_slot"]?.value || "");
          setAutoAds(d["google_ads.auto_ads"]?.value === "true");
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
            "google_ads.enabled": enabled ? "true" : "false",
            "google_ads.client_id": clientId.trim(),
            "google_ads.top_banner_slot": topBannerSlot.trim(),
            "google_ads.sidebar_slot": sidebarSlot.trim(),
            "google_ads.bottom_slot": bottomSlot.trim(),
            "google_ads.auto_ads": autoAds ? "true" : "false",
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setMessage({ type: "success", text: "Google AdSense configuration saved successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save Google Ads settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-500 text-sm">Loading Google Ads settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Google Ads & Monetization</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure Google AdSense publisher ID, ad placement units, and responsive banner slots.
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

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📢</span> Google AdSense Master Switch
            </h2>
            <p className="text-xs text-slate-400">Controls whether ad slots and monetization scripts are rendered.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-400 font-semibold">Enable Ads</span>
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
              AdSense Publisher ID (Client ID)
            </label>
            <input
              type="text"
              placeholder="e.g. ca-pub-1234567890123456"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Find this in your Google AdSense account under Account → Settings → Account information.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">AdSense Auto Ads</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically places ads in optimal places determined by Google machine learning.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoAds}
              onChange={(e) => setAutoAds(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-bold text-white mb-3">Custom Ad Slot Units</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">Top Banner Slot</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">Header</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  value={topBannerSlot}
                  onChange={(e) => setTopBannerSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500">Above dashboard overview</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">Sidebar Slot</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">Sidebar</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={sidebarSlot}
                  onChange={(e) => setSidebarSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500">Below navigation links</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">Bottom Banner Slot</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">Footer</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 5432167890"
                  value={bottomSlot}
                  onChange={(e) => setBottomSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500">Page bottom banner</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving Settings..." : "Save AdSense Settings"}
          </button>
        </div>
      </form>

      {/* Visual Placement Layout Diagram */}
      <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>📐</span> Ad Placement Visual Layout
        </h2>
        <p className="text-xs text-slate-400">
          This preview demonstrates where each configured ad unit appears in the user experience:
        </p>

        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 sm:p-6 space-y-4">
          {/* Top Banner slot preview */}
          <div className="border-2 border-dashed border-blue-500/40 bg-blue-500/5 rounded-xl p-4 text-center">
            <span className="text-xs font-bold text-blue-400">Top Banner Ad Slot</span>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Slot ID: {topBannerSlot || "(not configured)"} • Status: {enabled && topBannerSlot ? "Active" : "Hidden"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sidebar slot preview */}
            <div className="border-2 border-dashed border-purple-500/40 bg-purple-500/5 rounded-xl p-4 flex flex-col justify-center items-center text-center h-48">
              <span className="text-xs font-bold text-purple-400">Sidebar Ad Slot</span>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                {sidebarSlot || "(not configured)"}
              </p>
              <span className="mt-2 text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                160x600 Skyscraper
              </span>
            </div>

            {/* Content area mockup */}
            <div className="md:col-span-3 bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between h-48">
              <div>
                <div className="h-3 w-1/3 bg-slate-700 rounded mb-2" />
                <div className="h-2 w-2/3 bg-slate-800 rounded mb-4" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-slate-800/60 rounded" />
                  <div className="h-12 bg-slate-800/60 rounded" />
                  <div className="h-12 bg-slate-800/60 rounded" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center italic">User Dashboard & Reminders Feed</p>
            </div>
          </div>

          {/* Bottom Banner slot preview */}
          <div className="border-2 border-dashed border-amber-500/40 bg-amber-500/5 rounded-xl p-4 text-center">
            <span className="text-xs font-bold text-amber-400">Bottom Banner Ad Slot</span>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Slot ID: {bottomSlot || "(not configured)"} • Status: {enabled && bottomSlot ? "Active" : "Hidden"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
