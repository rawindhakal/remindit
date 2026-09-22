"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/components/pwa-register";

export default function NotificationsSettingsPage() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [expiryDayEnabled, setExpiryDayEnabled] = useState(true);
  const [overdueEnabled, setOverdueEnabled] = useState(false);
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);
  const [summaryDay, setSummaryDay] = useState(1); // Monday
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  const { isSubscribed, subscribeToPush, sendTestPush } = usePushNotifications();

  useEffect(() => {
    fetch("/api/notification-preferences")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setEmailEnabled(d.emailEnabled ?? true);
          setPushEnabled(d.pushEnabled ?? true);
          setExpiryDayEnabled(d.expiryDayEnabled ?? true);
          setOverdueEnabled(d.overdueEnabled ?? false);
          setWeeklySummaryEnabled(d.weeklySummaryEnabled ?? true);
          setSummaryDay(d.summaryDay ?? 1);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedMessage(false);
    try {
      const res = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEnabled,
          pushEnabled,
          expiryDayEnabled,
          overdueEnabled,
          weeklySummaryEnabled,
          summaryDay,
        }),
      });

      if (res.ok) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPushClick = async () => {
    setIsTestingPush(true);
    await sendTestPush();
    setIsTestingPush(false);
  };

  if (isLoading) return <div className="text-gray-400 text-sm">Loading preferences...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Control how and when you receive renewal alerts via Email and Web Push.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
          Preferences saved successfully!
        </div>
      )}

      <div className="space-y-4 max-w-xl">
        {/* PWA Web Push Section */}
        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 text-sm flex items-center gap-1.5">
                <span>🔔</span> Device Web Push Notifications
              </h3>
              <p className="text-xs text-blue-700">Receive instant push notifications on your phone or desktop.</p>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded-sm cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-blue-100/80 flex items-center justify-between text-xs">
            <span className="text-blue-900 font-medium">
              Browser Subscription:{" "}
              <strong className={isSubscribed ? "text-green-700" : "text-amber-700"}>
                {isSubscribed ? "Active on this browser" : "Not enabled yet"}
              </strong>
            </span>
            {!isSubscribed ? (
              <button
                type="button"
                onClick={subscribeToPush}
                className="px-3 py-1 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Enable Push
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTestPushClick}
                disabled={isTestingPush}
                className="px-3 py-1 bg-white border border-blue-200 text-blue-700 font-semibold rounded-lg hover:bg-blue-50"
              >
                {isTestingPush ? "Testing..." : "Send Test Push"}
              </button>
            )}
          </div>
        </div>

        {/* Master Email Switch */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Email Notifications</h3>
            <p className="text-xs text-gray-500">Master toggle to enable or disable all outgoing email reminders.</p>
          </div>
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded-sm cursor-pointer"
          />
        </div>

        {/* Expiry Day Emails */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Expiry-Day Emails</h3>
            <p className="text-xs text-gray-500">Receive an urgent notification on the exact day an item expires.</p>
          </div>
          <input
            type="checkbox"
            disabled={!emailEnabled}
            checked={expiryDayEnabled}
            onChange={(e) => setExpiryDayEnabled(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded-sm cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Overdue Emails */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Overdue Reminders</h3>
            <p className="text-xs text-gray-500">Receive follow-up alerts after an obligation has already expired.</p>
          </div>
          <input
            type="checkbox"
            disabled={!emailEnabled}
            checked={overdueEnabled}
            onChange={(e) => setOverdueEnabled(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded-sm cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Weekly Summary */}
        <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Weekly Renewal Summary</h3>
              <p className="text-xs text-gray-500">A weekly digest of renewals coming up in the next 7 and 30 days.</p>
            </div>
            <input
              type="checkbox"
              disabled={!emailEnabled}
              checked={weeklySummaryEnabled}
              onChange={(e) => setWeeklySummaryEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded-sm cursor-pointer disabled:opacity-40"
            />
          </div>

          {weeklySummaryEnabled && (
            <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">Send summary every:</span>
              <select
                value={summaryDay}
                onChange={(e) => setSummaryDay(parseInt(e.target.value))}
                aria-label="Weekly Summary Day"
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday (Recommended)</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
